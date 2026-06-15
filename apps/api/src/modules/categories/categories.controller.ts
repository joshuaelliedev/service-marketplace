import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CategoriesService } from "./categories.service";
import { UserRole } from "../users/user.schema";
import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  listPublic() {
    return this.categories.listPublic();
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("admin/all")
  listAllAdmin() {
    return this.categories.listAllAdmin();
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("admin")
  create(@Body() body: CreateCategoryDto) {
    return this.categories.create(body.name);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("admin/:id")
  update(@Param("id") id: string, @Body() body: UpdateCategoryDto) {
    return this.categories.update(id, body);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("admin/:id")
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}
