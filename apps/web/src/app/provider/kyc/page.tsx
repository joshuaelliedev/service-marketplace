"use client";

import Link from "next/link";
import { useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireRole } from "@/lib/use-require-role";

export default function ProviderKycPage() {
  const { ready } = useRequireRole("provider");
  const [documentUrl, setDocumentUrl] = useState("https://example.com/my-id-document.pdf");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const token = getToken();
    if (!token) return;
    try {
      await apiJson("/provider/kyc", {
        method: "POST",
        token,
        body: JSON.stringify({ documentUrl }),
      });
      setMsg("Submitted for admin review.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Provider KYC</h1>
      <p>
        <Link href="/dashboard">Dashboard</Link>
      </p>
      <p>
        This MVP stores a URL string only (replace with real uploads later). After submission, an
        admin must approve you before you can publish listings.
      </p>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Document URL</span>
          <input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} required />
        </label>
        <button type="submit">Submit</button>
      </form>
      {msg ? <p>{msg}</p> : null}
    </main>
  );
}
