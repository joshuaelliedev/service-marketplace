import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";
import { ServiceListing } from "../listings/listing.schema";

export type BookingDocument = HydratedDocument<Booking>;

export enum BookingStatus {
  PENDING_PROVIDER = "pending_provider",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  PROVIDER_COMPLETED = "provider_completed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum SlotHalf {
  AM = "AM",
  PM = "PM",
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: ServiceListing.name, required: true })
  listingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  serviceDateYmd: string;

  @Prop({ type: String, enum: SlotHalf, required: true })
  slotHalf: SlotHalf;

  @Prop({ type: String, enum: BookingStatus, required: true })
  status: BookingStatus;

  @Prop({ required: true, min: 1 })
  basePriceCents: number;

  @Prop({ required: true, min: 0 })
  platformFeeCents: number;

  @Prop({ required: true, min: 1 })
  customerTotalCents: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ listingId: 1, serviceDateYmd: 1, slotHalf: 1, status: 1 });
