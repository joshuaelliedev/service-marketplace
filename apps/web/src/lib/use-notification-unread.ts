"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

export function useNotificationUnread() {
  const { me } = useMe();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const data = await apiJson<{ count: number }>("/notifications/unread-count", { token });
      setCount(data.count);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (!me) {
      setCount(0);
      return;
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    window.addEventListener(AUTH_CHANGE_EVENT, refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh);
    };
  }, [me, refresh]);

  return { count, refresh };
}
