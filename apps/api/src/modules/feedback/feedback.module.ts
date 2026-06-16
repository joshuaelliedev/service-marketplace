import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppFeedback, AppFeedbackSchema } from "./feedback.schema";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppFeedback.name, schema: AppFeedbackSchema }]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
