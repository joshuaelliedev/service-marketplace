import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ trim: true, default: "general" })
  kind: string;

  /** Optional booking reference (e.g. chat deep link). */
  @Prop({ type: Types.ObjectId, default: null })
  refBookingId: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
