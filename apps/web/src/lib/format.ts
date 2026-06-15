import { SLOT_WINDOWS, type DayHalf } from "@repo/domain";

/** Format centavos as Philippine peso (e.g. ₱1,000.00). */
export function formatPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format YYYY-MM-DD for display. */
export function formatServiceDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatSlotLabel(slotHalf: string): string {
  const half = slotHalf as DayHalf;
  const w = SLOT_WINDOWS[half];
  if (!w) return slotHalf;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.label} (${half}) · ${w.startHour}:${pad(w.startMinute)}–${w.endHour}:${pad(w.endMinute)}`;
}

export function excerpt(text: string, max = 120): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function normalizeId(id: string | { _id: string }): string {
  return typeof id === "string" ? id : id._id;
}
