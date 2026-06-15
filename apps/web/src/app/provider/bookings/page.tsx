"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookingCard } from "@/components/booking-card";
import { EmptyState } from "@/components/empty-state";
import { apiJson } from "@/lib/api";
import {
  getProviderBookingActions,
  isActiveBooking,
  PROVIDER_ACTION_LABELS,
  PROVIDER_STATUS_LABELS,
  providerActionPath,
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
};

export default function ProviderBookingsPage() {
  const { ready } = useRequireRole("provider");
  const { byBookingId, refresh: refreshChatUnread } = useChatUnread();
  const [items, setItems] = useState<Booking[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Booking[]>("/bookings/mine", { token });
    const titleMap = await buildListingTitleMap(data, "provider", token);
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

  function renderBooking(b: Booking) {
    const listingId = normalizeId(b.listingId);
    const actions = getProviderBookingActions(b.status);
    const statusLabel =
      PROVIDER_STATUS_LABELS[b.status as keyof typeof PROVIDER_STATUS_LABELS] ?? b.status;

    return (
      <li key={b._id}>
        <BookingCard
          serviceTitle={titles[listingId] ?? "Service"}
          serviceDateYmd={b.serviceDateYmd}
          slotHalf={b.slotHalf}
          status={b.status}
          statusLabel={statusLabel}
          totalCents={b.customerTotalCents}
          chatHref={`/bookings/${b._id}/chat`}
          unreadMessages={byBookingId[b._id] ?? 0}
        >
          {actions.length > 0
            ? actions.map((action) => {
                const path = providerActionPath(b._id, action);
                const isReject = action === "reject";
                return (
                  <button
                    key={action}
                    type="button"
                    className={isReject ? "btn-secondary" : undefined}
                    disabled={acting === path}
                    onClick={() => act(path)}
                  >
                    {acting === path ? "Working…" : PROVIDER_ACTION_LABELS[action]}
                  </button>
                );
              })
            : null}
        </BookingCard>
      </li>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link> / Incoming bookings
      </p>
      <h1>Incoming bookings</h1>
      <p>Review requests, accept jobs, and mark services complete when done.</p>

      {error ? <p className="text-error">{error}</p> : null}
      {!items ? <p>Loading bookings…</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When customers book your listings, requests will appear here."
          action={
            <Link href="/provider/listings" className="btn">
              Manage my listings
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
