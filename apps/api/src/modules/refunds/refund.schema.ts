import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";
import { Booking } from "../bookings/booking.schema";

export type RefundRequestDocument = HydratedDocument<RefundRequest>;

export enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Schema({ timestamps: true })
export class RefundRequest {
  @Prop({ type: Types.ObjectId, ref: Booking.name, required: true, unique: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  amountCents: number;

  @Prop({ trim: true, default: "" })
  reason: string;

  @Prop({ type: String, enum: RefundStatus, required: true })
  status: RefundStatus;

  @Prop({ trim: true, default: "" })
  adminNote: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;
}

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);
RefundRequestSchema.index({ status: 1, createdAt: -1 });
