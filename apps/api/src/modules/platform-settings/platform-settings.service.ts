import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { computePricingCents, type PricingBreakdown } from "../../common/money";
import {
  PLATFORM_SETTINGS_KEY,
  PlatformSettings,
  PlatformSettingsDocument,
} from "./platform-settings.schema";

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(PlatformSettings.name)
    private readonly model: Model<PlatformSettingsDocument>,
  ) {}

  async onModuleInit() {
    await this.model.updateOne(
      { key: PLATFORM_SETTINGS_KEY },
      {
        $setOnInsert: {
          key: PLATFORM_SETTINGS_KEY,
          companyFeePercent: 18,
          vatFeePercent: 12,
        },
      },
      { upsert: true },
    );
  }

  async get() {
    const doc = await this.model.findOne({ key: PLATFORM_SETTINGS_KEY }).lean();
    return (
      doc ?? {
        key: PLATFORM_SETTINGS_KEY,
        companyFeePercent: 18,
        vatFeePercent: 12,
      }
    );
  }

  async update(input: { companyFeePercent: number; vatFeePercent: number }) {
    return this.model
      .findOneAndUpdate(
        { key: PLATFORM_SETTINGS_KEY },
        {
          companyFeePercent: input.companyFeePercent,
          vatFeePercent: input.vatFeePercent,
        },
        { new: true, upsert: true },
      )
      .lean();
  }

  async priceListing(basePriceCents: number): Promise<PricingBreakdown> {
    const s = await this.get();
    return computePricingCents(
      basePriceCents,
      s.companyFeePercent,
      s.vatFeePercent,
    );
  }
}
