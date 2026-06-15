import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { BookingChatService } from "./booking-chat.service";
import { BookingsService } from "./bookings.service";
import { UserRole } from "../users/user.schema";
import { SlotHalf } from "./booking.schema";
import { IsEnum, IsString, Matches, MaxLength, MinLength } from "class-validator";

class CreateBookingDto {
  @IsString()
  listingId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  serviceDateYmd!: string;

  @IsEnum(SlotHalf)
  slotHalf!: SlotHalf;
}

class SendBookingMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

@Controller("bookings")
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly chat: BookingChatService,
  ) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("mine")
  mine(@CurrentUser() user: JwtUser) {
    return this.bookings.listMine(user.sub, user.role);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("chat/unread-summary")
  chatUnreadSummary(@CurrentUser() user: JwtUser) {
    return this.chat.unreadSummary(user.sub);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id/messages")
  listMessages(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.chat.listMessages(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/messages/read")
  markMessagesRead(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.chat.markRead(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/messages")
  sendMessage(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() body: SendBookingMessageDto,
  ) {
    return this.chat.sendMessage(user.sub, id, body.body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  one(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.bookings.getOne(user.sub, user.role, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: CreateBookingDto) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException("Customers only");
    }
    return this.bookings.create(user.sub, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/accept")
  accept(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.PROVIDER) throw new ForbiddenException("Providers only");
    return this.bookings.accept(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/reject")
  reject(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.PROVIDER) throw new ForbiddenException("Providers only");
    return this.bookings.reject(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/provider-complete")
  providerComplete(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.PROVIDER) throw new ForbiddenException("Providers only");
    return this.bookings.markProviderComplete(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/customer-confirm")
  customerConfirm(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException("Customers only");
    return this.bookings.customerConfirm(user.sub, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/cancel")
  cancel(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.bookings.cancel(user.sub, user.role, id);
  }
}
