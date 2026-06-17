import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ImageKitService } from "../imagekit/imagekit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { KycStatus, UserDocument, UserRole } from "../users/user.schema";
import { UsersService } from "../users/users.service";
import {
  KycDocumentPurpose,
  KycIdType,
  KycProviderType,
  ProviderKyc,
  ProviderKycDocument,
} from "./kyc.schema";
import type { SubmitKycDto } from "./submit-kyc.dto";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class KycService {
  constructor(
    @InjectModel(ProviderKyc.name)
    private readonly kycModel: Model<ProviderKycDocument>,
    private readonly users: UsersService,
    private readonly imagekit: ImageKitService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMine(userId: string) {
    const user = await this.requireProvider(userId);
    const kyc = await this.kycModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    return {
      kycStatus: user.kycStatus,
      kycAdminNote: user.kycAdminNote ?? null,
      profile: kyc ? this.sanitizeProfile(kyc) : null,
    };
  }

  async uploadDocument(
    userId: string,
    purpose: string,
    file: Express.Multer.File,
  ) {
    const user = await this.requireProvider(userId);
    if (user.kycStatus === KycStatus.APPROVED) {
      throw new BadRequestException("KYC already approved");
    }
    if (user.kycStatus === KycStatus.PENDING) {
      throw new BadRequestException("KYC is pending review; wait for a decision before uploading");
    }
    const docPurpose = this.parsePurpose(purpose);
    if (!file?.buffer?.length) throw new BadRequestException("File required");
    if (file.size > MAX_BYTES) throw new BadRequestException("File must be 5 MB or smaller");
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException("Only JPEG, PNG, and WebP images are allowed");
    }

    const { filePath } = await this.imagekit.uploadKycFile({
      userId,
      purpose: docPurpose,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    const pathField = purposeToPathField(docPurpose);
    const kyc = await this.kycModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { [pathField]: filePath } },
      { upsert: true, new: true },
    );
    return { purpose: docPurpose, uploaded: true, profile: this.sanitizeProfile(kyc) };
  }

  async submit(userId: string, body: SubmitKycDto) {
    const user = await this.requireProvider(userId);
    if (user.kycStatus === KycStatus.APPROVED) {
      throw new BadRequestException("KYC already approved");
    }
    if (user.kycStatus === KycStatus.PENDING) {
      throw new BadRequestException("KYC already submitted and pending review");
    }
    if (!body.declarationsAccepted) {
      throw new BadRequestException("You must accept the declarations");
    }
    if (body.providerType === KycProviderType.BUSINESS) {
      if (!body.businessName?.trim() || !body.businessRegistrationNumber?.trim()) {
        throw new BadRequestException("Business name and registration number are required");
      }
    }

    const kyc = await this.kycModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!kyc?.idFrontPath || !kyc.selfiePath) {
      throw new BadRequestException("Upload ID front and selfie before submitting");
    }
    if (this.idBackRequired(body.idType) && !kyc.idBackPath) {
      throw new BadRequestException("Upload ID back for this ID type");
    }

    kyc.legalFullName = body.legalFullName.trim();
    kyc.dateOfBirthYmd = body.dateOfBirthYmd;
    kyc.nationality = body.nationality.trim();
    kyc.mobileNumber = body.mobileNumber.trim();
    kyc.serviceCity = body.serviceCity.trim();
    kyc.serviceProvince = body.serviceProvince.trim();
    kyc.addressLine1 = body.addressLine1.trim();
    kyc.barangay = body.barangay?.trim();
    kyc.city = body.city.trim();
    kyc.province = body.province.trim();
    kyc.postalCode = body.postalCode?.trim();
    kyc.idType = body.idType;
    kyc.idNumber = body.idNumber.trim();
    kyc.idExpiryYmd = body.idExpiryYmd;
    kyc.providerType = body.providerType;
    kyc.businessName =
      body.providerType === KycProviderType.BUSINESS ? body.businessName?.trim() : undefined;
    kyc.businessRegistrationNumber =
      body.providerType === KycProviderType.BUSINESS
        ? body.businessRegistrationNumber?.trim()
        : undefined;
    kyc.declarationsAcceptedAt = new Date();
    kyc.submittedAt = new Date();
    kyc.reviewedAt = undefined;
    kyc.reviewedBy = undefined;
    await kyc.save();

    user.kycStatus = KycStatus.PENDING;
    user.kycAdminNote = undefined;
    await user.save();

    await this.notifications.notify(
      userId,
      "KYC submitted",
      "Your identity verification was submitted and is pending admin review.",
      "kyc_submitted",
    );

    return {
      kycStatus: user.kycStatus,
      profile: this.sanitizeProfile(kyc),
    };
  }

  async listPendingForAdmin() {
    const users = await this.users.listKycPending();
    const ids = users.map((u) => new Types.ObjectId(this.userIdOf(u)));
    const profiles = await this.kycModel.find({ userId: { $in: ids } }).lean();
    const byUser = new Map(profiles.map((p) => [p.userId.toString(), p]));
    return users.map((u) => {
      const userId = this.userIdOf(u);
      return {
        _id: userId,
        id: userId,
        email: u.email,
        fullName: u.fullName,
        kycStatus: u.kycStatus,
        kycAdminNote: u.kycAdminNote,
        profile: byUser.get(userId) ? this.sanitizeProfile(byUser.get(userId)!) : null,
      };
    });
  }

  private userIdOf(user: { id?: string; _id?: { toString(): string } }): string {
    if (user.id) return user.id;
    if (user._id) return user._id.toString();
    throw new BadRequestException("Invalid user record");
  }

  async decide(adminId: string, userId: string, approve: boolean, note?: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.role !== UserRole.PROVIDER) throw new BadRequestException("Not a provider");
    if (user.kycStatus !== KycStatus.PENDING) {
      throw new BadRequestException("Provider KYC is not pending");
    }

    const kyc = await this.kycModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!kyc?.submittedAt) throw new BadRequestException("No KYC submission on file");

    user.kycStatus = approve ? KycStatus.APPROVED : KycStatus.REJECTED;
    user.kycAdminNote = note?.trim() || (approve ? "Approved" : "Rejected");
    await user.save();

    kyc.reviewedAt = new Date();
    kyc.reviewedBy = new Types.ObjectId(adminId);
    await kyc.save();

    await this.notifications.notify(
      userId,
      approve ? "KYC approved" : "KYC rejected",
      approve
        ? "Your identity verification was approved. You can publish listings, accept bookings, and cash out."
        : `Your identity verification was rejected.${note ? ` Reason: ${note}` : " You may update and resubmit."}`,
      approve ? "kyc_approved" : "kyc_rejected",
    );

    return {
      _id: user.id,
      email: user.email,
      kycStatus: user.kycStatus,
      kycAdminNote: user.kycAdminNote,
      profile: this.sanitizeProfile(kyc),
    };
  }

  async streamDocumentForProvider(userId: string, purpose: string) {
    const user = await this.requireProvider(userId);
    const kyc = await this.kycModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!kyc) throw new NotFoundException("KYC record not found");
    const docPurpose = this.parsePurpose(purpose);
    const filePath = this.resolvePath(kyc, docPurpose);
    if (!filePath) throw new NotFoundException("Document not uploaded");
    if (user.kycStatus === KycStatus.NONE && !this.isDraftOwnerViewAllowed(kyc, docPurpose)) {
      throw new ForbiddenException("Document not available");
    }
    return this.imagekit.downloadFile(filePath);
  }

  async streamDocumentForAdmin(userId: string, purpose: string) {
    if (!Types.ObjectId.isValid(userId)) throw new NotFoundException("User not found");
    const kyc = await this.kycModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!kyc) throw new NotFoundException("KYC record not found");
    const docPurpose = this.parsePurpose(purpose);
    const filePath = this.resolvePath(kyc, docPurpose);
    if (!filePath) throw new NotFoundException("Document not uploaded");
    return this.imagekit.downloadFile(filePath);
  }

  assertProviderKycApproved(user: UserDocument) {
    if (user.role !== UserRole.PROVIDER) return;
    if (user.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException("Provider KYC must be approved for this action");
    }
  }

  private async requireProvider(userId: string): Promise<UserDocument> {
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException("User not found");
    if (user.role !== UserRole.PROVIDER) throw new ForbiddenException("Providers only");
    return user;
  }

  private parsePurpose(purpose: string): KycDocumentPurpose {
    if (!Object.values(KycDocumentPurpose).includes(purpose as KycDocumentPurpose)) {
      throw new BadRequestException("Invalid document purpose");
    }
    return purpose as KycDocumentPurpose;
  }

  private idBackRequired(idType: KycIdType): boolean {
    return idType !== KycIdType.PASSPORT;
  }

  private resolvePath(kyc: ProviderKycDocument, purpose: KycDocumentPurpose): string | undefined {
    switch (purpose) {
      case KycDocumentPurpose.ID_FRONT:
        return kyc.idFrontPath;
      case KycDocumentPurpose.ID_BACK:
        return kyc.idBackPath;
      case KycDocumentPurpose.SELFIE:
        return kyc.selfiePath;
      default:
        return undefined;
    }
  }

  private isDraftOwnerViewAllowed(_kyc: ProviderKycDocument, _purpose: KycDocumentPurpose) {
    return true;
  }

  private sanitizeProfile(kyc: ProviderKyc | ProviderKycDocument) {
    return {
      legalFullName: kyc.legalFullName ?? null,
      dateOfBirthYmd: kyc.dateOfBirthYmd ?? null,
      nationality: kyc.nationality ?? null,
      mobileNumber: kyc.mobileNumber ?? null,
      serviceCity: kyc.serviceCity ?? null,
      serviceProvince: kyc.serviceProvince ?? null,
      addressLine1: kyc.addressLine1 ?? null,
      barangay: kyc.barangay ?? null,
      city: kyc.city ?? null,
      province: kyc.province ?? null,
      postalCode: kyc.postalCode ?? null,
      idType: kyc.idType ?? null,
      idNumber: kyc.idNumber ?? null,
      idExpiryYmd: kyc.idExpiryYmd ?? null,
      providerType: kyc.providerType ?? null,
      businessName: kyc.businessName ?? null,
      businessRegistrationNumber: kyc.businessRegistrationNumber ?? null,
      hasIdFront: Boolean(kyc.idFrontPath),
      hasIdBack: Boolean(kyc.idBackPath),
      hasSelfie: Boolean(kyc.selfiePath),
      submittedAt: kyc.submittedAt ?? null,
      reviewedAt: kyc.reviewedAt ?? null,
    };
  }
}

function purposeToPathField(purpose: KycDocumentPurpose): "idFrontPath" | "idBackPath" | "selfiePath" {
  switch (purpose) {
    case KycDocumentPurpose.ID_FRONT:
      return "idFrontPath";
    case KycDocumentPurpose.ID_BACK:
      return "idBackPath";
    case KycDocumentPurpose.SELFIE:
      return "selfiePath";
  }
}
