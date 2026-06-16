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
import { Rating, RatingDocument } from "./rating.schema";

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private readonly ratingModel: Model<RatingDocument>,
    private readonly bookings: BookingsService,
  ) {}

  async create(
    customerId: string,
    bookingId: string,
    input: { stars: number; comment?: string },
  ) {
    if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
      throw new BadRequestException("Stars must be 1–5");
    }
    const booking = await this.bookings.requireBooking(bookingId);
    if (booking.customerId.toString() !== customerId) {
      throw new ForbiddenException();
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("Can only rate completed bookings");
    }
    const exists = await this.ratingModel.exists({
      bookingId: booking._id,
    });
    if (exists) throw new BadRequestException("Already rated");

    return this.ratingModel.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      stars: input.stars,
      comment: input.comment?.trim() ?? "",
    });
  }

  listForProvider(providerId: string) {
    return this.ratingModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .populate("customerId", "fullName email")
      .lean();
  }

  async getForBooking(customerId: string, bookingId: string) {
    if (!Types.ObjectId.isValid(bookingId)) throw new NotFoundException();
    return this.ratingModel
      .findOne({
        bookingId: new Types.ObjectId(bookingId),
        customerId: new Types.ObjectId(customerId),
      })
      .lean();
  }
}
