import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import {
  WalletRequest,
  WalletRequestDocument,
  WalletRequestStatus,
  WalletRequestType,
} from "./wallet-request.schema";

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(WalletRequest.name)
    private readonly requestModel: Model<WalletRequestDocument>,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  listMine(userId: string) {
    return this.requestModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async createRequest(
    userId: string,
    input: { type: WalletRequestType; amountCents: number; userNote?: string },
  ) {
    if (!Number.isFinite(input.amountCents) || input.amountCents < 1) {
      throw new BadRequestException("Invalid amount");
    }
    const user = await this.users.findById(userId);
    if (!user || user.isSystemWallet) throw new BadRequestException("Invalid user");

    if (input.type === WalletRequestType.CASH_OUT_DIRECT) {
      if (user.walletAvailableCents < input.amountCents) {
        throw new BadRequestException("Insufficient available balance for cash out");
      }
    }

    const pending = await this.requestModel.exists({
      userId: new Types.ObjectId(userId),
      type: input.type,
      status: WalletRequestStatus.PENDING,
    });
    if (pending) {
      throw new BadRequestException("You already have a pending request of this type");
    }

    const doc = await this.requestModel.create({
      userId: new Types.ObjectId(userId),
      type: input.type,
      amountCents: Math.floor(input.amountCents),
      userNote: (input.userNote ?? "").trim(),
      status: WalletRequestStatus.PENDING,
      reviewedBy: null,
      reviewedAt: null,
    });

    const label =
      input.type === WalletRequestType.CASH_IN_DIRECT ? "Cash in" : "Cash out";
    await this.notifications.notify(
      userId,
      `${label} request submitted`,
      `Your ${label.toLowerCase()} request is pending admin approval.`,
      "wallet_request",
    );

    return doc;
  }

  listPending() {
    return this.requestModel
      .find({ status: WalletRequestStatus.PENDING })
      .sort({ createdAt: 1 })
      .populate("userId", "email fullName role")
      .lean();
  }

  async decide(adminId: string, requestId: string, approve: boolean, adminNote?: string) {
    if (!Types.ObjectId.isValid(requestId)) throw new NotFoundException("Not found");
    const req = await this.requestModel.findById(requestId);
    if (!req) throw new NotFoundException("Not found");
    if (req.status !== WalletRequestStatus.PENDING) {
      throw new BadRequestException("Request already reviewed");
    }

    const userId = req.userId.toString();

    if (approve) {
      if (req.type === WalletRequestType.CASH_IN_DIRECT) {
        await this.users.adminTopUp(userId, req.amountCents);
      } else {
        await this.users.adminCashOut(userId, req.amountCents);
      }
      req.status = WalletRequestStatus.APPROVED;
    } else {
      req.status = WalletRequestStatus.REJECTED;
    }

    req.reviewedBy = new Types.ObjectId(adminId);
    req.reviewedAt = new Date();
    req.adminNote = adminNote?.trim() ?? "";
    await req.save();

    const label =
      req.type === WalletRequestType.CASH_IN_DIRECT ? "Cash in" : "Cash out";
    await this.notifications.notify(
      userId,
      `${label} request ${approve ? "approved" : "rejected"}`,
      approve
        ? `Your ${label.toLowerCase()} request was approved.`
        : `Your ${label.toLowerCase()} request was rejected.${adminNote ? ` Note: ${adminNote}` : ""}`,
      "wallet_request",
    );

    return req;
  }
}
