"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth-storage";
import { WalletPanel } from "@/components/wallet-panel";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function ProfilePage() {
  const router = useRouter();
  const { me, ready } = useRequireAuth();

  function logout() {
    clearToken();
    router.push("/login");
    router.refresh();
  }

  if (!ready || !me) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">My profile</p>
      <h1>My profile</h1>

      <section className="detail-panel section-block">
        <h2>Account</h2>
        <dl className="profile-dl">
          <div>
            <dt>Email</dt>
            <dd>{me.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className="profile-dl__capitalize">{me.role}</dd>
          </div>
          {me.fullName ? (
            <div>
              <dt>Name</dt>
              <dd>{me.fullName}</dd>
            </div>
          ) : null}
          {me.role === "provider" && me.kycStatus ? (
            <div>
              <dt>KYC status</dt>
              <dd className="profile-dl__capitalize">{me.kycStatus.replace(/_/g, " ")}</dd>
            </div>
          ) : null}
        </dl>
        {me.role === "provider" ? (
          <p>
            <Link href="/provider/kyc">Manage KYC submission →</Link>
          </p>
        ) : null}
      </section>

      {me.role === "customer" || me.role === "provider" ? (
        <WalletPanel availableCents={me.walletAvailableCents ?? 0} />
      ) : null}

      <div className="form-row">
        <button type="button" className="btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </main>
  );
}
