"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth-storage";

type PendingCounts = {
  kyc: number;
  wallet: number;
  refunds: number;
  support: number;
};

export function useAdminPending(enabled: boolean) {
  const [counts, setCounts] = useState<PendingCounts>({ kyc: 0, wallet: 0, refunds: 0, support: 0 });
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = getToken();
    if (!token) {
      setCounts({ kyc: 0, wallet: 0, refunds: 0, support: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [kyc, wallet, refunds, support] = await Promise.all([
        apiJson<unknown[]>("/admin/kyc/pending", { token }),
        apiJson<unknown[]>("/admin/wallet-requests/pending", { token }),
        apiJson<unknown[]>("/admin/refunds/pending", { token }),
        apiJson<unknown[]>("/admin/support/tickets/open", { token }),
      ]);
      setCounts({
        kyc: kyc.length,
        wallet: wallet.length,
        refunds: refunds.length,
        support: support.length,
      });
    } catch {
      setCounts({ kyc: 0, wallet: 0, refunds: 0, support: 0 });
    } finally {
      setLoading(false);
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

  return { counts, loading, total: counts.kyc + counts.wallet + counts.refunds + counts.support, refresh };
}
