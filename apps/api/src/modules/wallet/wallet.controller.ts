import { Body, Controller, Get, Post, UseGuards, ForbiddenException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { WalletRequestType } from "./wallet-request.schema";
import { WalletLedgerService } from "./wallet-ledger.service";
import { WalletService } from "./wallet.service";

class CreateWalletRequestDto {
  @IsEnum(WalletRequestType)
  type!: WalletRequestType;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userNote?: string;
}

@Controller("wallet")
@UseGuards(AuthGuard("jwt"))
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly ledger: WalletLedgerService,
  ) {}

  @Get("transactions/mine")
  listTransactions(@CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      return [];
    }
    return this.ledger.listMine(user.sub);
  }

  @Get("requests/mine")
  listMine(@CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      return [];
    }
    return this.wallet.listMine(user.sub);
  }

  @Post("requests")
  create(@CurrentUser() user: JwtUser, @Body() body: CreateWalletRequestDto) {
    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException();
    }
    return this.wallet.createRequest(user.sub, body);
  }
}
