"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Advisory = {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export default function AdminAdvisoriesPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [items, setItems] = useState<Advisory[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Advisory[]>("/admin/advisories", { token });
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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiJson("/admin/advisories", {
        method: "POST",
        token,
        body: JSON.stringify({
          title,
          body,
          imageUrl: imageUrl || undefined,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });
      setTitle("");
      setBody("");
      setImageUrl("");
      setMsg("Advisory created.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
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
        <Link href="/">Dashboard</Link> / Advisories
      </p>
      <h1 className="admin-page-title">Advisories</h1>
      {error ? <p className="text-error">{error}</p> : null}
      {msg ? <p className="text-success">{msg}</p> : null}

      <section className="detail-panel section-block">
        <h2>Create advisory</h2>
        <form onSubmit={create} className="form">
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span>Body</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          </label>
          <label className="field">
            <span>Image URL (optional)</span>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <label className="field">
            <span>Start</span>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </label>
          <label className="field">
            <span>End</span>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Publish advisory"}
          </button>
        </form>
      </section>

      <section className="section-block">
        <h2>All advisories</h2>
        {!items ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted">None yet.</p>
        ) : (
          <ul className="booking-list">
            {items.map((a) => (
              <li key={a._id} className="detail-panel">
                <h3>{a.title}</h3>
                <p>{a.body}</p>
                <p className="text-muted" style={{ fontSize: 13 }}>
                  {new Date(a.startAt).toLocaleString()} – {new Date(a.endAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
