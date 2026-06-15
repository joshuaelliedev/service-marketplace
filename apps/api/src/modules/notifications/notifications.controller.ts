import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("unread-count")
  async unreadCount(@CurrentUser() user: JwtUser) {
    const count = await this.notifications.countUnread(user.sub);
    return { count };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.notifications.listMine(user.sub);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch(":id/read")
  markRead(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    return this.notifications.markRead(user.sub, id);
  }
}
