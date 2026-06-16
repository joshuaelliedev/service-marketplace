import { Controller, Get, Query } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { PlatformSettingsService } from "./platform-settings.service";

@Controller("platform")
export class PlatformController {
  constructor(private readonly settings: PlatformSettingsService) {}

  @Get("fees")
  fees() {
    return this.settings.get();
  }

  @Get("price-quote")
  async priceQuote(@Query("basePriceCents") basePriceCents: string) {
    const base = Number(basePriceCents);
    if (!Number.isFinite(base) || base < 1) {
      throw new BadRequestException("basePriceCents required");
    }
    return this.settings.priceListing(base);
  }
}
