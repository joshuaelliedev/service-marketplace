"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { apiJson } from "@/lib/api";
import { normalizeId } from "@/lib/format";

type Listing = {
  _id: string;
  title: string;
  description?: string;
  basePriceCents: number;
  categoryId: string | { _id: string };
};

type Category = { _id: string; name: string };

export default function ListingsPage() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    void (async () => {
      try {
        const [listings, cats] = await Promise.all([
          apiJson<Listing[]>("/listings"),
          apiJson<Category[]>("/categories"),
        ]);
        setItems(listings);
        setCategories(cats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c._id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((l) => {
      const catId = normalizeId(l.categoryId);
      if (categoryFilter !== "all" && catId !== categoryFilter) return false;
      if (!q) return true;
      const cat = categoryNames[catId]?.toLowerCase() ?? "";
      return (
        l.title.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q) ||
        cat.includes(q)
      );
    });
  }, [items, search, categoryFilter, categoryNames]);

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/">Home</Link> / Browse services
      </p>
      <h1>Browse services</h1>
      <p>Find local providers and book a morning or afternoon slot.</p>

      {error ? <p className="text-error">{error}</p> : null}

      {items ? (
        <div className="toolbar">
          <input
            className="toolbar__search"
            type="search"
            placeholder="Search by title or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search listings"
          />
        </div>
      ) : null}

      {categories.length > 0 ? (
        <div className="chip-row" role="tablist" aria-label="Filter by category">
          <button
            type="button"
            className={`chip${categoryFilter === "all" ? " chip--active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              className={`chip${categoryFilter === c._id ? " chip--active" : ""}`}
              onClick={() => setCategoryFilter(c._id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      {!items ? <p>Loading services…</p> : null}

      {filtered && filtered.length === 0 ? (
        <EmptyState
          title="No services found"
          description={
            search || categoryFilter !== "all"
              ? "Try a different search or category."
              : "No published listings yet. Check back soon."
          }
          action={
            search || categoryFilter !== "all" ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : null}

      {filtered && filtered.length > 0 ? (
        <ul className="card-grid">
          {filtered.map((l) => (
            <li key={l._id}>
              <ListingCard
                id={l._id}
                title={l.title}
                description={l.description}
                basePriceCents={l.basePriceCents}
                categoryName={categoryNames[normalizeId(l.categoryId)]}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
