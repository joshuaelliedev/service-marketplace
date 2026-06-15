export type BookingStatus =
  | "pending_provider"
  | "accepted"
  | "rejected"
  | "provider_completed"
  | "completed"
  | "cancelled";

export type CustomerBookingAction = "cancel" | "customer-confirm";
export type ProviderBookingAction = "accept" | "reject" | "provider-complete" | "cancel";

const TERMINAL: BookingStatus[] = ["completed", "cancelled", "rejected"];

export function getCustomerBookingActions(status: string): CustomerBookingAction[] {
  if (TERMINAL.includes(status as BookingStatus)) return [];
  if (status === "provider_completed") return ["customer-confirm", "cancel"];
  if (status === "pending_provider" || status === "accepted") return ["cancel"];
  return [];
}

export function getProviderBookingActions(status: string): ProviderBookingAction[] {
  if (TERMINAL.includes(status as BookingStatus)) return [];
  if (status === "pending_provider") return ["accept", "reject", "cancel"];
  if (status === "accepted") return ["provider-complete", "cancel"];
  if (status === "provider_completed") return ["cancel"];
  return [];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_provider: "Awaiting provider",
  accepted: "Accepted",
  rejected: "Rejected",
  provider_completed: "Awaiting your confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROVIDER_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_provider: "New request",
  accepted: "Accepted — in progress",
  rejected: "Rejected",
  provider_completed: "Awaiting customer confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function customerActionPath(id: string, action: CustomerBookingAction): string {
  return `/bookings/${id}/${action}`;
}

export function providerActionPath(id: string, action: ProviderBookingAction): string {
  const segment = action === "provider-complete" ? "provider-complete" : action;
  return `/bookings/${id}/${segment}`;
}

export const CUSTOMER_ACTION_LABELS: Record<CustomerBookingAction, string> = {
  cancel: "Cancel (7+ days rule)",
  "customer-confirm": "Confirm completion",
};

export const PROVIDER_ACTION_LABELS: Record<ProviderBookingAction, string> = {
  accept: "Accept",
  reject: "Reject",
  "provider-complete": "Mark complete",
  cancel: "Cancel (7+ days rule)",
};

const ACTIVE_STATUSES: BookingStatus[] = [
  "pending_provider",
  "accepted",
  "provider_completed",
];

export function isActiveBooking(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as BookingStatus);
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "pending_provider":
    case "pending":
      return "badge badge--pending";
    case "accepted":
      return "badge badge--accepted";
    case "provider_completed":
      return "badge badge--waiting";
    case "completed":
    case "approved":
      return "badge badge--completed";
    case "rejected":
    case "cancelled":
      return "badge badge--ended";
    default:
      return "badge";
  }
}

export function sortBookingsByServiceDate<T extends { serviceDateYmd: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.serviceDateYmd.localeCompare(a.serviceDateYmd));
}
