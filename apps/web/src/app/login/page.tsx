"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { setToken } from "@/lib/auth-storage";
import { homeHrefFor } from "@/lib/home-href";
import { useMe } from "@/lib/use-me";

export default function LoginPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && me) {
      router.replace(homeHrefFor(me));
    }
  }, [authLoading, me, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiJson<{
        accessToken: string;
        user: { role: "customer" | "provider" };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      router.push(
        res.user.role === "provider" ? "/dashboard" : "/listings",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || me) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Log in</h1>
      <p>
        No account? <Link href="/signup">Sign up</Link>
      </p>
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
