import { formatPeso } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  cash_in: "Cash in",
  cash_out: "Cash out",
  admin_topup: "Admin top-up",
  booking_escrow: "Booking hold",
  booking_escrow_release: "Booking release",
  booking_earnings: "Booking earnings",
  service_fee: "Service fee",
  service_fee_reversal: "Service fee reversal",
  refund: "Refund",
};

export function walletTransactionLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export type WalletTransaction = {
  _id: string;
  type: string;
  referenceNumber: string;
  amountCents: number;
  balanceBeforeCents: number;
  balanceAfterCents: number;
  createdAt: string;
};

export function formatSignedPeso(centavos: number): string {
  const sign = centavos > 0 ? "+" : centavos < 0 ? "−" : "";
  return `${sign}${formatPeso(Math.abs(centavos))}`;
}
