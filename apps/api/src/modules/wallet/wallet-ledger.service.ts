import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionType,
} from "./wallet-transaction.schema";

@Injectable()
export class WalletLedgerService {
  constructor(
    @InjectModel(WalletTransaction.name)
    private readonly txModel: Model<WalletTransactionDocument>,
  ) {}

  listMine(userId: string, limit = 100) {
    return this.txModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async record(input: {
    userId: string;
    type: WalletTransactionType;
    referenceNumber: string;
    balanceBeforeCents: number;
    balanceAfterCents: number;
  }): Promise<void> {
    const amountCents = input.balanceAfterCents - input.balanceBeforeCents;
    if (amountCents === 0) return;

    await this.txModel.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      referenceNumber: input.referenceNumber.trim(),
      amountCents,
      balanceBeforeCents: input.balanceBeforeCents,
      balanceAfterCents: input.balanceAfterCents,
    });
  }
}
