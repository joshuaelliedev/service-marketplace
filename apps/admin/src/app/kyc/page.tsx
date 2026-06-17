"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import {
  itemUserId,
  KycReviewCard,
  type KycPendingItem,
} from "@/components/kyc-review-card";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

function normalizePending(raw: unknown): KycPendingItem {
  const u = raw as Record<string, unknown>;
  return {
    _id: u._id != null ? String(u._id) : undefined,
    id: u.id != null ? String(u.id) : undefined,
    email: String(u.email ?? ""),
    fullName: typeof u.fullName === "string" ? u.fullName : undefined,
    kycStatus: String(u.kycStatus ?? "pending"),
    kycAdminNote: typeof u.kycAdminNote === "string" ? u.kycAdminNote : undefined,
    kycDocumentUrl:
      typeof u.kycDocumentUrl === "string" && u.kycDocumentUrl.trim()
        ? u.kycDocumentUrl.trim()
        : null,
    profile: (u.profile as KycPendingItem["profile"]) ?? null,
  };
}

export default function AdminKycPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<KycPendingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const data = await apiJson<unknown[]>("/admin/kyc/pending", { token: t });
    setItems(data.map(normalizePending));
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
    const t = getToken();
    if (!t || !userId) return;
    setBusyId(userId);
    setError(null);
    try {
      await apiJson(`/admin/kyc/${userId}/decision`, {
        method: "POST",
        token: t,
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
      <p className="admin-page-lead">
        Expand each card to view identity fields and ID photos. Approve only when documents are
        complete.
      </p>

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
          {items?.map((u) => {
            const userId = itemUserId(u);
            return (
              <KycReviewCard
                key={userId || u.email}
                item={u}
                busy={busyId === userId}
                onApprove={() => {
                  if (!u.profile?.submittedAt) {
                    setError(
                      "Cannot approve: provider has not submitted the full KYC form with documents.",
                    );
                    return;
                  }
                  return decide(userId, true);
                }}
                onReject={(note) => decide(userId, false, note)}
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
