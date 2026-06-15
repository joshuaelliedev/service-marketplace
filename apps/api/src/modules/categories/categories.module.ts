import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Category, CategorySchema } from "./category.schema";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, RolesGuard],
  exports: [CategoriesService, MongooseModule],
})
export class CategoriesModule {}
