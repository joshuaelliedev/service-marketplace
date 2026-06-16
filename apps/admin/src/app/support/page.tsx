"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Ticket = {
  _id: string;
  subject: string;
  status: string;
  updatedAt: string;
  userId: { _id: string; email: string; fullName?: string; role: string };
};

type Message = {
  _id: string;
  body: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function AdminSupportPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refreshTickets = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Ticket[]>("/admin/support/tickets/open", { token });
    setTickets(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refreshTickets();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [ready, isAdmin, refreshTickets]);

  useEffect(() => {
    if (!selectedId) return;
    const token = getToken();
    if (!token) return;
    const poll = () => {
      void apiJson<Message[]>(`/support/tickets/${selectedId}/messages`, { token })
        .then(setMessages)
        .catch(() => {});
    };
    poll();
    const interval = window.setInterval(poll, 5000);
    return () => window.clearInterval(interval);
  }, [selectedId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const token = getToken();
    if (!token) return;
    setBusy("reply");
    try {
      await apiJson(`/admin/support/tickets/${selectedId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body: reply }),
      });
      setReply("");
      const msgs = await apiJson<Message[]>(`/support/tickets/${selectedId}/messages`, { token });
      setMessages(msgs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed");
    } finally {
      setBusy(null);
    }
  }

  async function closeTicket() {
    if (!selectedId) return;
    const token = getToken();
    if (!token) return;
    setBusy("close");
    try {
      await apiJson(`/admin/support/tickets/${selectedId}/close`, { method: "POST", token });
      setSelectedId(null);
      await refreshTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Close failed");
    } finally {
      setBusy(null);
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
        <Link href="/">Dashboard</Link> / Support
      </p>
      <h1 className="admin-page-title">Support inbox</h1>
      {error ? <p className="text-error">{error}</p> : null}

      <div className="detail-layout">
        <section>
          <h2>Open tickets</h2>
          {!tickets ? (
            <p>Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted">No open tickets.</p>
          ) : (
            <ul className="category-list">
              {tickets.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    className={selectedId === t._id ? "btn" : "btn-secondary"}
                    onClick={() => setSelectedId(t._id)}
                  >
                    {t.subject}
                  </button>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    {t.userId.email} ({t.userId.role})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedId ? (
          <aside className="detail-panel">
            <h2>Conversation</h2>
            <ul className="booking-list">
              {messages.map((m) => (
                <li key={m._id}>
                  <p>
                    <strong>{m.isAdmin ? "Admin" : "User"}</strong>
                  </p>
                  <p>{m.body}</p>
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <form onSubmit={sendReply} className="form">
              <label className="field">
                <span>Reply</span>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} required />
              </label>
              <div className="form-row">
                <button type="submit" disabled={busy === "reply"}>
                  {busy === "reply" ? "Sending…" : "Send reply"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy === "close"}
                  onClick={() => void closeTicket()}
                >
                  {busy === "close" ? "Closing…" : "Close ticket"}
                </button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
