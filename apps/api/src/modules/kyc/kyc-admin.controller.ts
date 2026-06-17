import {
  Controller,
  Get,
  Param,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "../users/user.schema";
import { KycService } from "./kyc.service";

@Controller("admin/kyc")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(UserRole.ADMIN)
export class KycAdminController {
  constructor(private readonly kyc: KycService) {}

  @Get(":userId/files/:purpose")
  async viewFile(
    @Param("userId") userId: string,
    @Param("purpose") purpose: string,
  ): Promise<StreamableFile> {
    const { buffer, contentType } = await this.kyc.streamDocumentForAdmin(
      userId,
      purpose,
    );
    return new StreamableFile(buffer, { type: contentType });
  }
}
