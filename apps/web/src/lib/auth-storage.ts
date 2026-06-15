const KEY = "service_marketplace_token_v1";

export const AUTH_CHANGE_EVENT = "service-marketplace-auth-change";
export const WALLET_CHANGE_EVENT = "service-marketplace-wallet-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function notifyWalletChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WALLET_CHANGE_EVENT));
    notifyAuthChange();
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(KEY, token);
  notifyAuthChange();
}

export function clearToken() {
  window.localStorage.removeItem(KEY);
  notifyAuthChange();
}
