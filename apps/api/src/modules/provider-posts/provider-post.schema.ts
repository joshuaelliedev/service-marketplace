import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type ProviderPostDocument = HydratedDocument<ProviderPost>;

@Schema({ timestamps: true })
export class ProviderPost {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ trim: true, default: "" })
  imageUrl: string;
}

export const ProviderPostSchema = SchemaFactory.createForClass(ProviderPost);
ProviderPostSchema.index({ providerId: 1, createdAt: -1 });
