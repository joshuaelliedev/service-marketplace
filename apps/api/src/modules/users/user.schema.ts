import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  CUSTOMER = "customer",
  PROVIDER = "provider",
  ADMIN = "admin",
}

export enum KycStatus {
  NONE = "none",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum SystemWalletKind {
  COMPANY = "company",
  VAT = "vat",
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ type: String, enum: KycStatus, default: KycStatus.NONE })
  kycStatus: KycStatus;

  @Prop({ trim: true })
  kycDocumentUrl?: string;

  @Prop({ trim: true })
  kycAdminNote?: string;

  @Prop({ default: 0 })
  walletAvailableCents: number;

  @Prop({ default: 0, min: 0 })
  walletEscrowCents: number;

  /** @deprecated v1.1 uses global platform fees */
  @Prop({ default: 10, min: 0, max: 100 })
  providerFeePercent: number;

  /** @deprecated v1.1 uses global platform fees */
  @Prop({ default: 0, min: 0 })
  providerFeeFixedCents: number;

  @Prop({ default: false })
  isSystemWallet: boolean;

  @Prop({ type: String, enum: SystemWalletKind, default: null })
  systemWalletKind: SystemWalletKind | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const out = ret as unknown as { passwordHash?: string };
    delete out.passwordHash;
    return out;
  },
});
UserSchema.set("toObject", {
  transform: (_doc, ret) => {
    const out = ret as unknown as { passwordHash?: string };
    delete out.passwordHash;
    return out;
  },
});
