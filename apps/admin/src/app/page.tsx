"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { bookingStatusLabel, pesoToCentavos } from "@/lib/format";
import { useAdminPending } from "@/lib/use-admin-pending";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Stats = {
  usersTotal: number;
  customers: number;
  providers: number;
  admins: number;
  categories: number;
  listings: number;
  publishedListings: number;
  bookingsByStatus: Record<string, number>;
};

type Category = { _id: string; name: string; isActive: boolean };

export default function AdminHomePage() {
  const { me, ready, isAdmin } = useRequireAdmin();
  const { counts, refresh: refreshPending } = useAdminPending(isAdmin);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [catName, setCatName] = useState("");
  const [topupUserId, setTopupUserId] = useState("");
  const [topupPeso, setTopupPeso] = useState("5000");
  const [feeProviderId, setFeeProviderId] = useState("");
  const [feePercent, setFeePercent] = useState(10);
  const [feeFixedPeso, setFeeFixedPeso] = useState("100");
  const [busy, setBusy] = useState<string | null>(null);

  const refreshAdminData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const [s, cats] = await Promise.all([
      apiJson<Stats>("/admin/stats", { token }),
      apiJson<Category[]>("/categories/admin/all", { token }),
    ]);
    setStats(s);
    setCategories(cats);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void (async () => {
      try {
        await refreshAdminData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [ready, isAdmin, refreshAdminData]);

  async function runAction(
    key: string,
    action: () => Promise<void>,
    successMessage: string,
  ) {
    setError(null);
    setSuccess(null);
    setBusy(key);
    try {
      await action();
      setSuccess(successMessage);
      await refreshAdminData();
      await refreshPending();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    const token = getToken();
    if (!token) return;
    await runAction(
      "category",
      async () => {
        await apiJson("/categories/admin", {
          method: "POST",
          token,
          body: JSON.stringify({ name }),
        });
        setCatName("");
      },
      `Category "${name}" added.`,
    );
  }

  async function topup(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const peso = Number(topupPeso);
    if (!Number.isFinite(peso) || peso <= 0) {
      setError("Enter a valid top-up amount in pesos");
      return;
    }
    await runAction(
      "topup",
      async () => {
        await apiJson("/admin/wallets/topup", {
          method: "POST",
          token,
          body: JSON.stringify({
            userId: topupUserId.trim(),
            amountCents: pesoToCentavos(peso),
          }),
        });
        setTopupUserId("");
      },
      "Wallet topped up.",
    );
  }

  async function setFees(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const fixedPeso = Number(feeFixedPeso);
    if (!Number.isFinite(fixedPeso) || fixedPeso < 0) {
      setError("Enter a valid fixed fee in pesos");
      return;
    }
    await runAction(
      "fees",
      async () => {
        await apiJson(`/admin/providers/${feeProviderId.trim()}/fees`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            feePercent,
            feeFixedCents: pesoToCentavos(fixedPeso),
          }),
        });
      },
      "Provider fees updated.",
    );
  }

  if (!ready || !me) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <h1>Admin portal</h1>
        <p>This portal is for admin accounts only.</p>
        <p>
          You are signed in as <strong>{me.email}</strong> ({me.role}).
        </p>
      </main>
    );
  }

  const bookingTotal = stats
    ? Object.values(stats.bookingsByStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <main className="main-wide">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-lead">Overview and operations for the marketplace.</p>

      {error ? <p className="text-error">{error}</p> : null}
      {success ? <p className="text-success">{success}</p> : null}

      <section className="section-block">
        <h2>Needs attention</h2>
        <div className="quick-links">
          <Link href="/kyc" className="quick-link-card">
            <span className="quick-link-card__label">KYC review</span>
            <span className="quick-link-card__meta">
              {counts.kyc === 0
                ? "No pending submissions"
                : `${counts.kyc} pending submission${counts.kyc === 1 ? "" : "s"}`}
            </span>
          </Link>
          <Link href="/wallet-requests" className="quick-link-card">
            <span className="quick-link-card__label">Wallet requests</span>
            <span className="quick-link-card__meta">
              {counts.wallet === 0
                ? "No pending cash in/out"
                : `${counts.wallet} pending request${counts.wallet === 1 ? "" : "s"}`}
            </span>
          </Link>
        </div>
      </section>

      <section className="section-block">
        <h2>Platform stats</h2>
        {!stats ? (
          <p>Loading stats…</p>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-card__label">Users</span>
                <span className="stat-card__value">{stats.usersTotal}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Customers</span>
                <span className="stat-card__value">{stats.customers}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Providers</span>
                <span className="stat-card__value">{stats.providers}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Listings</span>
                <span className="stat-card__value">
                  {stats.publishedListings} / {stats.listings}
                </span>
                <span className="stat-card__sub">published / total</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Bookings</span>
                <span className="stat-card__value">{bookingTotal}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Categories</span>
                <span className="stat-card__value">{stats.categories}</span>
              </div>
            </div>
            {Object.keys(stats.bookingsByStatus).length > 0 ? (
              <div className="detail-panel" style={{ marginTop: "1rem" }}>
                <h3>Bookings by status</h3>
                <ul className="category-list">
                  {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
                    <li key={status} className="category-list__item">
                      <span>{bookingStatusLabel(status)}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="detail-panel section-block">
        <h2>Categories</h2>
        <form onSubmit={createCategory} className="form-row">
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="New category name"
            required
          />
          <button type="submit" disabled={busy === "category"}>
            {busy === "category" ? "Adding…" : "Add category"}
          </button>
        </form>
        {categories.length === 0 ? (
          <p className="text-muted">No categories yet.</p>
        ) : (
          <ul className="category-list">
            {categories.map((c) => (
              <li key={c._id} className="category-list__item">
                <div>
                  <strong>{c.name}</strong>
                  <div className="category-list__id">{c._id}</div>
                </div>
                <span className={c.isActive ? "badge badge--completed" : "badge badge--ended"}>
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-panel section-block">
        <h2>Manual wallet top-up</h2>
        <p className="text-muted">
          Instant credit without a user request. For user-initiated flows, use{" "}
          <Link href="/wallet-requests">wallet requests</Link>.
        </p>
        <form onSubmit={topup} className="form">
          <label className="field">
            <span>User ID</span>
            <input
              value={topupUserId}
              onChange={(e) => setTopupUserId(e.target.value)}
              placeholder="MongoDB user _id"
              required
            />
          </label>
          <label className="field">
            <span>Amount (₱)</span>
            <input
              type="number"
              value={topupPeso}
              onChange={(e) => setTopupPeso(e.target.value)}
              min={0.01}
              step="0.01"
              required
            />
          </label>
          <button type="submit" disabled={busy === "topup"}>
            {busy === "topup" ? "Topping up…" : "Top up wallet"}
          </button>
        </form>
      </section>

      <section className="detail-panel section-block">
        <h2>Provider fees</h2>
        <form onSubmit={setFees} className="form">
          <label className="field">
            <span>Provider user ID</span>
            <input
              value={feeProviderId}
              onChange={(e) => setFeeProviderId(e.target.value)}
              placeholder="MongoDB user _id"
              required
            />
          </label>
          <label className="field">
            <span>Fee percent (of base price)</span>
            <input
              type="number"
              value={feePercent}
              onChange={(e) => setFeePercent(Number(e.target.value))}
              min={0}
              max={100}
              required
            />
          </label>
          <label className="field">
            <span>Fixed fee (₱)</span>
            <input
              type="number"
              value={feeFixedPeso}
              onChange={(e) => setFeeFixedPeso(e.target.value)}
              min={0}
              step="0.01"
              required
            />
          </label>
          <button type="submit" disabled={busy === "fees"}>
            {busy === "fees" ? "Saving…" : "Save fees"}
          </button>
        </form>
      </section>
    </main>
  );
}
