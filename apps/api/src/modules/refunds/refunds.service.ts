import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { BookingStatus } from "../bookings/booking.schema";
import { BookingsService } from "../bookings/bookings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import { RefundRequest, RefundRequestDocument, RefundStatus } from "./refund.schema";

@Injectable()
export class RefundsService {
  constructor(
    @InjectModel(RefundRequest.name)
    private readonly refundModel: Model<RefundRequestDocument>,
    private readonly bookings: BookingsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  listMine(customerId: string) {
    return this.refundModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  listPending() {
    return this.refundModel
      .find({ status: RefundStatus.PENDING })
      .sort({ createdAt: 1 })
      .populate("bookingId", "referenceNumber")
      .populate("customerId", "email fullName")
      .populate("providerId", "email fullName")
      .lean();
  }

  async create(customerId: string, bookingId: string, reason?: string) {
    const booking = await this.bookings.requireBooking(bookingId);
    if (booking.customerId.toString() !== customerId) {
      throw new ForbiddenException();
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("Refunds only for completed bookings");
    }
    const exists = await this.refundModel.exists({ bookingId: booking._id });
    if (exists) throw new BadRequestException("Refund already requested");

    const doc = await this.refundModel.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      amountCents: booking.customerTotalCents,
      reason: reason?.trim() ?? "",
      status: RefundStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
    });

    await this.notifications.notify(
      customerId,
      "Refund requested",
      `Your refund request for ${booking.referenceNumber} is pending review.`,
      "refund_request",
    );

    return doc;
  }

  async decide(adminId: string, refundId: string, approve: boolean, adminNote?: string) {
    if (!Types.ObjectId.isValid(refundId)) throw new NotFoundException();
    const req = await this.refundModel.findById(refundId);
    if (!req) throw new NotFoundException();
    if (req.status !== RefundStatus.PENDING) {
      throw new BadRequestException("Already reviewed");
    }

    const booking = await this.bookings.requireBooking(req.bookingId.toString());
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("Booking not completed");
    }

    if (approve) {
      const company = await this.users.getCompanyWalletUser();
      const vat = await this.users.getVatWalletUser();
      await this.users.reverseCompletedPayout({
        customerId: booking.customerId.toString(),
        providerId: booking.providerId.toString(),
        companyWalletId: company.id,
        vatWalletId: vat.id,
        customerTotalCents: booking.customerTotalCents,
        basePriceCents: booking.basePriceCents,
        companyFeeCents: booking.companyFeeCents,
        vatFeeCents: booking.vatFeeCents,
        referenceNumber: booking.referenceNumber,
      });
      req.status = RefundStatus.APPROVED;
    } else {
      req.status = RefundStatus.REJECTED;
    }

    req.reviewedBy = new Types.ObjectId(adminId);
    req.reviewedAt = new Date();
    req.adminNote = adminNote?.trim() ?? "";
    await req.save();

    await this.notifications.notify(
      req.customerId.toString(),
      `Refund ${approve ? "approved" : "rejected"}`,
      approve
        ? `Refund for booking approved. Funds returned to your wallet.`
        : `Refund request rejected.${adminNote ? ` ${adminNote}` : ""}`,
      "refund_request",
    );

    return req;
  }
}
