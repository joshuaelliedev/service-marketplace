import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type AdvisoryDocument = HydratedDocument<Advisory>;

@Schema({ timestamps: true })
export class Advisory {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ trim: true, default: "" })
  imageUrl: string;

  @Prop({ type: Date, required: true })
  startAt: Date;

  @Prop({ type: Date, required: true })
  endAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const AdvisorySchema = SchemaFactory.createForClass(Advisory);
AdvisorySchema.index({ startAt: 1, endAt: 1 });

@Schema({ timestamps: true })
export class AdvisoryDismissal {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Advisory.name, required: true })
  advisoryId: Types.ObjectId;
}

export type AdvisoryDismissalDocument = HydratedDocument<AdvisoryDismissal>;
export const AdvisoryDismissalSchema = SchemaFactory.createForClass(AdvisoryDismissal);
AdvisoryDismissalSchema.index({ userId: 1, advisoryId: 1 }, { unique: true });
