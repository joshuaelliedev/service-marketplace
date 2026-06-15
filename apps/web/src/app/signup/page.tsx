"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { setToken } from "@/lib/auth-storage";
import { homeHrefFor } from "@/lib/home-href";
import { useMe } from "@/lib/use-me";

export default function SignupPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useMe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
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
      const res = await apiJson<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, role }),
      });
      setToken(res.accessToken);
      router.push(role === "provider" ? "/dashboard" : "/listings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
      <h1>Create account</h1>
      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span>Full name (optional)</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
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
          <span>Password (min 8)</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span>Account type</span>
          <select value={role} onChange={(e) => setRole(e.target.value as "customer" | "provider")}>
            <option value="customer">Customer (book services)</option>
            <option value="provider">Service provider</option>
          </select>
        </label>
        {error ? <p className="text-error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
