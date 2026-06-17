import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ImageKitService } from "../imagekit/imagekit.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { KycController } from "./kyc.controller";
import { ProviderKyc, ProviderKycSchema } from "./kyc.schema";
import { KycService } from "./kyc.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProviderKyc.name, schema: ProviderKycSchema }]),
    forwardRef(() => UsersModule),
    NotificationsModule,
  ],
  controllers: [KycController],
  providers: [KycService, ImageKitService],
  exports: [KycService],
})
export class KycModule {}
