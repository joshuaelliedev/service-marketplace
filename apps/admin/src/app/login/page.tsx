"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { setToken } from "@/lib/auth-storage";
import { useMe } from "@/lib/use-me";

export default function AdminLoginPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useMe();
  const [email, setEmail] = useState("admin@local.dev");
  const [password, setPassword] = useState("ChangeMeAdmin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && me?.role === "admin") {
      router.replace("/");
    }
  }, [authLoading, me, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiJson<{ accessToken: string; user: { role: string } }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      if (res.user.role !== "admin") {
        setError("This account is not an admin. Use the main web app to sign in.");
        return;
      }
      setToken(res.accessToken);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="auth-main">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="auth-main">
      <h1>Admin sign in</h1>
      <p className="text-muted">Operations portal for marketplace administrators.</p>

      <div className="auth-panel">
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
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
      </div>

      <p className="auth-hint">
        Local dev seed: <code>admin@local.dev</code> / <code>ChangeMeAdmin123!</code>
      </p>
    </main>
  );
}
