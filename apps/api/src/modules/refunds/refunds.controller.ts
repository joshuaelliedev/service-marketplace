import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { RefundsService } from "./refunds.service";

class RefundReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@Controller("refunds")
@UseGuards(AuthGuard("jwt"))
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @Get("mine")
  listMine(@CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CUSTOMER) return [];
    return this.refunds.listMine(user.sub);
  }

  @Post("bookings/:bookingId")
  create(
    @CurrentUser() user: JwtUser,
    @Param("bookingId") bookingId: string,
    @Body() body: RefundReasonDto,
  ) {
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException();
    return this.refunds.create(user.sub, bookingId, body.reason);
  }
}
