"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingChat } from "@/components/booking-chat";
import { apiJson } from "@/lib/api";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-actions";
import { getToken } from "@/lib/auth-storage";
import { formatServiceDate, formatSlotLabel } from "@/lib/format";
import { buildListingTitleMap } from "@/lib/listing-titles";
import { useChatUnread } from "@/lib/use-chat-unread";
import { useMe } from "@/lib/use-me";

type Booking = {
  _id: string;
  status: string;
  serviceDateYmd: string;
  slotHalf: string;
  listingId: string | { _id: string };
};

export default function BookingChatPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const { me, loading: meLoading } = useMe();
  const { refresh: refreshUnread } = useChatUnread();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [title, setTitle] = useState("Service");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meLoading || !me) return;
    const token = getToken();
    if (!token) return;
    void (async () => {
      try {
        const b = await apiJson<Booking>(`/bookings/${bookingId}`, { token });
        setBooking(b);
        const titles = await buildListingTitleMap([b], me.role as "customer" | "provider", token);
        const lid = typeof b.listingId === "string" ? b.listingId : b.listingId._id;
        setTitle(titles[lid] ?? "Service");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Cannot open chat");
      }
    })();
  }, [bookingId, me, meLoading]);

  const backHref = me?.role === "provider" ? "/provider/bookings" : "/bookings";
  const statusLabel =
    booking &&
    (BOOKING_STATUS_LABELS[booking.status as keyof typeof BOOKING_STATUS_LABELS] ?? booking.status);

  if (meLoading || (!me && !error)) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <p className="text-error">{error}</p>
        <p>
          <Link href={backHref}>← Back to bookings</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href={backHref}>← Bookings</Link> / Chat
      </p>
      <h1>{title}</h1>
      {booking ? (
        <p className="text-muted">
          {formatServiceDate(booking.serviceDateYmd)} · {formatSlotLabel(booking.slotHalf)}
          {statusLabel ? ` · ${statusLabel}` : ""}
        </p>
      ) : null}
      <p className="text-muted">Chat with the {me?.role === "provider" ? "customer" : "provider"} about this booking.</p>

      <BookingChat bookingId={bookingId} onRead={refreshUnread} />
    </main>
  );
}
