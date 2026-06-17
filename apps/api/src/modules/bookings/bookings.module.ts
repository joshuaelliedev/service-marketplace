import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Booking, BookingSchema } from "./booking.schema";
import { BookingChatRead, BookingChatReadSchema } from "./booking-chat-read.schema";
import { BookingMessage, BookingMessageSchema } from "./booking-message.schema";
import { BookingChatService } from "./booking-chat.service";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { ReceiptsService } from "./receipts.service";
import { ListingsModule } from "../listings/listings.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { KycModule } from "../kyc/kyc.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: BookingMessage.name, schema: BookingMessageSchema },
      { name: BookingChatRead.name, schema: BookingChatReadSchema },
    ]),
    ListingsModule,
    UsersModule,
    KycModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingChatService, ReceiptsService],
  exports: [BookingsService],
})
export class BookingsModule {}
