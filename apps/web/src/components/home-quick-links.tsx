"use client";

import Link from "next/link";
import { homeHrefFor } from "@/lib/home-href";
import { useMe } from "@/lib/use-me";

export function HomeQuickLinks() {
  const { me, loading } = useMe();

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (!me) {
    return (
      <p className="nav-links">
        <Link href="/listings">Browse listings</Link>
        <Link href="/signup">Sign up</Link>
        <Link href="/login">Log in</Link>
      </p>
    );
  }

  if (me.role === "customer") {
    return (
      <p className="nav-links">
        <Link href="/listings">Browse listings</Link>
        <Link href="/bookings">My bookings</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">My profile</Link>
      </p>
    );
  }

  return (
    <p className="nav-links">
      <Link href={homeHrefFor(me)}>Dashboard</Link>
      <Link href="/provider/bookings">Incoming bookings</Link>
      <Link href="/provider/listings">My listings</Link>
      <Link href="/profile">My profile</Link>
    </p>
  );
}
