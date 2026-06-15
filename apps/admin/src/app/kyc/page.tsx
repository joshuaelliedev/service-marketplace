"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ReviewActions } from "@/components/review-actions";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type User = {
  _id: string;
  email: string;
  fullName?: string;
  kycStatus: string;
  kycDocumentUrl?: string;
};

export default function AdminKycPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<User[]>("/admin/kyc/pending", { token });
    setItems(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load KYC queue");
      }
    })();
  }, [ready, isAdmin, refresh]);

  async function decide(userId: string, approve: boolean, note?: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(userId);
    setError(null);
    try {
      await apiJson(`/admin/kyc/${userId}/decision`, {
        method: "POST",
        token,
        body: JSON.stringify({
          approve,
          note: note || (approve ? "Approved" : "Rejected"),
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
        <Link href="/">Dashboard</Link> / KYC review
      </p>
      <h1>KYC review</h1>
      <p className="admin-page-lead">Approve or reject provider identity submissions.</p>

      {error ? <p className="text-error">{error}</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No pending KYC"
          description="New provider submissions will appear here for review."
          action={
            <Link href="/" className="btn-secondary">
              Back to dashboard
            </Link>
          }
        />
      ) : (
        <ul className="booking-list">
          {items?.map((u) => (
            <li key={u._id} className="detail-panel list-item review-card">
              <div className="review-card__header">
                <div>
                  <strong>{u.fullName || u.email}</strong>
                  {u.fullName ? (
                    <div className="text-muted" style={{ fontSize: 14 }}>
                      {u.email}
                    </div>
                  ) : null}
                </div>
                <span className="badge badge--pending">{u.kycStatus.replace(/_/g, " ")}</span>
              </div>
              {u.kycDocumentUrl ? (
                <p>
                  <a href={u.kycDocumentUrl} target="_blank" rel="noreferrer">
                    View submitted document →
                  </a>
                </p>
              ) : (
                <p className="text-muted">No document URL on file.</p>
              )}
              <ReviewActions
                busy={busyId === u._id}
                onApprove={() => decide(u._id, true)}
                onReject={(note) => decide(u._id, false, note)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
