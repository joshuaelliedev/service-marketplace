import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import PDFDocument from "pdfkit";
import { BookingDocument, BookingStatus, PaymentMethod } from "./booking.schema";
import { BookingsService } from "./bookings.service";
import { UserRole } from "../users/user.schema";

function peso(centavos: number | undefined | null): string {
  const n = Number(centavos);
  if (!Number.isFinite(n)) return "PHP —";
  return `PHP ${(n / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function legacyReference(booking: BookingDocument): string {
  const created =
    (booking as BookingDocument & { createdAt?: Date }).createdAt ?? new Date();
  const ymd = created.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = booking._id.toString().slice(-6).toUpperCase();
  return `BK-${ymd}-${suffix}`;
}

function paymentLabel(method: PaymentMethod | undefined): string {
  if (method === PaymentMethod.WALLET) return "Wallet";
  if (method === PaymentMethod.CASH) return "Cash";
  return "Wallet";
}

/** Backfill v1.1 fields on bookings created before the schema migration. */
async function normalizeReceiptBooking(booking: BookingDocument): Promise<{
  referenceNumber: string;
  paymentMethod: PaymentMethod;
  serviceFeeCents: number;
}> {
  const base = booking.basePriceCents ?? 0;
  const total = booking.customerTotalCents ?? base;
  const serviceFeeCents =
    Number.isFinite(booking.serviceFeeCents) && booking.serviceFeeCents >= 0
      ? booking.serviceFeeCents
      : Math.max(0, total - base);

  const referenceNumber = booking.referenceNumber?.trim() || legacyReference(booking);
  const paymentMethod = booking.paymentMethod ?? PaymentMethod.WALLET;

  let dirty = false;
  if (!booking.referenceNumber) {
    booking.referenceNumber = referenceNumber;
    dirty = true;
  }
  if (!booking.paymentMethod) {
    booking.paymentMethod = paymentMethod;
    dirty = true;
  }
  if (!Number.isFinite(booking.serviceFeeCents) || booking.serviceFeeCents < 0) {
    booking.serviceFeeCents = serviceFeeCents;
    dirty = true;
  }
  if (!Number.isFinite(booking.companyFeeCents)) {
    booking.companyFeeCents = serviceFeeCents;
    dirty = true;
  }
  if (!Number.isFinite(booking.vatFeeCents)) {
    booking.vatFeeCents = 0;
    dirty = true;
  }
  if (dirty) {
    await booking.save();
  }

  return { referenceNumber, paymentMethod, serviceFeeCents };
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly bookings: BookingsService) {}

  async generatePdf(userId: string, role: UserRole, bookingId: string) {
    const booking = await this.bookings.requireBooking(bookingId);
    if (role !== UserRole.ADMIN) {
      if (
        booking.customerId.toString() !== userId &&
        booking.providerId.toString() !== userId
      ) {
        throw new ForbiddenException();
      }
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ForbiddenException("Receipt available for completed bookings only");
    }

    const { referenceNumber, paymentMethod, serviceFeeCents } =
      await normalizeReceiptBooking(booking);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text("Service Marketplace", { align: "center" });
    doc.fontSize(14).text("Official Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Reference: ${referenceNumber}`);
    doc.text(`Service date: ${booking.serviceDateYmd} (${booking.slotHalf})`);
    doc.text(`Payment: ${paymentLabel(paymentMethod)}`);
    doc.text(`Status: ${booking.status}`);
    doc.moveDown();
    doc.text(`Base price: ${peso(booking.basePriceCents)}`);
    doc.text(`Service fee: ${peso(serviceFeeCents)}`);
    doc.text(`Total paid: ${peso(booking.customerTotalCents)}`, { underline: true });
    doc.moveDown();
    doc.fontSize(9).fillColor("#666").text("Thank you for using our platform.");

    doc.end();
    const buffer = await done;

    return new StreamableFile(buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="${referenceNumber}.pdf"`,
    });
  }
}
