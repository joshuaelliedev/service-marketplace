import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  PlatformSettings,
  PlatformSettingsSchema,
} from "./platform-settings.schema";
import { PlatformController } from "./platform.controller";
import { PlatformSettingsService } from "./platform-settings.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
