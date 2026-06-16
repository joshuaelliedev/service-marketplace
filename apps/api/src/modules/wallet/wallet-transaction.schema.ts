import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

export enum WalletTransactionType {
  CASH_IN = "cash_in",
  CASH_OUT = "cash_out",
  ADMIN_TOPUP = "admin_topup",
  BOOKING_ESCROW = "booking_escrow",
  BOOKING_ESCROW_RELEASE = "booking_escrow_release",
  BOOKING_EARNINGS = "booking_earnings",
  SERVICE_FEE = "service_fee",
  SERVICE_FEE_REVERSAL = "service_fee_reversal",
  REFUND = "refund",
}

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: WalletTransactionType, required: true })
  type: WalletTransactionType;

  @Prop({ required: true, trim: true })
  referenceNumber: string;

  /** Signed change to available balance (negative = debit). */
  @Prop({ required: true })
  amountCents: number;

  @Prop({ required: true })
  balanceBeforeCents: number;

  @Prop({ required: true })
  balanceAfterCents: number;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
