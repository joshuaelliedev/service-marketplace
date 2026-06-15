import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Notification, NotificationDocument } from "./notification.schema";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async notify(
    userId: string,
    title: string,
    body: string,
    kind: string,
    refBookingId?: string,
  ) {
    return this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      title,
      body,
      kind,
      refBookingId:
        refBookingId && Types.ObjectId.isValid(refBookingId)
          ? new Types.ObjectId(refBookingId)
          : null,
      readAt: null,
    });
  }

  countUnread(userId: string) {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      readAt: null,
    });
  }

  listMine(userId: string) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
  }

  async markRead(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Not found");
    const doc = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: { readAt: new Date() } },
      { new: true },
    );
    if (!doc) throw new NotFoundException("Not found");
    return doc;
  }
}
