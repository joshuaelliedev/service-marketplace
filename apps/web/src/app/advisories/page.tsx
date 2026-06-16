"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

type Advisory = {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  startAt: string;
  endAt: string;
};

export default function AdvisoriesPage() {
  const { me, loading } = useMe();
  const [items, setItems] = useState<Advisory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Advisory[]>("/advisories/active", { token });
    setItems(data);
  }, []);

  useEffect(() => {
    if (loading || !me) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [loading, me, refresh]);

  async function dismiss(id: string) {
    const token = getToken();
    if (!token) return;
    setDismissing(id);
    try {
      await apiJson(`/advisories/${id}/dismiss`, { method: "POST", token });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dismiss failed");
    } finally {
      setDismissing(null);
    }
  }

  if (loading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main>
        <h1>Advisories</h1>
        <p>
          <Link href="/login">Log in</Link> to view advisories.
        </p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <h1>Advisories</h1>
      <p className="text-muted">Important announcements from the platform.</p>
      {error ? <p className="text-error">{error}</p> : null}
      {!items ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No active advisories.</p>
      ) : (
        <ul className="booking-list">
          {items.map((a) => (
            <li key={a._id} className="detail-panel">
              <h2>{a.title}</h2>
              <p>{a.body}</p>
              {a.imageUrl ? (
                <p>
                  <a href={a.imageUrl} target="_blank" rel="noreferrer">
                    View image
                  </a>
                </p>
              ) : null}
              <p className="text-muted" style={{ fontSize: 13 }}>
                {new Date(a.startAt).toLocaleDateString()} – {new Date(a.endAt).toLocaleDateString()}
              </p>
              <button
                type="button"
                className="btn-secondary"
                disabled={dismissing === a._id}
                onClick={() => void dismiss(a._id)}
              >
                {dismissing === a._id ? "Dismissing…" : "Dismiss"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
