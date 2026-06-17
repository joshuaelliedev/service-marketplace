import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationsModule } from "../notifications/notifications.module";
import { KycModule } from "../kyc/kyc.module";
import { UsersModule } from "../users/users.module";
import { WalletRequest, WalletRequestSchema } from "./wallet-request.schema";
import {
  WalletTransaction,
  WalletTransactionSchema,
} from "./wallet-transaction.schema";
import { WalletController } from "./wallet.controller";
import { WalletLedgerService } from "./wallet-ledger.service";
import { WalletService } from "./wallet.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletRequest.name, schema: WalletRequestSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
    forwardRef(() => UsersModule),
    KycModule,
    NotificationsModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletLedgerService],
  exports: [WalletService, WalletLedgerService],
})
export class WalletModule {}
