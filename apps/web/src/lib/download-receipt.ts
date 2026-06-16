import { getApiBaseUrl } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";

export async function downloadBookingReceipt(bookingId: string, filename: string) {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${getApiBaseUrl()}/bookings/${bookingId}/receipt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 200) || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
