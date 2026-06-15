"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth-storage";
import { formatPeso } from "@/lib/format";
import { homeHrefFor } from "@/lib/home-href";
import { useChatUnread } from "@/lib/use-chat-unread";
import { useMe } from "@/lib/use-me";
import { useNotificationUnread } from "@/lib/use-notification-unread";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="nav-badge" aria-label={`${count} unread`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppHeader() {
  const router = useRouter();
  const { me, loading } = useMe();
  const { total: chatUnread } = useChatUnread();
  const { count: notifUnread } = useNotificationUnread();
  const alertCount = chatUnread + notifUnread;

  const brandHref = homeHrefFor(me);
  const bookingsHref = me?.role === "provider" ? "/provider/bookings" : "/bookings";
  const bookingsLabel = me?.role === "provider" ? "Incoming bookings" : "My bookings";

  function logout() {
    clearToken();
    router.push("/");
    router.refresh();
  }

  const showWallet =
    !loading && me && (me.role === "customer" || me.role === "provider");

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href={brandHref} className="app-header__brand">
          Service marketplace
        </Link>
        <nav className="app-header__nav">
          {!loading && me?.role === "customer" ? <Link href="/listings">Browse</Link> : null}
          {!loading && !me ? (
            <>
              <Link href="/listings">Browse</Link>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          ) : null}
          {!loading && me?.role === "customer" ? (
            <>
              <Link href={bookingsHref} className="nav-link-with-badge">
                {bookingsLabel}
                <NavBadge count={alertCount} />
              </Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/profile">My profile</Link>
            </>
          ) : null}
          {!loading && me?.role === "provider" ? (
            <>
              <Link href={bookingsHref} className="nav-link-with-badge">
                {bookingsLabel}
                <NavBadge count={alertCount} />
              </Link>
              <Link href="/provider/listings">My listings</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/profile">My profile</Link>
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
  );
}
