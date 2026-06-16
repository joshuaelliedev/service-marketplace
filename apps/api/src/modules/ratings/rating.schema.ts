import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";
import { Booking } from "../bookings/booking.schema";

export type RatingDocument = HydratedDocument<Rating>;

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: Booking.name, required: true, unique: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  stars: number;

  @Prop({ trim: true, default: "" })
  comment: string;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ providerId: 1, createdAt: -1 });
