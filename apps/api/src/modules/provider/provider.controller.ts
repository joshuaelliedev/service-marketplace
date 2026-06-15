import { Body, Controller, ForbiddenException, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsString, MinLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user.schema";

class SubmitKycDto {
  @IsString()
  @MinLength(8)
  documentUrl!: string;
}

@Controller("provider")
export class ProviderController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("kyc")
  submitKyc(@CurrentUser() user: JwtUser, @Body() body: SubmitKycDto) {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException("Providers only");
    }
    return this.users.submitKyc(user.sub, body.documentUrl);
  }
}
