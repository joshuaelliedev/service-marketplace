import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdvisoriesService } from "../advisories/advisories.service";
import { FeedbackStatus } from "../feedback/feedback.schema";
import { FeedbackService } from "../feedback/feedback.service";
import { PlatformSettingsService } from "../platform-settings/platform-settings.service";
import { RefundsService } from "../refunds/refunds.service";
import { SupportService } from "../support/support.service";
import { KycService } from "../kyc/kyc.service";
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

class PlatformFeesDto {
  @IsInt()
  @Min(0)
  @Max(100)
  companyFeePercent!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  vatFeePercent!: number;
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

class RefundDecisionDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

class FeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status!: FeedbackStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

class SupportReplyDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

class CreateAdvisoryBodyDto {
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

@Controller("admin")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly users: UsersService,
    private readonly kyc: KycService,
    private readonly wallet: WalletService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly refunds: RefundsService,
    private readonly advisories: AdvisoriesService,
    private readonly support: SupportService,
    private readonly feedback: FeedbackService,
  ) {}

  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Get("platform/fees")
  getFees() {
    return this.platformSettings.get();
  }

  @Patch("platform/fees")
  setFees(@Body() body: PlatformFeesDto) {
    return this.platformSettings.update(body);
  }

  @Get("kyc/pending")
  kycPending() {
    return this.kyc.listPendingForAdmin();
  }

  @Get("kyc/:userId/files/:purpose")
  async kycFile(
    @Param("userId") userId: string,
    @Param("purpose") purpose: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { buffer, contentType } = await this.kyc.streamDocumentForAdmin(
      userId,
      purpose,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(buffer);
  }

  @Post("kyc/:userId/decision")
  kycDecision(
    @CurrentUser() admin: JwtUser,
    @Param("userId") userId: string,
    @Body() body: KycDecisionDto,
  ) {
    return this.kyc.decide(admin.sub, userId, body.approve, body.note);
  }

  @Post("wallets/topup")
  topUp(@Body() body: TopUpDto) {
    const ref = `ADM-${Date.now().toString(36).toUpperCase()}`;
    return this.users.adminTopUp(body.userId, body.amountCents, ref);
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

  @Get("refunds/pending")
  refundsPending() {
    return this.refunds.listPending();
  }

  @Post("refunds/:id/decision")
  refundDecision(
    @CurrentUser() admin: JwtUser,
    @Param("id") id: string,
    @Body() body: RefundDecisionDto,
  ) {
    return this.refunds.decide(admin.sub, id, body.approve, body.note);
  }

  @Get("advisories")
  listAdvisories() {
    return this.advisories.listAll();
  }

  @Post("advisories")
  createAdvisory(@CurrentUser() admin: JwtUser, @Body() body: CreateAdvisoryBodyDto) {
    return this.advisories.create(admin.sub, body);
  }

  @Get("support/tickets/open")
  supportOpen() {
    return this.support.listOpen();
  }

  @Post("support/tickets/:id/messages")
  supportReply(
    @CurrentUser() admin: JwtUser,
    @Param("id") id: string,
    @Body() body: SupportReplyDto,
  ) {
    return this.support.reply(admin.sub, UserRole.ADMIN, id, body);
  }

  @Post("support/tickets/:id/close")
  supportClose(@CurrentUser() admin: JwtUser, @Param("id") id: string) {
    return this.support.close(admin.sub, id);
  }

  @Get("feedback")
  listFeedback() {
    return this.feedback.listAll();
  }

  @Patch("feedback/:id/status")
  feedbackStatus(@Param("id") id: string, @Body() body: FeedbackStatusDto) {
    return this.feedback.updateStatus(id, body.status, body.adminNote);
  }
}
