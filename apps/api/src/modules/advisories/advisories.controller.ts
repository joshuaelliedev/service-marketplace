import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { AdvisoriesService } from "./advisories.service";

class CreateAdvisoryDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}

@Controller("advisories")
export class AdvisoriesController {
  constructor(private readonly advisories: AdvisoriesService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("active")
  active(@CurrentUser() user: JwtUser) {
    return this.advisories.listActiveForUser(user.sub);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post(":id/dismiss")
  dismiss(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.advisories.dismiss(user.sub, id);
  }
}

export { CreateAdvisoryDto };
