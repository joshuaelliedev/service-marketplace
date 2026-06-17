import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProviderKycDocument = HydratedDocument<ProviderKyc>;

export enum KycIdType {
  PHILID = "philid",
  DRIVERS_LICENSE = "drivers_license",
  PASSPORT = "passport",
  UMID = "umid",
  OTHER = "other",
}

export enum KycProviderType {
  INDIVIDUAL = "individual",
  BUSINESS = "business",
}

export enum KycDocumentPurpose {
  ID_FRONT = "id_front",
  ID_BACK = "id_back",
  SELFIE = "selfie",
}

@Schema({ timestamps: true })
export class ProviderKyc {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ trim: true })
  legalFullName?: string;

  @Prop({ trim: true })
  dateOfBirthYmd?: string;

  @Prop({ trim: true })
  nationality?: string;

  @Prop({ trim: true })
  mobileNumber?: string;

  @Prop({ trim: true })
  serviceCity?: string;

  @Prop({ trim: true })
  serviceProvince?: string;

  @Prop({ trim: true })
  addressLine1?: string;

  @Prop({ trim: true })
  barangay?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  province?: string;

  @Prop({ trim: true })
  postalCode?: string;

  @Prop({ type: String, enum: KycIdType })
  idType?: KycIdType;

  @Prop({ trim: true })
  idNumber?: string;

  @Prop({ trim: true })
  idExpiryYmd?: string;

  @Prop({ type: String, enum: KycProviderType })
  providerType?: KycProviderType;

  @Prop({ trim: true })
  businessName?: string;

  @Prop({ trim: true })
  businessRegistrationNumber?: string;

  @Prop({ trim: true })
  idFrontPath?: string;

  @Prop({ trim: true })
  idBackPath?: string;

  @Prop({ trim: true })
  selfiePath?: string;

  @Prop({ type: Date })
  declarationsAcceptedAt?: Date;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "User" })
  reviewedBy?: Types.ObjectId;
}

export const ProviderKycSchema = SchemaFactory.createForClass(ProviderKyc);
