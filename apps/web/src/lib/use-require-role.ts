"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@/lib/auth-types";
import { useMe } from "@/lib/use-me";

export function useRequireRole(role: UserRole) {
  const router = useRouter();
  const { me, loading } = useMe();

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    if (me.role !== role) {
      router.replace("/dashboard");
    }
  }, [loading, me, role, router]);

  return { me, loading, ready: !loading && !!me && me.role === role };
}
