import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Booking } from "./booking.schema";
import { User } from "../users/user.schema";

export type BookingMessageDocument = HydratedDocument<BookingMessage>;

@Schema({ timestamps: true })
export class BookingMessage {
  @Prop({ type: Types.ObjectId, ref: Booking.name, required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  body: string;
}

export const BookingMessageSchema = SchemaFactory.createForClass(BookingMessage);
BookingMessageSchema.index({ bookingId: 1, createdAt: 1 });
