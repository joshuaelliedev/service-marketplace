/** Format centavos as Philippine peso (e.g. ₱1,000.00). */
export function formatPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Parse peso input string to centavos. */
export function pesoToCentavos(peso: number): number {
  return Math.round(peso * 100);
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_provider: "Pending provider",
  accepted: "Accepted",
  provider_completed: "Awaiting customer",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function bookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
