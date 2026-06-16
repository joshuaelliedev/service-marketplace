"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SideNav, type SideNavSection } from "@/components/side-nav";
import { clearToken } from "@/lib/auth-storage";
import { useAdminPending } from "@/lib/use-admin-pending";
import { useMe } from "@/lib/use-me";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const isAdmin = me?.role === "admin";
  const { counts } = useAdminPending(isAdmin);
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = useMemo<SideNavSection[]>(() => {
    if (!isAdmin) return [];
    return [
      {
        title: "Overview",
        items: [{ href: "/", label: "Dashboard" }],
      },
      {
        title: "Queue",
        items: [
          { href: "/kyc", label: "KYC review", badge: counts.kyc },
          { href: "/wallet-requests", label: "Wallet requests", badge: counts.wallet },
          { href: "/refunds", label: "Refunds", badge: counts.refunds },
          { href: "/support", label: "Support", badge: counts.support },
        ],
      },
      {
        title: "Settings",
        items: [
          { href: "/platform-fees", label: "Platform fees" },
          { href: "/advisories", label: "Advisories" },
          { href: "/feedback", label: "Feedback" },
        ],
      },
    ];
  }, [isAdmin, counts]);

  function logout() {
    clearToken();
    window.location.href = "/login";
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__start">
            {!loading && isAdmin ? (
              <button
                type="button"
                className="app-header__menu-btn"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <span className="app-header__menu-icon" aria-hidden />
              </button>
            ) : null}
            <Link href="/" className="app-header__brand">
              Admin portal
            </Link>
          </div>
          <div className="app-header__nav">
            {!loading && !me ? <Link href="/login">Log in</Link> : null}
            {!loading && me ? (
              <span className="app-header__user" title={me.email}>
                {me.email}
              </span>
            ) : null}
            {!loading && me ? (
              <button type="button" className="app-header__logout" onClick={logout}>
                Log out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {isAdmin ? (
        <SideNav
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          sections={sections}
          footer={
            me ? (
              <p className="sidenav__user" title={me.email}>
                {me.email}
              </p>
            ) : null
          }
        />
      ) : null}

      {children}
    </>
  );
}
