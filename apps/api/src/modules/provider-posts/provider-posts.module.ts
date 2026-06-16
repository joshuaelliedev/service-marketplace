import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProviderPost, ProviderPostSchema } from "./provider-post.schema";
import { ProviderPostsController } from "./provider-posts.controller";
import { ProviderPostsService } from "./provider-posts.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderPost.name, schema: ProviderPostSchema },
    ]),
  ],
  controllers: [ProviderPostsController],
  providers: [ProviderPostsService],
  exports: [ProviderPostsService],
})
export class ProviderPostsModule {}
