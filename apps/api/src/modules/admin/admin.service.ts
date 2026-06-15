import { Injectable } from "@nestjs/common";
import { BookingsService } from "../bookings/bookings.service";
import { CategoriesService } from "../categories/categories.service";
import { ListingsService } from "../listings/listings.service";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user.schema";

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UsersService,
    private readonly categories: CategoriesService,
    private readonly listings: ListingsService,
    private readonly bookings: BookingsService,
  ) {}

  async stats() {
    const [humans, customers, providers, admins, categories, listings, publishedListings, bookingsByStatus] =
      await Promise.all([
        this.users.countHumans(),
        this.users.countByRole(UserRole.CUSTOMER),
        this.users.countByRole(UserRole.PROVIDER),
        this.users.countByRole(UserRole.ADMIN),
        this.categories.countAll(),
        this.listings.countAll(),
        this.listings.countPublished(),
        this.bookings.adminCounts(),
      ]);

    return {
      usersTotal: humans,
      customers,
      providers,
      admins,
      categories,
      listings,
      publishedListings,
      bookingsByStatus,
    };
  }
}
