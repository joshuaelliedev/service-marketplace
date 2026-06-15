import { getStatusBadgeClass } from "@/lib/booking-actions";

type StatusBadgeProps = {
  label: string;
  status: string;
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return <span className={getStatusBadgeClass(status)}>{label}</span>;
}
