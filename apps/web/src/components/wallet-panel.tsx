"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken, notifyWalletChange } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type WalletRequestType = "cash_in_direct" | "cash_out_direct";

export type WalletRequest = {
  _id: string;
  type: WalletRequestType;
  amountCents: number;
  userNote?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
};

function typeLabel(type: WalletRequestType): string {
  return type === "cash_in_direct" ? "Cash in (direct)" : "Cash out (direct)";
}

export function WalletPanel({ availableCents }: { availableCents: number }) {
  const [requests, setRequests] = useState<WalletRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<WalletRequestType | null>(null);
  const [cashInAmount, setCashInAmount] = useState("");
  const [cashInNote, setCashInNote] = useState("");
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutNote, setCashOutNote] = useState("");

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<WalletRequest[]>("/wallet/requests/mine", { token });
    setRequests(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load wallet requests");
      }
    })();
  }, [refresh]);

  async function submit(type: WalletRequestType, pesoStr: string, userNote: string) {
    setError(null);
    const token = getToken();
    if (!token) return;

    const peso = Number(pesoStr);
    if (!Number.isFinite(peso) || peso <= 0) {
      setError("Enter a valid amount in pesos");
      return;
    }
    const amountCents = Math.round(peso * 100);
    if (type === "cash_out_direct" && amountCents > availableCents) {
      setError("Amount exceeds available balance");
      return;
    }

    setBusy(type);
    try {
      await apiJson("/wallet/requests", {
        method: "POST",
        token,
        body: JSON.stringify({
          type,
          amountCents,
          userNote: userNote.trim() || undefined,
        }),
      });
      if (type === "cash_in_direct") {
        setCashInAmount("");
        setCashInNote("");
      } else {
        setCashOutAmount("");
        setCashOutNote("");
      }
      await refresh();
      notifyWalletChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  const pendingCashIn = requests?.some(
    (r) => r.type === "cash_in_direct" && r.status === "pending",
  );
  const pendingCashOut = requests?.some(
    (r) => r.type === "cash_out_direct" && r.status === "pending",
  );

  return (
    <section className="detail-panel section-block" id="wallet">
      <h2>Wallet</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Available</span>
          <span className="stat-card__value">{formatPeso(availableCents)}</span>
        </div>
      </div>

      <p className="text-muted" style={{ marginTop: "1rem" }}>
        Request a direct cash in or cash out. An admin must approve before your balance
        changes.
      </p>

      {error ? <p className="text-error">{error}</p> : null}

      <div className="wallet-forms">
        <form
          className="form detail-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void submit("cash_in_direct", cashInAmount, cashInNote);
          }}
        >
          <h3>Cash in request</h3>
          <label className="field">
            <span>Amount (₱)</span>
            <input
              type="number"
              min={1}
              step="0.01"
              value={cashInAmount}
              onChange={(e) => setCashInAmount(e.target.value)}
              placeholder="e.g. 500"
              disabled={busy !== null || pendingCashIn}
              required
            />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input
              value={cashInNote}
              onChange={(e) => setCashInNote(e.target.value)}
              placeholder="Payment reference, etc."
              disabled={busy !== null || pendingCashIn}
              maxLength={500}
            />
          </label>
          <button type="submit" disabled={busy !== null || pendingCashIn}>
            {pendingCashIn ? "Pending approval" : busy === "cash_in_direct" ? "Submitting…" : "Request cash in"}
          </button>
        </form>

        <form
          className="form detail-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void submit("cash_out_direct", cashOutAmount, cashOutNote);
          }}
        >
          <h3>Cash out request</h3>
          <label className="field">
            <span>Amount (₱)</span>
            <input
              type="number"
              min={1}
              step="0.01"
              value={cashOutAmount}
              onChange={(e) => setCashOutAmount(e.target.value)}
              placeholder="e.g. 500"
              disabled={busy !== null || pendingCashOut}
              required
            />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input
              value={cashOutNote}
              onChange={(e) => setCashOutNote(e.target.value)}
              placeholder="Bank details, etc."
              disabled={busy !== null || pendingCashOut}
              maxLength={500}
            />
          </label>
          <button type="submit" disabled={busy !== null || pendingCashOut}>
            {pendingCashOut ? "Pending approval" : busy === "cash_out_direct" ? "Submitting…" : "Request cash out"}
          </button>
        </form>
      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Request history</h3>
      {!requests ? (
        <p>Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-muted">No wallet requests yet.</p>
      ) : (
        <ul className="booking-list">
          {requests.map((r) => (
            <li key={r._id} className="detail-panel list-item">
              <div className="list-item__row">
                <strong>{typeLabel(r.type)}</strong>
                <StatusBadge label={r.status} status={r.status} />
              </div>
              <div>{formatPeso(r.amountCents)}</div>
              {r.userNote ? <div className="text-muted">{r.userNote}</div> : null}
              {r.adminNote ? (
                <div className="text-muted">Admin: {r.adminNote}</div>
              ) : null}
              <div className="text-muted" style={{ fontSize: 13 }}>
                {new Date(r.createdAt).toLocaleString("en-PH")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
