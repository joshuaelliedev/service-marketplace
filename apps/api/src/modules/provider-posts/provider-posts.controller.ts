import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { UserRole } from "../users/user.schema";
import { ProviderPostsService } from "./provider-posts.service";

class PostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

@Controller("provider-posts")
export class ProviderPostsController {
  constructor(private readonly posts: ProviderPostsService) {}

  @Get("providers/:providerId")
  listPublic(@Param("providerId") providerId: string) {
    return this.posts.listPublic(providerId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("mine")
  mine(@CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.PROVIDER) throw new Error("Forbidden");
    return this.posts.listMine(user.sub);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: PostDto) {
    if (user.role !== UserRole.PROVIDER) throw new Error("Forbidden");
    return this.posts.create(user.sub, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch(":id")
  update(@CurrentUser() user: JwtUser, @Param("id") id: string, @Body() body: PostDto) {
    if (user.role !== UserRole.PROVIDER) throw new Error("Forbidden");
    return this.posts.update(user.sub, id, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.PROVIDER) throw new Error("Forbidden");
    return this.posts.remove(user.sub, id);
  }
}
