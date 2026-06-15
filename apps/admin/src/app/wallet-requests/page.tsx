"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ReviewActions } from "@/components/review-actions";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { useRequireAdmin } from "@/lib/use-require-admin";

type PopulatedUser = {
  _id: string;
  email: string;
  fullName?: string;
  role: string;
};

type WalletRequest = {
  _id: string;
  type: "cash_in_direct" | "cash_out_direct";
  amountCents: number;
  userNote?: string;
  status: string;
  createdAt: string;
  userId: PopulatedUser;
};

function typeLabel(type: string): string {
  return type === "cash_in_direct" ? "Cash in" : "Cash out";
}

function typeBadgeClass(type: string): string {
  return type === "cash_in_direct" ? "badge badge--completed" : "badge badge--waiting";
}

export default function AdminWalletRequestsPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<WalletRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<WalletRequest[]>("/admin/wallet-requests/pending", { token });
    setItems(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load wallet requests");
      }
    })();
  }, [ready, isAdmin, refresh]);

  async function decide(id: string, approve: boolean, note?: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await apiJson(`/admin/wallet-requests/${id}/decision`, {
        method: "POST",
        token,
        body: JSON.stringify({
          approve,
          note: note || (approve ? "Approved" : undefined),
        }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Admin access required.</p>
      </main>
    );
  }

  if (!items && !error) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/">Dashboard</Link> / Wallet requests
      </p>
      <h1>Wallet requests</h1>
      <p className="admin-page-lead">
        Approve direct cash in (credit wallet) or cash out (debit wallet).
      </p>

      {error ? <p className="text-error">{error}</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No pending wallet requests"
          description="Customer and provider cash in/out requests will appear here."
          action={
            <Link href="/" className="btn-secondary">
              Back to dashboard
            </Link>
          }
        />
      ) : (
        <ul className="booking-list">
          {items?.map((r) => (
            <li key={r._id} className="detail-panel list-item review-card">
              <div className="review-card__header">
                <div>
                  <span className={typeBadgeClass(r.type)}>{typeLabel(r.type)}</span>
                  <div className="review-card__amount">{formatPeso(r.amountCents)}</div>
                </div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {new Date(r.createdAt).toLocaleString("en-PH")}
                </span>
              </div>
              <div>
                <strong>{r.userId?.fullName || r.userId?.email}</strong>
                {r.userId?.fullName ? (
                  <span className="text-muted"> · {r.userId.email}</span>
                ) : null}
                <span className="text-muted"> · {r.userId?.role}</span>
              </div>
              {r.userNote ? (
                <div className="text-muted" style={{ fontSize: 14 }}>
                  User note: {r.userNote}
                </div>
              ) : null}
              <ReviewActions
                busy={busyId === r._id}
                onApprove={() => decide(r._id, true)}
                onReject={(note) => decide(r._id, false, note)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
