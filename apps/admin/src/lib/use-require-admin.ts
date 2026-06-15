"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

/** Redirects to login when unauthenticated; shows non-admin state when wrong role. */
export function useRequireAdmin() {
  const router = useRouter();
  const { me, loading, refresh } = useMe();

  useEffect(() => {
    if (!loading && !me) {
      router.replace("/login");
    }
  }, [loading, me, router]);

  function logout() {
    clearToken();
    router.push("/login");
    router.refresh();
  }

  return {
    me,
    loading,
    ready: !loading && !!me,
    isAdmin: me?.role === "admin",
    refresh,
    logout,
  };
}
