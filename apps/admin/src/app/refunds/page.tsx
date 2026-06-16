"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReviewActions } from "@/components/review-actions";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { useRequireAdmin } from "@/lib/use-require-admin";

type PopulatedUser = { _id: string; email: string; fullName?: string };

type RefundRequest = {
  _id: string;
  amountCents: number;
  reason?: string;
  status: string;
  createdAt: string;
  bookingId: { _id: string; referenceNumber?: string } | string;
  customerId: PopulatedUser;
  providerId: PopulatedUser;
};

export default function AdminRefundsPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<RefundRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<RefundRequest[]>("/admin/refunds/pending", { token });
    setItems(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [ready, isAdmin, refresh]);

  async function decide(id: string, approve: boolean) {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiJson(`/admin/refunds/${id}/decision`, {
        method: "POST",
        token,
        body: JSON.stringify({ approve }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready || !isAdmin) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/">Dashboard</Link> / Refunds
      </p>
      <h1 className="admin-page-title">Refund requests</h1>
      {error ? <p className="text-error">{error}</p> : null}
      {!items ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No pending refund requests.</p>
      ) : (
        <ul className="booking-list">
          {items.map((r) => {
            const ref =
              typeof r.bookingId === "object" ? r.bookingId.referenceNumber : undefined;
            return (
              <li key={r._id} className="detail-panel">
                <p>
                  <strong>{formatPeso(r.amountCents)}</strong>
                  {ref ? ` · ${ref}` : ""}
                </p>
                <p>
                  Customer: {r.customerId.fullName ?? r.customerId.email}
                  <br />
                  Provider: {r.providerId.fullName ?? r.providerId.email}
                </p>
                {r.reason ? <p className="text-muted">Reason: {r.reason}</p> : null}
                <ReviewActions
                  busy={busyId === r._id}
                  onApprove={() => void decide(r._id, true)}
                  onReject={() => void decide(r._id, false)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
