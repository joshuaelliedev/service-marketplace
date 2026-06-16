"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SideNav, type SideNavSection } from "@/components/side-nav";
import { clearToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { homeHrefFor } from "@/lib/home-href";
import { useAdvisoryCount } from "@/lib/use-advisory-count";
import { useChatUnread } from "@/lib/use-chat-unread";
import { useMe } from "@/lib/use-me";
import { useNotificationUnread } from "@/lib/use-notification-unread";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { me, loading } = useMe();
  const { total: chatUnread } = useChatUnread();
  const { count: notifUnread } = useNotificationUnread();
  const { count: advisoryCount } = useAdvisoryCount(!!me && me.role !== "admin");
  const [menuOpen, setMenuOpen] = useState(false);

  const alertCount = chatUnread + notifUnread;
  const brandHref = homeHrefFor(me);
  const showWallet = !loading && me && (me.role === "customer" || me.role === "provider");
  const showMenu = !loading && me && (me.role === "customer" || me.role === "provider");

  const sections = useMemo<SideNavSection[]>(() => {
    if (!me) return [];
    if (me.role === "customer") {
      return [
        {
          title: "Discover",
          items: [
            { href: "/listings", label: "Browse services" },
            { href: "/dashboard", label: "Dashboard" },
          ],
        },
        {
          title: "Bookings",
          items: [{ href: "/bookings", label: "My bookings", badge: alertCount }],
        },
        {
          title: "Wallet",
          items: [
            { href: "/profile#wallet", label: "Wallet & cash in/out" },
            { href: "/wallet/transactions", label: "Transaction history" },
          ],
        },
        {
          title: "Help",
          items: [
            { href: "/advisories", label: "Advisories", badge: advisoryCount },
            { href: "/support", label: "Support" },
            { href: "/feedback", label: "Feedback" },
          ],
        },
        {
          title: "Account",
          items: [{ href: "/profile", label: "My profile" }],
        },
      ];
    }
    if (me.role === "provider") {
      return [
        {
          title: "Work",
          items: [
            { href: "/provider/bookings", label: "Incoming bookings", badge: alertCount },
            { href: "/provider/listings", label: "My listings" },
            { href: "/provider/timeline", label: "Timeline" },
            { href: "/dashboard", label: "Dashboard" },
          ],
        },
        {
          title: "Wallet",
          items: [
            { href: "/profile#wallet", label: "Wallet & cash in/out" },
            { href: "/wallet/transactions", label: "Transaction history" },
          ],
        },
        {
          title: "Help",
          items: [
            { href: "/advisories", label: "Advisories", badge: advisoryCount },
            { href: "/support", label: "Support" },
            { href: "/feedback", label: "Feedback" },
            { href: "/provider/kyc", label: "KYC" },
          ],
        },
        {
          title: "Account",
          items: [{ href: "/profile", label: "My profile" }],
        },
      ];
    }
    return [];
  }, [me, alertCount, advisoryCount]);

  function logout() {
    clearToken();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__start">
            {showMenu ? (
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
            <Link href={brandHref} className="app-header__brand">
              Service marketplace
            </Link>
          </div>
          <nav className="app-header__nav">
            {!loading && !me ? (
              <>
                <Link href="/listings">Browse</Link>
                <Link href="/login">Log in</Link>
                <Link href="/signup">Sign up</Link>
              </>
            ) : null}
            {showWallet && me ? (
              <Link href="/profile#wallet" className="app-header__balance" title="Wallet balance">
                {formatPeso(me.walletAvailableCents ?? 0)}
              </Link>
            ) : null}
            {!loading && me ? (
              <button type="button" className="app-header__logout" onClick={logout}>
                Log out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      {showMenu ? (
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
