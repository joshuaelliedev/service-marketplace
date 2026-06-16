"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type FeedbackItem = {
  _id: string;
  body: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  userId: { _id: string; email: string; fullName?: string; role: string };
};

const STATUSES = ["new", "reviewed", "resolved"] as const;

export default function AdminFeedbackPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<FeedbackItem[]>("/admin/feedback", { token });
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

  async function setStatus(id: string, status: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    try {
      await apiJson(`/admin/feedback/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
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
        <Link href="/">Dashboard</Link> / Feedback
      </p>
      <h1 className="admin-page-title">App feedback</h1>
      {error ? <p className="text-error">{error}</p> : null}
      {!items ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No feedback yet.</p>
      ) : (
        <ul className="booking-list">
          {items.map((f) => (
            <li key={f._id} className="detail-panel">
              <p>{f.body}</p>
              <p className="text-muted" style={{ fontSize: 13 }}>
                {f.userId.email} ({f.userId.role}) · {new Date(f.createdAt).toLocaleString()}
              </p>
              <p>
                Status: <strong>{f.status}</strong>
              </p>
              <div className="form-row">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={f.status === s ? "btn" : "btn-secondary"}
                    disabled={busyId === f._id}
                    onClick={() => void setStatus(f._id, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
