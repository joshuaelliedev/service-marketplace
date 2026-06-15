import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";
import { Category } from "../categories/category.schema";

export type ServiceListingDocument = HydratedDocument<ServiceListing>;

@Schema({ timestamps: true })
export class ServiceListing {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: "" })
  description: string;

  /** Provider base price in centavos (PHP). */
  @Prop({ required: true, min: 1 })
  basePriceCents: number;

  @Prop({ default: false })
  isPublished: boolean;
}

export const ServiceListingSchema = SchemaFactory.createForClass(ServiceListing);
ServiceListingSchema.index({ providerId: 1, createdAt: -1 });
ServiceListingSchema.index({ categoryId: 1, isPublished: 1 });
