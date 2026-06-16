import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

export enum SupportTicketStatus {
  OPEN = "open",
  CLOSED = "closed",
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ type: String, enum: SupportTicketStatus, default: SupportTicketStatus.OPEN })
  status: SupportTicketStatus;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: Types.ObjectId, ref: SupportTicket.name, required: true })
  ticketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  authorId: Types.ObjectId;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ trim: true, default: "" })
  imageUrl: string;
}

export type SupportMessageDocument = HydratedDocument<SupportMessage>;
export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);
SupportMessageSchema.index({ ticketId: 1, createdAt: 1 });
