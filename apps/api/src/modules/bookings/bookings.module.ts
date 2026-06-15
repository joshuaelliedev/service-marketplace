import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Booking, BookingSchema } from "./booking.schema";
import { BookingChatRead, BookingChatReadSchema } from "./booking-chat-read.schema";
import { BookingMessage, BookingMessageSchema } from "./booking-message.schema";
import { BookingChatService } from "./booking-chat.service";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { ListingsModule } from "../listings/listings.module";
import { UsersModule } from "../users/users.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: BookingMessage.name, schema: BookingMessageSchema },
      { name: BookingChatRead.name, schema: BookingChatReadSchema },
    ]),
    ListingsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingChatService],
  exports: [BookingsService],
})
export class BookingsModule {}
