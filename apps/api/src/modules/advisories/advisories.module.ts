import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Advisory,
  AdvisoryDismissal,
  AdvisoryDismissalSchema,
  AdvisorySchema,
} from "./advisory.schema";
import { AdvisoriesController } from "./advisories.controller";
import { AdvisoriesService } from "./advisories.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Advisory.name, schema: AdvisorySchema },
      { name: AdvisoryDismissal.name, schema: AdvisoryDismissalSchema },
    ]),
  ],
  controllers: [AdvisoriesController],
  providers: [AdvisoriesService],
  exports: [AdvisoriesService],
})
export class AdvisoriesModule {}
