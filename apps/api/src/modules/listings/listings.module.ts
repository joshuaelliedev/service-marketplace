import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CategoriesModule } from "../categories/categories.module";
import { KycModule } from "../kyc/kyc.module";
import { UsersModule } from "../users/users.module";
import { ServiceListing, ServiceListingSchema } from "./listing.schema";
import { ListingsController } from "./listings.controller";
import { ListingsService } from "./listings.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceListing.name, schema: ServiceListingSchema },
    ]),
    CategoriesModule,
    UsersModule,
    KycModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService, MongooseModule],
})
export class ListingsModule {}
