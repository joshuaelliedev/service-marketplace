"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

type Ticket = {
  _id: string;
  subject: string;
  status: string;
  updatedAt: string;
};

type Message = {
  _id: string;
  body: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function SupportPage() {
  const { me, loading } = useMe();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refreshTickets = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Ticket[]>("/support/tickets/mine", { token });
    setTickets(data);
  }, []);

  useEffect(() => {
    if (loading || !me) return;
    void (async () => {
      try {
        await refreshTickets();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [loading, me, refreshTickets]);

  useEffect(() => {
    if (!selectedId) return;
    const token = getToken();
    if (!token) return;
    const interval = window.setInterval(() => {
      void apiJson<Message[]>(`/support/tickets/${selectedId}/messages`, { token })
        .then(setMessages)
        .catch(() => {});
    }, 5000);
    void apiJson<Message[]>(`/support/tickets/${selectedId}/messages`, { token })
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load messages"));
    return () => window.clearInterval(interval);
  }, [selectedId]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setBusy("create");
    setError(null);
    try {
      const ticket = await apiJson<Ticket>("/support/tickets", {
        method: "POST",
        token,
        body: JSON.stringify({ subject, body, imageUrl: imageUrl || undefined }),
      });
      setSubject("");
      setBody("");
      setImageUrl("");
      await refreshTickets();
      setSelectedId(ticket._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const token = getToken();
    if (!token) return;
    setBusy("reply");
    try {
      await apiJson(`/support/tickets/${selectedId}/messages`, {
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
        <h1>Support</h1>
        <p>
          <Link href="/login">Log in</Link> to contact support.
        </p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <h1>Support</h1>
      <p className="text-muted">Open a ticket for help with bookings, payments, or your account.</p>
      {error ? <p className="text-error">{error}</p> : null}

      <section className="detail-panel section-block">
        <h2>New ticket</h2>
        <form onSubmit={createTicket} className="form">
          <label className="field">
            <span>Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          </label>
          <label className="field">
            <span>Image URL (optional)</span>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <button type="submit" disabled={busy === "create"}>
            {busy === "create" ? "Submitting…" : "Open ticket"}
          </button>
        </form>
      </section>

      <div className="detail-layout">
        <section>
          <h2>My tickets</h2>
          {!tickets ? (
            <p>Loading…</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted">No tickets yet.</p>
          ) : (
            <ul className="category-list">
              {tickets.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    className={selectedId === t._id ? "btn" : "btn-secondary"}
                    onClick={() => setSelectedId(t._id)}
                  >
                    {t.subject} ({t.status})
                  </button>
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
                    <strong>{m.isAdmin ? "Support" : "You"}</strong>
                  </p>
                  <p>{m.body}</p>
                  {m.imageUrl ? (
                    <p>
                      <a href={m.imageUrl} target="_blank" rel="noreferrer">
                        Image
                      </a>
                    </p>
                  ) : null}
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
              <button type="submit" disabled={busy === "reply"}>
                {busy === "reply" ? "Sending…" : "Send reply"}
              </button>
            </form>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
