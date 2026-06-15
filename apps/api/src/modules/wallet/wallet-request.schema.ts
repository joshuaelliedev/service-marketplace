import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type WalletRequestDocument = HydratedDocument<WalletRequest>;

export enum WalletRequestType {
  CASH_IN_DIRECT = "cash_in_direct",
  CASH_OUT_DIRECT = "cash_out_direct",
}

export enum WalletRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Schema({ timestamps: true })
export class WalletRequest {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: WalletRequestType, required: true })
  type: WalletRequestType;

  @Prop({ required: true, min: 1 })
  amountCents: number;

  @Prop({ trim: true, default: "" })
  userNote: string;

  @Prop({ type: String, enum: WalletRequestStatus, required: true })
  status: WalletRequestStatus;

  @Prop({ trim: true, default: "" })
  adminNote: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;
}

export const WalletRequestSchema = SchemaFactory.createForClass(WalletRequest);
WalletRequestSchema.index({ userId: 1, createdAt: -1 });
WalletRequestSchema.index({ status: 1, createdAt: -1 });
