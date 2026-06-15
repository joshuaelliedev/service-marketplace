/** IANA timezone for slot labels and reporting (Philippines). */
export const DEFAULT_APP_TIMEZONE = "Asia/Manila" as const;

export type DayHalf = "AM" | "PM";

/** Inclusive start, exclusive end, 24h local wall clock in `DEFAULT_APP_TIMEZONE`. */
export const SLOT_WINDOWS: Record<
  DayHalf,
  { label: string; startHour: number; startMinute: number; endHour: number; endMinute: number }
> = {
  AM: { label: "Morning", startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
  PM: { label: "Afternoon", startHour: 13, startMinute: 0, endHour: 17, endMinute: 0 },
};

export const DAY_HALVES: DayHalf[] = ["AM", "PM"];
