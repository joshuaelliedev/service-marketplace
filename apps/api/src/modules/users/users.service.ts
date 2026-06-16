import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model, Types } from "mongoose";
import { WalletLedgerService } from "../wallet/wallet-ledger.service";
import { WalletTransactionType } from "../wallet/wallet-transaction.schema";
import {
  User,
  UserDocument,
  UserRole,
  KycStatus,
  SystemWalletKind,
} from "./user.schema";

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => WalletLedgerService))
    private readonly ledger: WalletLedgerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemWallet(SystemWalletKind.COMPANY, "Company wallet");
    await this.ensureSystemWallet(SystemWalletKind.VAT, "VAT wallet");
    await this.ensureSeedAdmin();
  }

  private async ensureSystemWallet(
    kind: SystemWalletKind,
    fullName: string,
  ): Promise<void> {
    const exists = await this.userModel.exists({ systemWalletKind: kind });
    if (exists) return;
    const email = `__${kind}_wallet__@local.dev`;
    const hash = await bcrypt.hash(
      `pw-${new Types.ObjectId().toString()}-${Date.now()}`,
      10,
    );
    await this.userModel.create({
      email,
      passwordHash: hash,
      role: UserRole.ADMIN,
      fullName,
      kycStatus: KycStatus.APPROVED,
      isSystemWallet: true,
      systemWalletKind: kind,
      walletAvailableCents: 0,
      walletEscrowCents: 0,
      providerFeePercent: 0,
      providerFeeFixedCents: 0,
    });
  }

  private async ensureSeedAdmin(): Promise<void> {
    const email =
      process.env.ADMIN_SEED_EMAIL?.toLowerCase().trim() ?? "admin@local.dev";
    const password =
      process.env.ADMIN_SEED_PASSWORD ?? "ChangeMeAdmin123!";
    const exists = await this.userModel.exists({ email });
    if (exists) return;
    const passwordHash = await bcrypt.hash(password, 10);
    await this.userModel.create({
      email,
      passwordHash,
      role: UserRole.ADMIN,
      fullName: "Seed admin",
      kycStatus: KycStatus.APPROVED,
      isSystemWallet: false,
      systemWalletKind: null,
      walletAvailableCents: 0,
      walletEscrowCents: 0,
      providerFeePercent: 0,
      providerFeeFixedCents: 0,
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id);
  }

  async createUser(input: {
    email: string;
    password: string;
    fullName?: string;
    role: UserRole.CUSTOMER | UserRole.PROVIDER;
  }): Promise<UserDocument> {
    const email = input.email.toLowerCase().trim();
    const taken = await this.userModel.exists({ email });
    if (taken) throw new BadRequestException("Email already registered");
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.userModel.create({
      email,
      passwordHash,
      role: input.role,
      fullName: input.fullName?.trim(),
      kycStatus: KycStatus.NONE,
      walletAvailableCents: 0,
      walletEscrowCents: 0,
      providerFeePercent: 0,
      providerFeeFixedCents: 0,
      isSystemWallet: false,
      systemWalletKind: null,
    });
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument> {
    const user = await this.findByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (user.isSystemWallet)
      throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return user;
  }

  async getCompanyWalletUser(): Promise<UserDocument> {
    const u = await this.userModel.findOne({
      systemWalletKind: SystemWalletKind.COMPANY,
    });
    if (!u) throw new Error("Company wallet missing");
    return u;
  }

  async getVatWalletUser(): Promise<UserDocument> {
    const u = await this.userModel.findOne({
      systemWalletKind: SystemWalletKind.VAT,
    });
    if (!u) throw new Error("VAT wallet missing");
    return u;
  }

  isWalletSettled(user: UserDocument): boolean {
    return user.walletAvailableCents >= 0;
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.userModel.countDocuments({ role, isSystemWallet: false });
  }

  async countHumans(): Promise<number> {
    return this.userModel.countDocuments({ isSystemWallet: false });
  }

  async listKycPending(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.PROVIDER, kycStatus: KycStatus.PENDING })
      .select("-passwordHash")
      .sort({ updatedAt: -1 })
      .exec();
  }

  async setKycDecision(
    userId: string,
    approve: boolean,
    note?: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.role !== UserRole.PROVIDER)
      throw new BadRequestException("Not a provider");
    user.kycStatus = approve ? KycStatus.APPROVED : KycStatus.REJECTED;
    user.kycAdminNote = note?.trim();
    await user.save();
    return user;
  }

  async submitKyc(userId: string, documentUrl: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.role !== UserRole.PROVIDER)
      throw new BadRequestException("Not a provider");
    if (user.kycStatus === KycStatus.APPROVED)
      throw new BadRequestException("Already approved");
    user.kycStatus = KycStatus.PENDING;
    user.kycDocumentUrl = documentUrl.trim();
    user.kycAdminNote = undefined;
    await user.save();
    return user;
  }

  async reserveForBooking(
    customerId: string,
    amountCents: number,
    referenceNumber: string,
  ): Promise<UserDocument> {
    const before = await this.findById(customerId);
    if (!before) throw new BadRequestException("User not found");

    const res = await this.userModel.findOneAndUpdate(
      {
        _id: customerId,
        walletAvailableCents: { $gte: amountCents },
        isSystemWallet: false,
      },
      {
        $inc: {
          walletAvailableCents: -amountCents,
          walletEscrowCents: amountCents,
        },
      },
      { new: true },
    );
    if (!res) throw new BadRequestException("Insufficient wallet balance");

    await this.ledger.record({
      userId: customerId,
      type: WalletTransactionType.BOOKING_ESCROW,
      referenceNumber,
      balanceBeforeCents: before.walletAvailableCents,
      balanceAfterCents: res.walletAvailableCents,
    });
    return res;
  }

  async releaseEscrowToAvailable(
    customerId: string,
    amountCents: number,
    referenceNumber: string,
  ): Promise<void> {
    const before = await this.findById(customerId);
    if (!before) throw new BadRequestException("User not found");

    const res = await this.userModel.findOneAndUpdate(
      { _id: customerId, walletEscrowCents: { $gte: amountCents } },
      {
        $inc: {
          walletEscrowCents: -amountCents,
          walletAvailableCents: amountCents,
        },
      },
      { new: true },
    );
    if (!res) throw new BadRequestException("Refund from escrow failed");

    await this.ledger.record({
      userId: customerId,
      type: WalletTransactionType.BOOKING_ESCROW_RELEASE,
      referenceNumber,
      balanceBeforeCents: before.walletAvailableCents,
      balanceAfterCents: res.walletAvailableCents,
    });
  }

  /** Cash accept: deduct service fee from provider → company + VAT wallets. */
  async collectCashServiceFee(input: {
    providerId: string;
    serviceFeeCents: number;
    companyFeeCents: number;
    vatFeeCents: number;
    referenceNumber: string;
  }): Promise<void> {
    const before = await this.findById(input.providerId);
    if (!before) throw new BadRequestException("Provider not found");

    const provider = await this.userModel.findOneAndUpdate(
      {
        _id: input.providerId,
        walletAvailableCents: { $gte: input.serviceFeeCents },
        isSystemWallet: false,
      },
      { $inc: { walletAvailableCents: -input.serviceFeeCents } },
      { new: true },
    );
    if (!provider) {
      throw new BadRequestException(
        "Insufficient provider balance for service fee",
      );
    }

    await this.ledger.record({
      userId: input.providerId,
      type: WalletTransactionType.SERVICE_FEE,
      referenceNumber: input.referenceNumber,
      balanceBeforeCents: before.walletAvailableCents,
      balanceAfterCents: provider.walletAvailableCents,
    });

    const company = await this.getCompanyWalletUser();
    const vat = await this.getVatWalletUser();
    await this.userModel.updateOne(
      { _id: company.id },
      { $inc: { walletAvailableCents: input.companyFeeCents } },
    );
    await this.userModel.updateOne(
      { _id: vat.id },
      { $inc: { walletAvailableCents: input.vatFeeCents } },
    );
  }

  /** Reverse cash service fee on cancel after accept. */
  async reverseCashServiceFee(input: {
    providerId: string;
    serviceFeeCents: number;
    companyFeeCents: number;
    vatFeeCents: number;
    referenceNumber: string;
  }): Promise<void> {
    const before = await this.findById(input.providerId);
    if (!before) throw new BadRequestException("Provider not found");

    const provider = await this.userModel.findOneAndUpdate(
      { _id: input.providerId },
      { $inc: { walletAvailableCents: input.serviceFeeCents } },
      { new: true },
    );
    if (!provider) throw new BadRequestException("Provider not found");

    await this.ledger.record({
      userId: input.providerId,
      type: WalletTransactionType.SERVICE_FEE_REVERSAL,
      referenceNumber: input.referenceNumber,
      balanceBeforeCents: before.walletAvailableCents,
      balanceAfterCents: provider.walletAvailableCents,
    });

    const company = await this.getCompanyWalletUser();
    const vat = await this.getVatWalletUser();
    await this.userModel.updateOne(
      { _id: company.id },
      { $inc: { walletAvailableCents: -input.companyFeeCents } },
    );
    await this.userModel.updateOne(
      { _id: vat.id },
      { $inc: { walletAvailableCents: -input.vatFeeCents } },
    );
  }

  /** Wallet booking completion: escrow → provider base + company + VAT. */
  async payoutCompletedWalletBooking(input: {
    customerId: string;
    providerId: string;
    companyWalletId: string;
    vatWalletId: string;
    customerTotalCents: number;
    basePriceCents: number;
    companyFeeCents: number;
    vatFeeCents: number;
    referenceNumber: string;
  }): Promise<void> {
    const c = await this.userModel.findOneAndUpdate(
      {
        _id: input.customerId,
        walletEscrowCents: { $gte: input.customerTotalCents },
      },
      { $inc: { walletEscrowCents: -input.customerTotalCents } },
      { new: true },
    );
    if (!c) throw new BadRequestException("Escrow release failed");

    const providerBefore = await this.findById(input.providerId);
    if (!providerBefore) throw new BadRequestException("Provider not found");

    const providerAfter = await this.userModel.findOneAndUpdate(
      { _id: input.providerId },
      { $inc: { walletAvailableCents: input.basePriceCents } },
      { new: true },
    );
    if (!providerAfter) throw new BadRequestException("Provider not found");

    await this.ledger.record({
      userId: input.providerId,
      type: WalletTransactionType.BOOKING_EARNINGS,
      referenceNumber: input.referenceNumber,
      balanceBeforeCents: providerBefore.walletAvailableCents,
      balanceAfterCents: providerAfter.walletAvailableCents,
    });

    await this.userModel.updateOne(
      { _id: input.companyWalletId },
      { $inc: { walletAvailableCents: input.companyFeeCents } },
    );
    await this.userModel.updateOne(
      { _id: input.vatWalletId },
      { $inc: { walletAvailableCents: input.vatFeeCents } },
    );
  }

  /** Full refund reversal after completed booking. */
  async reverseCompletedPayout(input: {
    customerId: string;
    providerId: string;
    companyWalletId: string;
    vatWalletId: string;
    customerTotalCents: number;
    basePriceCents: number;
    companyFeeCents: number;
    vatFeeCents: number;
    referenceNumber: string;
  }): Promise<void> {
    const customerBefore = await this.findById(input.customerId);
    if (!customerBefore) throw new BadRequestException("Customer not found");

    const customerAfter = await this.userModel.findOneAndUpdate(
      { _id: input.customerId },
      { $inc: { walletAvailableCents: input.customerTotalCents } },
      { new: true },
    );
    if (!customerAfter) throw new BadRequestException("Customer not found");

    await this.ledger.record({
      userId: input.customerId,
      type: WalletTransactionType.REFUND,
      referenceNumber: input.referenceNumber,
      balanceBeforeCents: customerBefore.walletAvailableCents,
      balanceAfterCents: customerAfter.walletAvailableCents,
    });

    const providerBefore = await this.findById(input.providerId);
    if (!providerBefore) throw new BadRequestException("Provider not found");

    const providerAfter = await this.userModel.findOneAndUpdate(
      { _id: input.providerId },
      { $inc: { walletAvailableCents: -input.basePriceCents } },
      { new: true },
    );
    if (!providerAfter) throw new BadRequestException("Provider not found");

    await this.ledger.record({
      userId: input.providerId,
      type: WalletTransactionType.REFUND,
      referenceNumber: input.referenceNumber,
      balanceBeforeCents: providerBefore.walletAvailableCents,
      balanceAfterCents: providerAfter.walletAvailableCents,
    });

    await this.userModel.updateOne(
      { _id: input.companyWalletId },
      { $inc: { walletAvailableCents: -input.companyFeeCents } },
    );
    await this.userModel.updateOne(
      { _id: input.vatWalletId },
      { $inc: { walletAvailableCents: -input.vatFeeCents } },
    );
  }

  async adminTopUp(
    userId: string,
    amountCents: number,
    referenceNumber: string,
    type: WalletTransactionType.CASH_IN | WalletTransactionType.ADMIN_TOPUP = WalletTransactionType.ADMIN_TOPUP,
  ): Promise<UserDocument> {
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      throw new BadRequestException("Invalid amount");
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.isSystemWallet) throw new BadRequestException("Invalid target");

    const before = user.walletAvailableCents;
    user.walletAvailableCents += amountCents;
    await user.save();

    await this.ledger.record({
      userId,
      type,
      referenceNumber,
      balanceBeforeCents: before,
      balanceAfterCents: user.walletAvailableCents,
    });
    return user;
  }

  async adminCashOut(
    userId: string,
    amountCents: number,
    referenceNumber: string,
  ): Promise<UserDocument> {
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      throw new BadRequestException("Invalid amount");
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.walletAvailableCents < 0) {
      throw new BadRequestException("Settle negative balance before cash out");
    }

    const before = user.walletAvailableCents;
    const res = await this.userModel.findOneAndUpdate(
      {
        _id: userId,
        walletAvailableCents: { $gte: amountCents },
        isSystemWallet: false,
      },
      { $inc: { walletAvailableCents: -amountCents } },
      { new: true },
    );
    if (!res) throw new BadRequestException("Insufficient available balance");

    await this.ledger.record({
      userId,
      type: WalletTransactionType.CASH_OUT,
      referenceNumber,
      balanceBeforeCents: before,
      balanceAfterCents: res.walletAvailableCents,
    });
    return res;
  }
}
