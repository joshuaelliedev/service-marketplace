import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProviderModule } from "./modules/provider/provider.module";
import { UsersModule } from "./modules/users/users.module";
import { WalletModule } from "./modules/wallet/wallet.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/service-marketplace",
    ),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ListingsModule,
    NotificationsModule,
    BookingsModule,
    AdminModule,
    ProviderModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
