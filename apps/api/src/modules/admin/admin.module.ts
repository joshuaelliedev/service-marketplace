import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdvisoriesModule } from "../advisories/advisories.module";
import { BookingsModule } from "../bookings/bookings.module";
import { CategoriesModule } from "../categories/categories.module";
import { FeedbackModule } from "../feedback/feedback.module";
import { ListingsModule } from "../listings/listings.module";
import { RefundsModule } from "../refunds/refunds.module";
import { SupportModule } from "../support/support.module";
import { UsersModule } from "../users/users.module";
import { WalletModule } from "../wallet/wallet.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    UsersModule,
    CategoriesModule,
    ListingsModule,
    BookingsModule,
    WalletModule,
    RefundsModule,
    AdvisoriesModule,
    SupportModule,
    FeedbackModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
