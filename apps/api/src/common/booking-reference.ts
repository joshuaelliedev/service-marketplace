import { randomBytes } from "crypto";

/** e.g. BK-20260317-A1B2C3 */
export function generateBookingReference(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `BK-${ymd}-${suffix}`;
}
