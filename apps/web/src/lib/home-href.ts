import type { Me } from "@/lib/auth-types";

/** Where the header brand link should go for the current user. */
export function homeHrefFor(me: Me | null): string {
  if (!me) return "/";
  if (me.role === "provider") return "/dashboard";
  if (me.role === "customer") return "/listings";
  return "/";
}
