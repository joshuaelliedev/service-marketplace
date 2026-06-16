import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ProviderPost, ProviderPostDocument } from "./provider-post.schema";

@Injectable()
export class ProviderPostsService {
  constructor(
    @InjectModel(ProviderPost.name)
    private readonly postModel: Model<ProviderPostDocument>,
  ) {}

  listPublic(providerId: string) {
    return this.postModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  listMine(providerId: string) {
    return this.listPublic(providerId);
  }

  create(providerId: string, input: { body: string; imageUrl?: string }) {
    return this.postModel.create({
      providerId: new Types.ObjectId(providerId),
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() ?? "",
    });
  }

  async update(
    providerId: string,
    postId: string,
    input: { body?: string; imageUrl?: string },
  ) {
    const post = await this.requireOwn(providerId, postId);
    if (input.body !== undefined) post.body = input.body.trim();
    if (input.imageUrl !== undefined) post.imageUrl = input.imageUrl.trim();
    await post.save();
    return post;
  }

  async remove(providerId: string, postId: string) {
    const post = await this.requireOwn(providerId, postId);
    await post.deleteOne();
    return { ok: true };
  }

  private async requireOwn(providerId: string, postId: string) {
    if (!Types.ObjectId.isValid(postId)) throw new NotFoundException();
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException();
    if (post.providerId.toString() !== providerId) throw new ForbiddenException();
    return post;
  }
}
