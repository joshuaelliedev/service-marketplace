"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth-storage";

export function useAdvisoryCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const token = getToken();
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const items = await apiJson<unknown[]>("/advisories/active", { token });
      setCount(items.length);
    } catch {
      setCount(0);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    window.addEventListener(AUTH_CHANGE_EVENT, refresh);
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { count, refresh };
}
