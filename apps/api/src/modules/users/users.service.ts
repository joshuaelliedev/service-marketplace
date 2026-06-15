import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model, Types } from "mongoose";
import { User, UserDocument, UserRole, KycStatus } from "./user.schema";

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemWallet();
    await this.ensureSeedAdmin();
  }

  private async ensureSystemWallet(): Promise<void> {
    const email = "__platform_wallet__@local.dev";
    const exists = await this.userModel.exists({ email });
    if (exists) return;
    const hash = await bcrypt.hash(
      `pw-${new Types.ObjectId().toString()}-${Date.now()}`,
      10,
    );
    await this.userModel.create({
      email,
      passwordHash: hash,
      role: UserRole.ADMIN,
      fullName: "Platform wallet",
      kycStatus: KycStatus.APPROVED,
      isSystemWallet: true,
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
      providerFeePercent: 10,
      providerFeeFixedCents: 0,
      isSystemWallet: false,
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

  async getPlatformWalletUser(): Promise<UserDocument> {
    const u = await this.userModel.findOne({ isSystemWallet: true });
    if (!u) throw new Error("Platform wallet missing");
    return u;
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

  async updateProviderFees(
    providerId: string,
    feePercent: number,
    feeFixedCents: number,
  ): Promise<UserDocument> {
    const user = await this.findById(providerId);
    if (!user) throw new BadRequestException("User not found");
    if (user.role !== UserRole.PROVIDER)
      throw new BadRequestException("Not a provider");
    user.providerFeePercent = feePercent;
    user.providerFeeFixedCents = feeFixedCents;
    await user.save();
    return user;
  }

  async reserveForBooking(
    customerId: string,
    amountCents: number,
  ): Promise<UserDocument> {
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
    return res;
  }

  async releaseEscrowToAvailable(
    customerId: string,
    amountCents: number,
  ): Promise<void> {
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
  }

  async payoutCompletedBooking(input: {
    customerId: string;
    providerId: string;
    platformUserId: string;
    customerTotalCents: number;
    basePriceCents: number;
    platformFeeCents: number;
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
    await this.userModel.updateOne(
      { _id: input.providerId },
      { $inc: { walletAvailableCents: input.basePriceCents } },
    );
    await this.userModel.updateOne(
      { _id: input.platformUserId },
      { $inc: { walletAvailableCents: input.platformFeeCents } },
    );
  }

  async adminTopUp(
    userId: string,
    amountCents: number,
  ): Promise<UserDocument> {
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      throw new BadRequestException("Invalid amount");
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.isSystemWallet) throw new BadRequestException("Invalid target");
    user.walletAvailableCents += amountCents;
    await user.save();
    return user;
  }

  async adminCashOut(userId: string, amountCents: number): Promise<UserDocument> {
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      throw new BadRequestException("Invalid amount");
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
    return res;
  }
}
