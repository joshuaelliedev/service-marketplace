"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import {
  formatSignedPeso,
  walletTransactionLabel,
  type WalletTransaction,
} from "@/lib/wallet-transactions";

type TransactionHistoryProps = {
  /** Hide heading when shown on the dedicated transactions page. */
  embedded?: boolean;
};

export function TransactionHistory({ embedded = false }: TransactionHistoryProps) {
  const [items, setItems] = useState<WalletTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<WalletTransaction[]>("/wallet/transactions/mine", { token });
    setItems(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load transactions");
      }
    })();
  }, [refresh]);

  return (
    <div className={embedded ? undefined : "transaction-history"}>
      {!embedded ? (
        <>
          <h3>Transaction history</h3>
          <p className="text-muted">
            Every wallet movement with balance before and after.
          </p>
        </>
      ) : null}
      {error ? <p className="text-error">{error}</p> : null}
      {!items ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No transactions yet. Bookings, cash in/out, and refunds will appear here.</p>
      ) : (
        <div className="transaction-table-wrap">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString("en-PH")}</td>
                  <td>{walletTransactionLabel(t.type)}</td>
                  <td className="transaction-table__ref">{t.referenceNumber}</td>
                  <td
                    className={
                      t.amountCents > 0
                        ? "transaction-table__credit"
                        : t.amountCents < 0
                          ? "transaction-table__debit"
                          : undefined
                    }
                  >
                    {formatSignedPeso(t.amountCents)}
                  </td>
                  <td>{formatPeso(t.balanceBeforeCents)}</td>
                  <td>{formatPeso(t.balanceAfterCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
