import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { SupportService } from "./support.service";

class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

@Controller("support")
@UseGuards(AuthGuard("jwt"))
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get("tickets/mine")
  listMine(@CurrentUser() user: JwtUser) {
    if (user.role === UserRole.ADMIN) return [];
    return this.support.listMine(user.sub);
  }

  @Post("tickets")
  create(@CurrentUser() user: JwtUser, @Body() body: CreateTicketDto) {
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      throw new Error("Forbidden");
    }
    return this.support.createTicket(user.sub, body);
  }

  @Get("tickets/:id/messages")
  messages(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.support.listMessages(user.sub, user.role, id);
  }

  @Post("tickets/:id/messages")
  reply(@CurrentUser() user: JwtUser, @Param("id") id: string, @Body() body: ReplyDto) {
    return this.support.reply(user.sub, user.role, id, body);
  }
}
