import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { computePricingCents } from "../../common/money";
import { canSelfServiceCancel } from "../../common/ph-calendar";
import { ListingsService } from "../listings/listings.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user.schema";
import { Booking, BookingDocument, BookingStatus, SlotHalf } from "./booking.schema";

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PROVIDER,
  BookingStatus.ACCEPTED,
  BookingStatus.PROVIDER_COMPLETED,
];

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly listings: ListingsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    customerId: string,
    input: { listingId: string; serviceDateYmd: string; slotHalf: SlotHalf },
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.serviceDateYmd)) {
      throw new BadRequestException("serviceDateYmd must be YYYY-MM-DD");
    }
    if (!Object.values(SlotHalf).includes(input.slotHalf)) {
      throw new BadRequestException("slotHalf must be AM or PM");
    }

    const listing = await this.listings.requireListingForBooking(input.listingId);
    if (listing.providerId.toString() === customerId) {
      throw new BadRequestException("You cannot book your own listing");
    }

    const conflict = await this.bookingModel.exists({
      listingId: listing._id,
      serviceDateYmd: input.serviceDateYmd,
      slotHalf: input.slotHalf,
      status: { $in: ACTIVE_STATUSES },
    });
    if (conflict) throw new BadRequestException("That slot is already booked");

    const provider = await this.users.findById(listing.providerId.toString());
    if (!provider) throw new BadRequestException("Provider missing");

    const { customerTotalCents, platformFeeCents } = computePricingCents(
      listing.basePriceCents,
      provider.providerFeePercent,
      provider.providerFeeFixedCents,
    );

    await this.users.reserveForBooking(customerId, customerTotalCents);

    const booking = await this.bookingModel.create({
      listingId: listing._id,
      providerId: listing.providerId,
      customerId: new Types.ObjectId(customerId),
      serviceDateYmd: input.serviceDateYmd,
      slotHalf: input.slotHalf,
      status: BookingStatus.PENDING_PROVIDER,
      basePriceCents: listing.basePriceCents,
      platformFeeCents,
      customerTotalCents,
    });

    await this.notifications.notify(
      listing.providerId.toString(),
      "New booking request",
      `A customer booked your service for ${input.serviceDateYmd} (${input.slotHalf}).`,
      "booking_created",
    );

    return booking;
  }

  listMine(userId: string, role: UserRole) {
    const uid = new Types.ObjectId(userId);
    if (role === UserRole.CUSTOMER) {
      return this.bookingModel.find({ customerId: uid }).sort({ createdAt: -1 }).lean();
    }
    if (role === UserRole.PROVIDER) {
      return this.bookingModel.find({ providerId: uid }).sort({ createdAt: -1 }).lean();
    }
    return this.bookingModel.find().sort({ createdAt: -1 }).limit(500).lean();
  }

  async getOne(userId: string, role: UserRole, bookingId: string) {
    if (!Types.ObjectId.isValid(bookingId)) throw new NotFoundException("Not found");
    const b = await this.bookingModel.findById(bookingId).lean();
    if (!b) throw new NotFoundException("Not found");
    if (role === UserRole.ADMIN) return b;
    if (b.customerId.toString() !== userId && b.providerId.toString() !== userId) {
      throw new ForbiddenException();
    }
    return b;
  }

  async accept(providerId: string, bookingId: string) {
    const booking = await this.requireBooking(bookingId);
    if (booking.providerId.toString() !== providerId)
      throw new ForbiddenException("Not your booking");
    if (booking.status !== BookingStatus.PENDING_PROVIDER) {
      throw new BadRequestException("Invalid state");
    }
    booking.status = BookingStatus.ACCEPTED;
    await booking.save();
    await this.notifications.notify(
      booking.customerId.toString(),
      "Booking accepted",
      "The provider accepted your booking.",
      "booking_accepted",
    );
    return booking;
  }

  async reject(providerId: string, bookingId: string) {
    const booking = await this.requireBooking(bookingId);
    if (booking.providerId.toString() !== providerId)
      throw new ForbiddenException("Not your booking");
    if (booking.status !== BookingStatus.PENDING_PROVIDER) {
      throw new BadRequestException("Invalid state");
    }
    await this.users.releaseEscrowToAvailable(
      booking.customerId.toString(),
      booking.customerTotalCents,
    );
    booking.status = BookingStatus.REJECTED;
    await booking.save();
    await this.notifications.notify(
      booking.customerId.toString(),
      "Booking rejected",
      "The provider rejected your booking. Your payment was returned to your wallet.",
      "booking_rejected",
    );
    return booking;
  }

  async markProviderComplete(providerId: string, bookingId: string) {
    const booking = await this.requireBooking(bookingId);
    if (booking.providerId.toString() !== providerId)
      throw new ForbiddenException("Not your booking");
    if (booking.status !== BookingStatus.ACCEPTED) {
      throw new BadRequestException("Invalid state");
    }
    booking.status = BookingStatus.PROVIDER_COMPLETED;
    await booking.save();
    await this.notifications.notify(
      booking.customerId.toString(),
      "Service marked complete",
      "Please confirm completion to release payment.",
      "booking_provider_completed",
    );
    return booking;
  }

  async customerConfirm(customerId: string, bookingId: string) {
    const booking = await this.requireBooking(bookingId);
    if (booking.customerId.toString() !== customerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PROVIDER_COMPLETED) {
      throw new BadRequestException("Invalid state");
    }

    const platform = await this.users.getPlatformWalletUser();
    await this.users.payoutCompletedBooking({
      customerId: booking.customerId.toString(),
      providerId: booking.providerId.toString(),
      platformUserId: platform.id,
      customerTotalCents: booking.customerTotalCents,
      basePriceCents: booking.basePriceCents,
      platformFeeCents: booking.platformFeeCents,
    });

    booking.status = BookingStatus.COMPLETED;
    await booking.save();

    await this.notifications.notify(
      booking.providerId.toString(),
      "Booking completed",
      "The customer confirmed completion. Funds were released.",
      "booking_completed",
    );
    await this.notifications.notify(
      booking.customerId.toString(),
      "Booking completed",
      "Thanks — this booking is now completed.",
      "booking_completed",
    );

    return booking;
  }

  async cancel(actorId: string, role: UserRole, bookingId: string) {
    const booking = await this.requireBooking(bookingId);
    if (booking.customerId.toString() !== actorId && booking.providerId.toString() !== actorId) {
      throw new ForbiddenException();
    }
    if (role !== UserRole.CUSTOMER && role !== UserRole.PROVIDER) {
      throw new ForbiddenException();
    }
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REJECTED
    ) {
      throw new BadRequestException("Cannot cancel this booking");
    }

    if (!canSelfServiceCancel(booking.serviceDateYmd)) {
      throw new BadRequestException(
        "Self-service cancel is only allowed at least 7 calendar days before the service date (PH).",
      );
    }

    if (
      booking.status === BookingStatus.PENDING_PROVIDER ||
      booking.status === BookingStatus.ACCEPTED ||
      booking.status === BookingStatus.PROVIDER_COMPLETED
    ) {
      await this.users.releaseEscrowToAvailable(
        booking.customerId.toString(),
        booking.customerTotalCents,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    const other =
      booking.customerId.toString() === actorId
        ? booking.providerId.toString()
        : booking.customerId.toString();
    await this.notifications.notify(
      other,
      "Booking cancelled",
      "A booking was cancelled (within the allowed window).",
      "booking_cancelled",
    );

    return booking;
  }

  async adminCounts() {
    const byStatus = await this.bookingModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(byStatus.map((x) => [x._id, x.count]));
  }

  private async requireBooking(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Not found");
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException("Not found");
    return booking;
  }
}
