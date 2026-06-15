import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Booking } from "./booking.schema";
import { User } from "../users/user.schema";

export type BookingChatReadDocument = HydratedDocument<BookingChatRead>;

@Schema({ timestamps: true })
export class BookingChatRead {
  @Prop({ type: Types.ObjectId, ref: Booking.name, required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  lastReadAt: Date;
}

export const BookingChatReadSchema = SchemaFactory.createForClass(BookingChatRead);
BookingChatReadSchema.index({ bookingId: 1, userId: 1 }, { unique: true });
