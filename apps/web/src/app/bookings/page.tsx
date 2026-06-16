"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookingCard } from "@/components/booking-card";
import { BookingExtras } from "@/components/booking-extras";
import { EmptyState } from "@/components/empty-state";
import { apiJson } from "@/lib/api";
import {
  BOOKING_STATUS_LABELS,
  CUSTOMER_ACTION_LABELS,
  customerActionPath,
  getCustomerBookingActions,
  isActiveBooking,
  sortBookingsByServiceDate,
} from "@/lib/booking-actions";
import { getToken } from "@/lib/auth-storage";
import { normalizeId } from "@/lib/format";
import { buildListingTitleMap } from "@/lib/listing-titles";
import { useChatUnread } from "@/lib/use-chat-unread";
import { useRequireRole } from "@/lib/use-require-role";

type Booking = {
  _id: string;
  status: string;
  serviceDateYmd: string;
  slotHalf: string;
  customerTotalCents: number;
  listingId: string | { _id: string };
  referenceNumber?: string;
  paymentMethod?: string;
};

export default function BookingsPage() {
  const { ready } = useRequireRole("customer");
  const { byBookingId, refresh: refreshChatUnread } = useChatUnread();
  const [items, setItems] = useState<Booking[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Booking[]>("/bookings/mine", { token });
    const titleMap = await buildListingTitleMap(data, "customer", token);
    setItems(sortBookingsByServiceDate(data));
    setTitles(titleMap);
  }

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [ready]);

  async function act(path: string) {
    const token = getToken();
    if (!token) return;
    setError(null);
    setActing(path);
    try {
      await apiJson(path, { method: "POST", token });
      await load();
      refreshChatUnread();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const { active, past } = useMemo(() => {
    if (!items) return { active: [], past: [] };
    return {
      active: items.filter((b) => isActiveBooking(b.status)),
      past: items.filter((b) => !isActiveBooking(b.status)),
    };
  }, [items]);

  if (!ready) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  function totalLabelFor(b: Booking): string {
    if (b.status === "completed") return "Total paid";
    if (b.paymentMethod === "cash") return "Service total";
    return "Total held";
  }

  function paymentLabel(method?: string): string {
    if (method === "wallet") return "Wallet";
    if (method === "cash") return "Cash";
    return method ?? "";
  }

  function renderBooking(b: Booking) {
    const listingId = normalizeId(b.listingId);
    const actions = getCustomerBookingActions(b.status);
    const statusLabel =
      BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ?? b.status;

    return (
      <li key={b._id} className="booking-list__item">
        <BookingCard
          referenceNumber={b.referenceNumber}
          paymentMethod={paymentLabel(b.paymentMethod)}
          serviceTitle={titles[listingId] ?? "Service"}
          serviceDateYmd={b.serviceDateYmd}
          slotHalf={b.slotHalf}
          status={b.status}
          statusLabel={statusLabel}
          totalCents={b.customerTotalCents}
          totalLabel={totalLabelFor(b)}
          chatHref={`/bookings/${b._id}/chat`}
          unreadMessages={byBookingId[b._id] ?? 0}
        >
          {actions.length > 0
            ? actions.map((action) => {
                const path = customerActionPath(b._id, action);
                return (
                  <button
                    key={action}
                    type="button"
                    disabled={acting === path}
                    onClick={() => act(path)}
                  >
                    {acting === path ? "Working…" : CUSTOMER_ACTION_LABELS[action]}
                  </button>
                );
              })
            : null}
        </BookingCard>
        <BookingExtras
          bookingId={b._id}
          referenceNumber={b.referenceNumber}
          status={b.status}
        />
      </li>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link> / My bookings
      </p>
      <h1>My bookings</h1>
      <p>Track upcoming services and confirm when your provider marks a job complete.</p>

      {error ? <p className="text-error">{error}</p> : null}
      {!items ? <p>Loading bookings…</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Browse services and book a slot that works for you."
          action={
            <Link href="/listings" className="btn">
              Browse services
            </Link>
          }
        />
      ) : null}

      {active.length > 0 ? (
        <section className="section-block">
          <h2>Active ({active.length})</h2>
          <ul className="booking-list">{active.map(renderBooking)}</ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="section-block">
          <h2>Past ({past.length})</h2>
          <ul className="booking-list">{past.map(renderBooking)}</ul>
        </section>
      ) : null}
    </main>
  );
}
