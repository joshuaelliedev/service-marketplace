import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUser } from "../auth/jwt.types";
import { ListingsService } from "./listings.service";
import { UserRole } from "../users/user.schema";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

class CreateListingDto {
  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  basePriceCents!: number;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

class UpdateListingDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  basePriceCents?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

@Controller("listings")
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  listPublished(@Query("categoryId") categoryId?: string) {
    return this.listings.listPublished(categoryId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("mine")
  mine(@CurrentUser() user: JwtUser) {
    return this.listings.listMine(user.sub);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.listings.getPublished(id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: CreateListingDto) {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException("Providers only");
    }
    return this.listings.create(user.sub, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch(":id")
  updateMine(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() body: UpdateListingDto,
  ) {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException("Providers only");
    }
    return this.listings.updateMine(user.sub, id, body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete(":id")
  deleteMine(@CurrentUser() user: JwtUser, @Param("id") id: string) {
    if (user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException("Providers only");
    }
    return this.listings.deleteMine(user.sub, id);
  }
}
