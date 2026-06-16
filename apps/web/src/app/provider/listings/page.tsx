"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { normalizeId } from "@/lib/format";
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

export default function ProviderListingsPage() {
  const { ready } = useRequireRole("provider");
  const [items, setItems] = useState<Listing[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("Example: Aircon cleaning");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePriceCents, setBasePriceCents] = useState(100000);
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c._id, c.name])),
    [categories],
  );

  const { published, drafts } = useMemo(() => {
    if (!items) return { published: [], drafts: [] };
    return {
      published: items.filter((l) => l.isPublished),
      drafts: items.filter((l) => !l.isPublished),
    };
  }, [items]);

  async function refresh() {
    const token = getToken();
    if (!token) return;
    const [mine, cats] = await Promise.all([
      apiJson<Listing[]>("/listings/mine", { token }),
      apiJson<Category[]>("/categories"),
    ]);
    setItems(mine);
    setCategories(cats);
    if (!categoryId && cats[0]) setCategoryId(cats[0]._id);
  }

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      try {
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [ready]);

  async function createListing(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const token = getToken();
    if (!token) return;
    try {
      await apiJson("/listings", {
        method: "POST",
        token,
        body: JSON.stringify({
          title,
          description,
          categoryId,
          basePriceCents,
          publish,
        }),
      });
      setTitle("Example: Aircon cleaning");
      setDescription("");
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
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
      <div className="page-header">
        <div>
          <p className="breadcrumb" style={{ margin: 0 }}>
            <Link href="/dashboard">Dashboard</Link> / My listings
          </p>
          <h1>My listings</h1>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close form" : "New listing"}
        </button>
      </div>

      {error ? <p className="text-error">{error}</p> : null}

      {showForm ? (
        <section className="detail-panel section-block">
          <h2>Create listing</h2>
          <form onSubmit={createListing} className="form">
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
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              <span>Publish immediately</span>
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create listing"}
            </button>
          </form>
        </section>
      ) : null}

      {!items ? <p>Loading listings…</p> : null}

      {items?.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Create your first service listing to start receiving bookings."
          action={
            <button type="button" onClick={() => setShowForm(true)}>
              Create listing
            </button>
          }
        />
      ) : null}

      {published.length > 0 ? (
        <section className="section-block">
          <h2>Published ({published.length})</h2>
          <ul className="card-grid">
            {published.map((l) => (
              <li key={l._id}>
                <ListingCard
                  id={l._id}
                  title={l.title}
                  description={l.description}
                  basePriceCents={l.basePriceCents}
                  categoryName={categoryNames[normalizeId(l.categoryId)]}
                  isPublished
                  href={`/listings/${l._id}`}
                />
                <p style={{ marginTop: "0.5rem" }}>
                  <Link href={`/provider/listings/${l._id}/edit`}>Edit listing</Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {drafts.length > 0 ? (
        <section className="section-block">
          <h2>Drafts ({drafts.length})</h2>
          <ul className="card-grid">
            {drafts.map((l) => (
              <li key={l._id}>
                <ListingCard
                  id={l._id}
                  title={l.title}
                  description={l.description}
                  basePriceCents={l.basePriceCents}
                  categoryName={categoryNames[normalizeId(l.categoryId)]}
                  isPublished={false}
                />
                <p style={{ marginTop: "0.5rem" }}>
                  <Link href={`/provider/listings/${l._id}/edit`}>Edit listing</Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
