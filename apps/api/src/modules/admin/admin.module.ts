import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { BookingsModule } from "../bookings/bookings.module";
import { CategoriesModule } from "../categories/categories.module";
import { ListingsModule } from "../listings/listings.module";
import { UsersModule } from "../users/users.module";
import { WalletModule } from "../wallet/wallet.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [UsersModule, CategoriesModule, ListingsModule, BookingsModule, WalletModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
