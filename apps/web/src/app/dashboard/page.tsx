"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api";
import { isActiveBooking } from "@/lib/booking-actions";
import { getToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { useRequireAuth } from "@/lib/use-require-auth";

type Booking = {
  _id: string;
  status: string;
  customerTotalCents: number;
  basePriceCents: number;
};

type Listing = {
  _id: string;
  isPublished: boolean;
};

function countByStatus(bookings: Booking[]) {
  const counts: Record<string, number> = {};
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  }
  return counts;
}

export default function DashboardPage() {
  const { me, ready } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !me) return;
    const token = getToken();
    if (!token) return;
    void (async () => {
      try {
        const bookingData = await apiJson<Booking[]>("/bookings/mine", { token });
        setBookings(bookingData);
        if (me.role === "provider") {
          const listingData = await apiJson<Listing[]>("/listings/mine", { token });
          setListings(listingData);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reports");
      }
    })();
  }, [ready, me]);

  const stats = useMemo(() => {
    if (!bookings) return null;
    const byStatus = countByStatus(bookings);
    const active = bookings.filter((b) => isActiveBooking(b.status)).length;
    const completed = bookings.filter((b) => b.status === "completed");
    const completedEarnings = completed.reduce((sum, b) => sum + b.basePriceCents, 0);
    const completedSpend = completed.reduce((sum, b) => sum + b.customerTotalCents, 0);
    return { byStatus, active, completed: completed.length, completedEarnings, completedSpend };
  }, [bookings]);

  const listingStats = useMemo(() => {
    if (!listings) return null;
    return {
      total: listings.length,
      published: listings.filter((l) => l.isPublished).length,
      drafts: listings.filter((l) => !l.isPublished).length,
    };
  }, [listings]);

  if (!ready || !me) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  const isProvider = me.role === "provider";

  return (
    <main className="main-wide">
      <h1>{isProvider ? "Provider reports" : "My activity"}</h1>
      <p className="text-muted">
        Overview of your bookings{isProvider ? ", listings, and earnings" : ""}. Account details
        are on <Link href="/profile">My profile</Link>.
      </p>

      {error ? <p className="text-error">{error}</p> : null}
      {!bookings ? <p>Loading reports…</p> : null}

      {stats ? (
        <div className="stat-grid section-block">
          <div className="stat-card">
            <span className="stat-card__label">Active bookings</span>
            <span className="stat-card__value">{stats.active}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Completed</span>
            <span className="stat-card__value">{stats.completed}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">
              {isProvider ? "Earnings (completed)" : "Total spent (completed)"}
            </span>
            <span className="stat-card__value">
              {formatPeso(isProvider ? stats.completedEarnings : stats.completedSpend)}
            </span>
          </div>
          {isProvider && listingStats ? (
            <div className="stat-card">
              <span className="stat-card__label">Published listings</span>
              <span className="stat-card__value">
                {listingStats.published}
                <span className="stat-card__sub"> / {listingStats.total} total</span>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {stats && Object.keys(stats.byStatus).length > 0 ? (
        <section className="detail-panel section-block">
          <h2>Bookings by status</h2>
          <ul className="status-breakdown">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status}>
                <span className="status-breakdown__label">{status.replace(/_/g, " ")}</span>
                <span className="status-breakdown__count">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isProvider && listingStats ? (
        <section className="detail-panel section-block">
          <h2>Listings</h2>
          <p>
            <strong>{listingStats.published}</strong> published ·{" "}
            <strong>{listingStats.drafts}</strong> drafts
          </p>
          <p>
            <Link href="/provider/listings">Manage listings →</Link>
          </p>
        </section>
      ) : null}

      <section className="section-block">
        <h2>Quick links</h2>
        <p className="nav-links">
          {isProvider ? (
            <>
              <Link href="/provider/bookings">Incoming bookings</Link>
              <Link href="/provider/listings">My listings</Link>
            </>
          ) : (
            <>
              <Link href="/listings">Browse services</Link>
              <Link href="/bookings">My bookings</Link>
            </>
          )}
          <Link href="/profile">My profile</Link>
        </p>
      </section>
    </main>
  );
}
