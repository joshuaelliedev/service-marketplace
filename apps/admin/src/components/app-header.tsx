"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "@/lib/auth-storage";
import { useAdminPending } from "@/lib/use-admin-pending";
import { useMe } from "@/lib/use-me";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="nav-badge" aria-label={`${count} pending`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({
  href,
  children,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={active ? "nav-link-with-badge nav-link--active" : "nav-link-with-badge"}
      aria-current={active ? "page" : undefined}
    >
      {children}
      {badge !== undefined ? <NavBadge count={badge} /> : null}
    </Link>
  );
}

export function AppHeader() {
  const { me, loading } = useMe();
  const isAdmin = me?.role === "admin";
  const { counts } = useAdminPending(isAdmin);

  function logout() {
    clearToken();
    window.location.href = "/login";
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="app-header__brand">
          Admin portal
        </Link>
        <nav className="app-header__nav">
          {!loading && isAdmin ? (
            <>
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/kyc" badge={counts.kyc}>
                KYC review
              </NavLink>
              <NavLink href="/wallet-requests" badge={counts.wallet}>
                Wallet requests
              </NavLink>
            </>
          ) : null}
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
        </nav>
      </div>
    </header>
  );
}
