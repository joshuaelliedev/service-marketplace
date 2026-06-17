import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { KycService } from "./kyc.service";
import { SubmitKycDto } from "./submit-kyc.dto";

@Controller("provider/kyc")
@UseGuards(AuthGuard("jwt"))
export class KycController {
  constructor(private readonly kyc: KycService) {}

  private assertProvider(user: JwtUser) {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException("Providers only");
    }
  }

  @Get("mine")
  mine(@CurrentUser() user: JwtUser) {
    this.assertProvider(user);
    return this.kyc.getMine(user.sub);
  }

  @Post("upload/:purpose")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: JwtUser,
    @Param("purpose") purpose: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.assertProvider(user);
    return this.kyc.uploadDocument(user.sub, purpose, file);
  }

  @Post("submit")
  submit(@CurrentUser() user: JwtUser, @Body() body: SubmitKycDto) {
    this.assertProvider(user);
    return this.kyc.submit(user.sub, body);
  }

  @Get("files/:purpose")
  async viewOwn(
    @CurrentUser() user: JwtUser,
    @Param("purpose") purpose: string,
  ): Promise<StreamableFile> {
    this.assertProvider(user);
    const { buffer, contentType } = await this.kyc.streamDocumentForProvider(
      user.sub,
      purpose,
    );
    return new StreamableFile(buffer, { type: contentType });
  }
}
