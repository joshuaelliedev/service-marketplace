import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const PH = "Asia/Manila";

export function phTodayYmd(): string {
  return formatInTimeZone(new Date(), PH, "yyyy-MM-dd");
}

/** Full calendar days from today (PH) to the service date (inclusive counting as user-facing “days away”). */
export function calendarDaysFromTodayPh(serviceDateYmd: string): number {
  const today = parseISO(phTodayYmd());
  const svc = parseISO(serviceDateYmd);
  return differenceInCalendarDays(svc, today);
}

/** Self-service cancel allowed only when the service is still at least 7 calendar days away in PH. */
export function canSelfServiceCancel(serviceDateYmd: string): boolean {
  return calendarDaysFromTodayPh(serviceDateYmd) >= 7;
}
