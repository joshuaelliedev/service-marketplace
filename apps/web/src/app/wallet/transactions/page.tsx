"use client";

import Link from "next/link";
import { TransactionHistory } from "@/components/transaction-history";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function WalletTransactionsPage() {
  const { me, ready } = useRequireAuth();

  if (!ready || !me) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (me.role !== "customer" && me.role !== "provider") {
    return (
      <main>
        <h1>Transaction history</h1>
        <p>Wallet transactions are only available for customer and provider accounts.</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/profile#wallet">Wallet</Link> / Transaction history
      </p>
      <h1>Transaction history</h1>
      <p className="text-muted">
        All wallet movements with balance before and after each transaction.
      </p>
      <section className="detail-panel section-block">
        <TransactionHistory embedded />
      </section>
    </main>
  );
}
