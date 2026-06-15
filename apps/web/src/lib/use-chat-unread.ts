"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

export type ChatUnreadSummary = {
  total: number;
  byBookingId: Record<string, number>;
};

const EMPTY: ChatUnreadSummary = { total: 0, byBookingId: {} };

export function useChatUnread() {
  const { me } = useMe();
  const [summary, setSummary] = useState<ChatUnreadSummary>(EMPTY);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSummary(EMPTY);
      return;
    }
    try {
      const data = await apiJson<ChatUnreadSummary>("/bookings/chat/unread-summary", {
        token,
      });
      setSummary(data);
    } catch {
      setSummary(EMPTY);
    }
  }, []);

  useEffect(() => {
    if (!me) {
      setSummary(EMPTY);
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

  return { ...summary, refresh };
}
