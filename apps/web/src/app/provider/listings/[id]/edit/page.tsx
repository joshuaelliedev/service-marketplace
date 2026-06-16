"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireRole } from "@/lib/use-require-role";

type Listing = {
  _id: string;
  title: string;
  description?: string;
  basePriceCents: number;
  isPublished: boolean;
  categoryId: string | { _id: string };
};

type Category = { _id: string; name: string };

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const { ready } = useRequireRole("provider");
  const id = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePriceCents, setBasePriceCents] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const [data, cats] = await Promise.all([
          apiJson<Listing>(`/listings/${id}`, { token }),
          apiJson<Category[]>("/categories"),
        ]);
        setListing(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCategoryId(typeof data.categoryId === "string" ? data.categoryId : data.categoryId._id);
        setBasePriceCents(data.basePriceCents);
        setIsPublished(data.isPublished);
        setCategories(cats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [ready, id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    const token = getToken();
    if (!token) return;
    try {
      await apiJson(`/listings/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          title,
          description,
          categoryId,
          basePriceCents,
          isPublished,
        }),
      });
      setMsg("Listing updated. Price changes apply to new bookings only.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
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
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/provider/listings">My listings</Link> / Edit
      </p>
      <h1>Edit listing</h1>
      {error ? <p className="text-error">{error}</p> : null}
      {msg ? <p className="text-success">{msg}</p> : null}
      {!listing ? (
        <p>Loading listing…</p>
      ) : (
        <form onSubmit={save} className="form detail-panel">
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Base price (centavos)</span>
            <input
              type="number"
              value={basePriceCents}
              onChange={(e) => setBasePriceCents(Number(e.target.value))}
              min={1}
              required
            />
          </label>
          <label className="form-row">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span>Published</span>
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </main>
  );
}
