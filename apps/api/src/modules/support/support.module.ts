import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  SupportMessage,
  SupportMessageSchema,
  SupportTicket,
  SupportTicketSchema,
} from "./support.schema";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: SupportMessage.name, schema: SupportMessageSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
