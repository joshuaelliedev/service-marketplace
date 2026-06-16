import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserRole } from "../users/user.schema";
import {
  SupportMessage,
  SupportMessageDocument,
  SupportTicket,
  SupportTicketDocument,
  SupportTicketStatus,
} from "./support.schema";

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name)
    private readonly ticketModel: Model<SupportTicketDocument>,
    @InjectModel(SupportMessage.name)
    private readonly messageModel: Model<SupportMessageDocument>,
  ) {}

  listMine(userId: string) {
    return this.ticketModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean();
  }

  listOpen() {
    return this.ticketModel
      .find({ status: SupportTicketStatus.OPEN })
      .sort({ updatedAt: -1 })
      .populate("userId", "email fullName role")
      .lean();
  }

  async createTicket(
    userId: string,
    input: { subject: string; body: string; imageUrl?: string },
  ) {
    const ticket = await this.ticketModel.create({
      userId: new Types.ObjectId(userId),
      subject: input.subject.trim(),
      status: SupportTicketStatus.OPEN,
    });
    await this.messageModel.create({
      ticketId: ticket._id,
      authorId: new Types.ObjectId(userId),
      isAdmin: false,
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() ?? "",
    });
    return ticket;
  }

  async listMessages(userId: string, role: UserRole, ticketId: string) {
    const ticket = await this.requireTicket(ticketId);
    if (role !== UserRole.ADMIN && ticket.userId.toString() !== userId) {
      throw new ForbiddenException();
    }
    return this.messageModel
      .find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .lean();
  }

  async reply(
    userId: string,
    role: UserRole,
    ticketId: string,
    input: { body: string; imageUrl?: string },
  ) {
    const ticket = await this.requireTicket(ticketId);
    const isAdmin = role === UserRole.ADMIN;
    if (!isAdmin && ticket.userId.toString() !== userId) {
      throw new ForbiddenException();
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException("Ticket is closed");
    }
    await this.messageModel.create({
      ticketId: ticket._id,
      authorId: new Types.ObjectId(userId),
      isAdmin,
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() ?? "",
    });
    await this.ticketModel.updateOne(
      { _id: ticket._id },
      { $set: { updatedAt: new Date() } },
    );
    return { ok: true };
  }

  async close(adminId: string, ticketId: string) {
    const ticket = await this.requireTicket(ticketId);
    ticket.status = SupportTicketStatus.CLOSED;
    await ticket.save();
    return ticket;
  }

  private async requireTicket(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException();
    return ticket;
  }
}
