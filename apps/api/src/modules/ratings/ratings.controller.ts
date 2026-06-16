import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { RatingsService } from "./ratings.service";

class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

@Controller("ratings")
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("bookings/:bookingId")
  create(
    @CurrentUser() user: JwtUser,
    @Param("bookingId") bookingId: string,
    @Body() body: CreateRatingDto,
  ) {
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException();
    return this.ratings.create(user.sub, bookingId, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("bookings/:bookingId/mine")
  mineForBooking(@CurrentUser() user: JwtUser, @Param("bookingId") bookingId: string) {
    return this.ratings.getForBooking(user.sub, bookingId);
  }

  @Get("providers/:providerId")
  forProvider(@Param("providerId") providerId: string) {
    return this.ratings.listForProvider(providerId);
  }
}
