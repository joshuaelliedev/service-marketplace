import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CategoriesService } from "../categories/categories.service";
import { UsersService } from "../users/users.service";
import { KycStatus, UserRole } from "../users/user.schema";
import { ServiceListing, ServiceListingDocument } from "./listing.schema";

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(ServiceListing.name)
    private readonly listingModel: Model<ServiceListingDocument>,
    private readonly categories: CategoriesService,
    private readonly users: UsersService,
  ) {}

  listPublished(categoryId?: string) {
    const q: Record<string, unknown> = { isPublished: true };
    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      q.categoryId = new Types.ObjectId(categoryId);
    }
    return this.listingModel.find(q).sort({ updatedAt: -1 }).lean();
  }

  async getPublished(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Listing not found");
    const doc = await this.listingModel.findOne({ _id: id, isPublished: true }).lean();
    if (!doc) throw new NotFoundException("Listing not found");
    return doc;
  }

  listMine(providerId: string) {
    return this.listingModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ updatedAt: -1 })
      .lean();
  }

  async create(
    providerId: string,
    input: {
      categoryId: string;
      title: string;
      description?: string;
      basePriceCents: number;
      publish?: boolean;
    },
  ) {
    const provider = await this.users.findById(providerId);
    if (!provider) throw new ForbiddenException("User not found");
    if (provider.role !== UserRole.PROVIDER)
      throw new ForbiddenException("Providers only");
    if (provider.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException("KYC must be approved before posting services");
    }
    await this.categories.requireActiveCategoryId(input.categoryId);
    return this.listingModel.create({
      providerId: new Types.ObjectId(providerId),
      categoryId: new Types.ObjectId(input.categoryId),
      title: input.title.trim(),
      description: (input.description ?? "").trim(),
      basePriceCents: input.basePriceCents,
      isPublished: Boolean(input.publish),
    });
  }

  async updateMine(
    providerId: string,
    listingId: string,
    patch: Partial<{
      title: string;
      description: string;
      basePriceCents: number;
      isPublished: boolean;
      categoryId: string;
    }>,
  ) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.providerId.toString() !== providerId)
      throw new ForbiddenException("Not your listing");
    if (patch.categoryId) {
      await this.categories.requireActiveCategoryId(patch.categoryId);
      listing.categoryId = new Types.ObjectId(patch.categoryId);
    }
    if (patch.title !== undefined) listing.title = patch.title.trim();
    if (patch.description !== undefined) listing.description = patch.description.trim();
    if (patch.basePriceCents !== undefined) listing.basePriceCents = patch.basePriceCents;
    if (patch.isPublished !== undefined) listing.isPublished = patch.isPublished;
    await listing.save();
    return listing;
  }

  async deleteMine(providerId: string, listingId: string) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.providerId.toString() !== providerId)
      throw new ForbiddenException("Not your listing");
    await listing.deleteOne();
    return { ok: true };
  }

  countAll(): Promise<number> {
    return this.listingModel.countDocuments();
  }

  countPublished(): Promise<number> {
    return this.listingModel.countDocuments({ isPublished: true });
  }

  async requireListingForBooking(listingId: string): Promise<ServiceListingDocument> {
    if (!Types.ObjectId.isValid(listingId))
      throw new NotFoundException("Listing not found");
    const listing = await this.listingModel.findOne({
      _id: listingId,
      isPublished: true,
    });
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }
}
