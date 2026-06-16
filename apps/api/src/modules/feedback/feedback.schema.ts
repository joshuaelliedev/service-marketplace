import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type AppFeedbackDocument = HydratedDocument<AppFeedback>;

export enum FeedbackStatus {
  NEW = "new",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
}

@Schema({ timestamps: true })
export class AppFeedback {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ type: String, enum: FeedbackStatus, default: FeedbackStatus.NEW })
  status: FeedbackStatus;

  @Prop({ trim: true, default: "" })
  adminNote: string;
}

export const AppFeedbackSchema = SchemaFactory.createForClass(AppFeedback);
AppFeedbackSchema.index({ status: 1, createdAt: -1 });
