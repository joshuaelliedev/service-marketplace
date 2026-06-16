"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Fees = {
  companyFeePercent: number;
  vatFeePercent: number;
};

export default function AdminPlatformFeesPage() {
  const { ready, isAdmin } = useRequireAdmin();
  const [fees, setFees] = useState<Fees | null>(null);
  const [companyFeePercent, setCompanyFeePercent] = useState(10);
  const [vatFeePercent, setVatFeePercent] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Fees>("/admin/platform/fees", { token });
    setFees(data);
    setCompanyFeePercent(data.companyFeePercent);
    setVatFeePercent(data.vatFeePercent);
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiJson("/admin/platform/fees", {
        method: "PATCH",
        token,
        body: JSON.stringify({ companyFeePercent, vatFeePercent }),
      });
      setMsg("Platform fees updated.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
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
        <Link href="/">Dashboard</Link> / Platform fees
      </p>
      <h1 className="admin-page-title">Platform fees</h1>
      <p className="admin-page-lead">
        Company and VAT percentages apply to the base listing price. Customers see one combined service
        fee at checkout.
      </p>
      {error ? <p className="text-error">{error}</p> : null}
      {msg ? <p className="text-success">{msg}</p> : null}
      {!fees ? (
        <p>Loading…</p>
      ) : (
        <form onSubmit={save} className="form detail-panel">
          <label className="field">
            <span>Company fee (% of base price)</span>
            <input
              type="number"
              value={companyFeePercent}
              onChange={(e) => setCompanyFeePercent(Number(e.target.value))}
              min={0}
              max={100}
              required
            />
          </label>
          <label className="field">
            <span>VAT fee (% of base price)</span>
            <input
              type="number"
              value={vatFeePercent}
              onChange={(e) => setVatFeePercent(Number(e.target.value))}
              min={0}
              max={100}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save fees"}
          </button>
        </form>
      )}
    </main>
  );
}
