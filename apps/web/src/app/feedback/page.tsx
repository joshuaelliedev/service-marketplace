"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

type FeedbackItem = {
  _id: string;
  body: string;
  status: string;
  adminNote?: string;
  createdAt: string;
};

export default function FeedbackPage() {
  const { me, loading } = useMe();
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<FeedbackItem[]>("/feedback/mine", { token });
    setItems(data);
  }

  useEffect(() => {
    if (loading || !me) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [loading, me]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiJson("/feedback", {
        method: "POST",
        token,
        body: JSON.stringify({ body }),
      });
      setBody("");
      setMsg("Thank you — your feedback was submitted.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
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
        <h1>App feedback</h1>
        <p>
          <Link href="/login">Log in</Link> to send feedback.
        </p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <h1>App feedback</h1>
      <p className="text-muted">Share ideas or report issues with the app.</p>
      {error ? <p className="text-error">{error}</p> : null}
      {msg ? <p className="text-success">{msg}</p> : null}

      <section className="detail-panel section-block">
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Your feedback</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} required minLength={5} />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit feedback"}
          </button>
        </form>
      </section>

      <section className="section-block">
        <h2>Previous submissions</h2>
        {!items ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted">None yet.</p>
        ) : (
          <ul className="booking-list">
            {items.map((f) => (
              <li key={f._id} className="detail-panel">
                <p>{f.body}</p>
                <p className="text-muted" style={{ fontSize: 13 }}>
                  Status: {f.status} · {new Date(f.createdAt).toLocaleDateString()}
                </p>
                {f.adminNote ? <p className="text-muted">Admin note: {f.adminNote}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
