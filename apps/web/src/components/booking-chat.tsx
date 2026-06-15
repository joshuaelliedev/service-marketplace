"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

type Message = {
  _id: string;
  senderId: string | { _id?: string };
  body: string;
  createdAt: string;
};

type BookingChatProps = {
  bookingId: string;
  onRead?: () => void;
};

export function BookingChat({ bookingId, onRead }: BookingChatProps) {
  const { me } = useMe();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Message[]>(`/bookings/${bookingId}/messages`, { token });
    setMessages(data);
    await apiJson(`/bookings/${bookingId}/messages/read`, { method: "POST", token });
    onRead?.();
  }, [bookingId, onRead]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      }
    })();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      await apiJson(`/bookings/${bookingId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body: text }),
      });
      setDraft("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel__toolbar">
        <span className="text-muted">Messages are not live — refresh to check for new replies.</span>
        <button type="button" className="btn-secondary" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="chat-thread" role="log" aria-live="polite">
        {!messages ? <p className="text-muted">Loading messages…</p> : null}
        {messages?.length === 0 ? (
          <p className="text-muted">No messages yet. Say hello to coordinate the service.</p>
        ) : null}
        {messages?.map((m) => {
          const senderId =
            typeof m.senderId === "string" ? m.senderId : String(m.senderId);
          const mine = me?.id === senderId;
          return (
            <div
              key={m._id}
              className={`chat-bubble${mine ? " chat-bubble--mine" : " chat-bubble--theirs"}`}
            >
              <p className="chat-bubble__body">{m.body}</p>
              <time className="chat-bubble__time" dateTime={m.createdAt}>
                {new Date(m.createdAt).toLocaleString("en-PH", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="text-error">{error}</p> : null}

      <form onSubmit={send} className="chat-compose">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          maxLength={2000}
          required
        />
        <button type="submit" disabled={sending || !draft.trim()}>
          {sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
