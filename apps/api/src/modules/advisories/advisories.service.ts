import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Advisory,
  AdvisoryDismissal,
  AdvisoryDismissalDocument,
  AdvisoryDocument,
} from "./advisory.schema";

@Injectable()
export class AdvisoriesService {
  constructor(
    @InjectModel(Advisory.name) private readonly advisoryModel: Model<AdvisoryDocument>,
    @InjectModel(AdvisoryDismissal.name)
    private readonly dismissalModel: Model<AdvisoryDismissalDocument>,
  ) {}

  async listActiveForUser(userId: string): Promise<
    Array<Record<string, unknown> & { dismissed: boolean }>
  > {
    const now = new Date();
    return this.advisoryModel
      .find({ startAt: { $lte: now }, endAt: { $gte: now } })
      .sort({ startAt: -1 })
      .lean()
      .then(async (items) => {
        const dismissed = await this.dismissalModel
          .find({
            userId: new Types.ObjectId(userId),
            advisoryId: { $in: items.map((i) => i._id) },
          })
          .lean();
        const dismissedSet = new Set(dismissed.map((d) => d.advisoryId.toString()));
        return items.map((i) => ({
          ...i,
          dismissed: dismissedSet.has(i._id.toString()),
        }));
      });
  }

  listAll() {
    return this.advisoryModel.find().sort({ startAt: -1 }).lean();
  }

  async create(
    adminId: string,
    input: {
      title: string;
      body: string;
      imageUrl?: string;
      startAt: string;
      endAt: string;
    },
  ) {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (endAt <= startAt) throw new BadRequestException("endAt must be after startAt");
    return this.advisoryModel.create({
      title: input.title.trim(),
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() ?? "",
      startAt,
      endAt,
      createdBy: new Types.ObjectId(adminId),
    });
  }

  async dismiss(userId: string, advisoryId: string) {
    if (!Types.ObjectId.isValid(advisoryId)) throw new NotFoundException();
    await this.dismissalModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        advisoryId: new Types.ObjectId(advisoryId),
      },
      {},
      { upsert: true },
    );
    return { ok: true };
  }
}
