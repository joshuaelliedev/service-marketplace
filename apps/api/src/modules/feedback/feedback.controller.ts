import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { FeedbackService } from "./feedback.service";

class SubmitFeedbackDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  body!: string;
}

@Controller("feedback")
@UseGuards(AuthGuard("jwt"))
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get("mine")
  mine(@CurrentUser() user: JwtUser) {
    return this.feedback.listMine(user.sub);
  }

  @Post()
  submit(@CurrentUser() user: JwtUser, @Body() body: SubmitFeedbackDto) {
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      throw new Error("Forbidden");
    }
    return this.feedback.create(user.sub, body.body);
  }
}
