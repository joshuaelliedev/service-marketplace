import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  AppFeedback,
  AppFeedbackDocument,
  FeedbackStatus,
} from "./feedback.schema";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(AppFeedback.name)
    private readonly model: Model<AppFeedbackDocument>,
  ) {}

  listMine(userId: string) {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  listAll(status?: FeedbackStatus) {
    const q = status ? { status } : {};
    return this.model
      .find(q)
      .sort({ createdAt: -1 })
      .populate("userId", "email fullName role")
      .lean();
  }

  create(userId: string, body: string) {
    return this.model.create({
      userId: new Types.ObjectId(userId),
      body: body.trim(),
      status: FeedbackStatus.NEW,
    });
  }

  async updateStatus(id: string, status: FeedbackStatus, adminNote?: string) {
    return this.model
      .findByIdAndUpdate(
        id,
        { status, adminNote: adminNote?.trim() ?? "" },
        { new: true },
      )
      .lean();
  }
}
