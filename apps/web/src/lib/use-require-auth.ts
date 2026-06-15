"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken, getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

/** Redirects to login when not authenticated. */
export function useRequireAuth() {
  const router = useRouter();
  const { me, loading } = useMe();

  useEffect(() => {
    if (!loading && !me) {
      router.replace("/login");
    }
  }, [loading, me, router]);

  return { me, loading, ready: !loading && !!me };
}
