"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DAY_HALVES } from "@repo/domain";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { formatPeso, formatSlotLabel } from "@/lib/format";
import { useMe } from "@/lib/use-me";

type Listing = {
  _id: string;
  title: string;
  description?: string;
  basePriceCents: number;
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { me } = useMe();
  const id = params.id;
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [serviceDateYmd, setServiceDateYmd] = useState("");
  const [slotHalf, setSlotHalf] = useState<"AM" | "PM">("AM");
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [bookingOk, setBookingOk] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiJson<Listing>(`/listings/${id}`);
        setListing(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [id]);

  async function book() {
    setBookingMsg(null);
    setBookingOk(false);
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      await apiJson("/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({ listingId: id, serviceDateYmd, slotHalf }),
      });
      setBookingOk(true);
      setBookingMsg("Booked! Payment is held until the job is complete (or refunded if rejected/cancelled).");
    } catch (e) {
      setBookingMsg(e instanceof Error ? e.message : "Booking failed");
    }
  }

  if (error)
    return (
      <main>
        <p className="text-error">{error}</p>
      </main>
    );
  if (!listing)
    return (
      <main>
        <p>Loading…</p>
      </main>
    );

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/listings">← Browse services</Link>
      </p>

      <div className="detail-layout">
        <section>
          <h1>{listing.title}</h1>
          {listing.description ? <p>{listing.description}</p> : <p className="text-muted">No description provided.</p>}
          <p className="price-highlight">{formatPeso(listing.basePriceCents)}</p>
          <p className="text-muted">Platform fee is added at checkout. Funds are held in escrow until completion.</p>
          <h2>Available slots</h2>
          <ul>
            {DAY_HALVES.map((half) => (
              <li key={half}>
                <strong>{formatSlotLabel(half)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <aside className="detail-panel">
          {me?.role === "provider" ? (
            <>
              <h2>Booking</h2>
              <p className="text-muted">
                Provider accounts cannot book services. Use a customer account to book this service.
              </p>
            </>
          ) : (
            <>
              <h2>Book this service</h2>
              {!me ? (
                <p className="text-muted">
                  <Link href="/login">Log in</Link> or <Link href="/signup">sign up</Link> to book.
                </p>
              ) : null}
              <div className="form">
                <label className="field">
                  <span>Service date</span>
                  <input
                    type="date"
                    value={serviceDateYmd}
                    onChange={(e) => setServiceDateYmd(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Time slot</span>
                  <select value={slotHalf} onChange={(e) => setSlotHalf(e.target.value as "AM" | "PM")}>
                    {DAY_HALVES.map((half) => (
                      <option key={half} value={half}>
                        {formatSlotLabel(half)}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={book} disabled={!serviceDateYmd}>
                  Book & hold payment
                </button>
                {bookingMsg ? (
                  <p className={bookingOk ? undefined : "text-error"}>{bookingMsg}</p>
                ) : null}
                {bookingOk ? (
                  <p>
                    <Link href="/bookings">View my bookings →</Link>
                  </p>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
