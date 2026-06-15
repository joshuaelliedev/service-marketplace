import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user.schema";
import { WalletService } from "../wallet/wallet.service";
import { AdminService } from "./admin.service";

class TopUpDto {
  @IsString()
  userId!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;
}

class ProviderFeesDto {
  @IsInt()
  @Min(0)
  feePercent!: number;

  @IsInt()
  @Min(0)
  feeFixedCents!: number;
}

class KycDecisionDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

class WalletDecisionDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller("admin")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly users: UsersService,
    private readonly wallet: WalletService,
  ) {}

  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Get("kyc/pending")
  kycPending() {
    return this.users.listKycPending();
  }

  @Post("kyc/:userId/decision")
  kycDecision(@Param("userId") userId: string, @Body() body: KycDecisionDto) {
    return this.users.setKycDecision(userId, body.approve, body.note);
  }

  @Patch("providers/:id/fees")
  setFees(@Param("id") id: string, @Body() body: ProviderFeesDto) {
    return this.users.updateProviderFees(id, body.feePercent, body.feeFixedCents);
  }

  @Post("wallets/topup")
  topUp(@Body() body: TopUpDto) {
    return this.users.adminTopUp(body.userId, body.amountCents);
  }

  @Get("wallet-requests/pending")
  walletRequestsPending() {
    return this.wallet.listPending();
  }

  @Post("wallet-requests/:id/decision")
  walletRequestDecision(
    @CurrentUser() admin: JwtUser,
    @Param("id") id: string,
    @Body() body: WalletDecisionDto,
  ) {
    return this.wallet.decide(admin.sub, id, body.approve, body.note);
  }
}
