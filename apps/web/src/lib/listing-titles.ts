import { apiJson } from "@/lib/api";
import { normalizeId } from "@/lib/format";

type ListingRef = { _id: string; title: string };

export async function buildListingTitleMap(
  bookings: { listingId: string | { _id: string } }[],
  role: "customer" | "provider",
  token: string,
): Promise<Record<string, string>> {
  const ids = [...new Set(bookings.map((b) => normalizeId(b.listingId)))];

  if (role === "provider") {
    const mine = await apiJson<ListingRef[]>("/listings/mine", { token });
    const map = Object.fromEntries(mine.map((l) => [l._id, l.title]));
    return Object.fromEntries(ids.map((id) => [id, map[id] ?? "Service"]));
  }

  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const listing = await apiJson<ListingRef>(`/listings/${id}`);
        return [id, listing.title] as const;
      } catch {
        return [id, "Service"] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
