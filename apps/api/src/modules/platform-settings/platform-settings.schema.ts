import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

export const PLATFORM_SETTINGS_KEY = "default";

@Schema({ timestamps: true })
export class PlatformSettings {
  @Prop({ required: true, unique: true, default: PLATFORM_SETTINGS_KEY })
  key: string;

  @Prop({ default: 18, min: 0, max: 100 })
  companyFeePercent: number;

  @Prop({ default: 12, min: 0, max: 100 })
  vatFeePercent: number;
}

export const PlatformSettingsSchema = SchemaFactory.createForClass(PlatformSettings);
