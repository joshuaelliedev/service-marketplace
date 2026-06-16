"use client";

import { useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { downloadBookingReceipt } from "@/lib/download-receipt";

type Panel = "rate" | "refund" | null;

type BookingExtrasProps = {
  bookingId: string;
  referenceNumber?: string;
  status: string;
};

export function BookingExtras({ bookingId, referenceNumber, status }: BookingExtrasProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (status !== "completed") return null;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="booking-completed">
      <div className="booking-completed__toolbar">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy === "receipt"}
          onClick={() =>
            void run("receipt", async () => {
              await downloadBookingReceipt(bookingId, referenceNumber ?? bookingId);
              setMsg("Receipt downloaded.");
            })
          }
        >
          {busy === "receipt" ? "Downloading…" : "Receipt"}
        </button>
        <button
          type="button"
          className={panel === "rate" ? "btn" : "btn-secondary"}
          onClick={() => setPanel((p) => (p === "rate" ? null : "rate"))}
        >
          Rate
        </button>
        <button
          type="button"
          className={panel === "refund" ? "btn" : "btn-secondary"}
          onClick={() => setPanel((p) => (p === "refund" ? null : "refund"))}
        >
          Refund
        </button>
      </div>

      {panel === "rate" ? (
        <form
          className="form booking-completed__panel"
          onSubmit={(e) => {
            e.preventDefault();
            const token = getToken();
            if (!token) return;
            void run("rate", async () => {
              await apiJson(`/ratings/bookings/${bookingId}`, {
                method: "POST",
                token,
                body: JSON.stringify({ stars, comment: comment || undefined }),
              });
              setMsg("Rating submitted.");
              setPanel(null);
            });
          }}
        >
          <label className="field">
            <span>Stars</span>
            <select value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Comment (optional)</span>
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          </label>
          <button type="submit" disabled={busy === "rate"}>
            {busy === "rate" ? "Submitting…" : "Submit rating"}
          </button>
        </form>
      ) : null}

      {panel === "refund" ? (
        <form
          className="form booking-completed__panel"
          onSubmit={(e) => {
            e.preventDefault();
            const token = getToken();
            if (!token) return;
            void run("refund", async () => {
              await apiJson(`/refunds/bookings/${bookingId}`, {
                method: "POST",
                token,
                body: JSON.stringify({ reason: refundReason || undefined }),
              });
              setMsg("Refund request submitted for admin review.");
              setPanel(null);
            });
          }}
        >
          <label className="field">
            <span>Reason (optional)</span>
            <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </label>
          <button type="submit" className="btn-secondary" disabled={busy === "refund"}>
            {busy === "refund" ? "Submitting…" : "Request full refund"}
          </button>
        </form>
      ) : null}

      {msg ? <p className="booking-completed__msg text-muted">{msg}</p> : null}
    </div>
  );
}
