import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { NotificationsService } from "../notifications/notifications.service";
import { Booking, BookingDocument } from "./booking.schema";
import { BookingChatRead, BookingChatReadDocument } from "./booking-chat-read.schema";
import { BookingMessage, BookingMessageDocument } from "./booking-message.schema";

@Injectable()
export class BookingChatService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(BookingMessage.name)
    private readonly messageModel: Model<BookingMessageDocument>,
    @InjectModel(BookingChatRead.name)
    private readonly readModel: Model<BookingChatReadDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async listMessages(userId: string, bookingId: string) {
    const booking = await this.requireParticipant(userId, bookingId);
    void booking;
    return this.messageModel
      .find({ bookingId: new Types.ObjectId(bookingId) })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();
  }

  async sendMessage(userId: string, bookingId: string, body: string) {
    const booking = await this.requireParticipant(userId, bookingId);
    const text = body.trim();
    if (!text) throw new BadRequestException("Message cannot be empty");
    if (text.length > 2000) throw new BadRequestException("Message too long");

    const message = await this.messageModel.create({
      bookingId: new Types.ObjectId(bookingId),
      senderId: new Types.ObjectId(userId),
      body: text,
    });

    const recipientId =
      booking.customerId.toString() === userId
        ? booking.providerId.toString()
        : booking.customerId.toString();

    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    await this.notifications.notify(
      recipientId,
      "New booking message",
      preview,
      "booking_chat",
      bookingId,
    );

    return message;
  }

  async markRead(userId: string, bookingId: string) {
    await this.requireParticipant(userId, bookingId);
    const now = new Date();
    await this.readModel.findOneAndUpdate(
      { bookingId: new Types.ObjectId(bookingId), userId: new Types.ObjectId(userId) },
      { $set: { lastReadAt: now } },
      { upsert: true, new: true },
    );
    return { ok: true, lastReadAt: now };
  }

  async unreadSummary(userId: string) {
    const uid = new Types.ObjectId(userId);
    const bookings = await this.bookingModel
      .find({ $or: [{ customerId: uid }, { providerId: uid }] })
      .select("_id")
      .lean();
    if (bookings.length === 0) {
      return { total: 0, byBookingId: {} as Record<string, number> };
    }

    const bookingIds = bookings.map((b) => b._id);
    const reads = await this.readModel
      .find({ userId: uid, bookingId: { $in: bookingIds } })
      .lean();
    const readMap = new Map(reads.map((r) => [r.bookingId.toString(), r.lastReadAt]));

    const byBookingId: Record<string, number> = {};
    let total = 0;

    for (const booking of bookings) {
      const bid = booking._id.toString();
      const lastRead = readMap.get(bid);
      const q: Record<string, unknown> = {
        bookingId: booking._id,
        senderId: { $ne: uid },
      };
      if (lastRead) q.createdAt = { $gt: lastRead };

      const count = await this.messageModel.countDocuments(q);
      if (count > 0) {
        byBookingId[bid] = count;
        total += count;
      }
    }

    return { total, byBookingId };
  }

  private async requireParticipant(userId: string, bookingId: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) throw new NotFoundException("Not found");
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) throw new NotFoundException("Not found");
    if (booking.customerId.toString() !== userId && booking.providerId.toString() !== userId) {
      throw new ForbiddenException();
    }
    return booking;
  }
}
