import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AdminModule } from "./modules/admin/admin.module";
import { AdvisoriesModule } from "./modules/advisories/advisories.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { KycModule } from "./modules/kyc/kyc.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PlatformSettingsModule } from "./modules/platform-settings/platform-settings.module";
import { ProviderPostsModule } from "./modules/provider-posts/provider-posts.module";
import { RatingsModule } from "./modules/ratings/ratings.module";
import { RefundsModule } from "./modules/refunds/refunds.module";
import { SupportModule } from "./modules/support/support.module";
import { UsersModule } from "./modules/users/users.module";
import { WalletModule } from "./modules/wallet/wallet.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/service-marketplace",
    ),
    AuthModule,
    PlatformSettingsModule,
    UsersModule,
    CategoriesModule,
    ListingsModule,
    NotificationsModule,
    BookingsModule,
    RatingsModule,
    RefundsModule,
    AdvisoriesModule,
    SupportModule,
    FeedbackModule,
    ProviderPostsModule,
    AdminModule,
    KycModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
