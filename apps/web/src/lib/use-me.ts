"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, WALLET_CHANGE_EVENT, clearToken, getToken } from "@/lib/auth-storage";
import type { Me } from "@/lib/auth-types";

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const user = await apiJson<Me>("/auth/me", { token });
      setMe(user);
    } catch {
      clearToken();
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(AUTH_CHANGE_EVENT, refresh);
    window.addEventListener(WALLET_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh);
      window.removeEventListener(WALLET_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return { me, loading, isLoggedIn: !!me, refresh };
}
