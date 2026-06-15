import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "./jwt.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async me(@CurrentUser() user: JwtUser) {
    const doc = await this.auth.me(user.sub);
    if (!doc) throw new NotFoundException();
    return doc;
  }
}
