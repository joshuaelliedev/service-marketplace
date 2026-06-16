"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

type Post = {
  _id: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
};

type Rating = {
  _id: string;
  stars: number;
  comment?: string;
  createdAt: string;
};

export default function ProviderProfilePage() {
  const params = useParams<{ id: string }>();
  const providerId = params.id;
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [ratings, setRatings] = useState<Rating[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [p, r] = await Promise.all([
          apiJson<Post[]>(`/provider-posts/providers/${providerId}`),
          apiJson<Rating[]>(`/ratings/providers/${providerId}`),
        ]);
        setPosts(p);
        setRatings(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      }
    })();
  }, [providerId]);

  if (error) {
    return (
      <main>
        <p className="text-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="main-wide">
      <p className="breadcrumb">
        <Link href="/listings">← Browse services</Link>
      </p>
      <h1>Provider profile</h1>

      {ratings ? (
        <section className="detail-panel section-block">
          <h2>Ratings</h2>
          {ratings.length === 0 ? (
            <p className="text-muted">No ratings yet.</p>
          ) : (
            <>
              <p>
                <strong>
                  {(ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)}
                </strong>{" "}
                / 5 ({ratings.length} review{ratings.length === 1 ? "" : "s"})
              </p>
              <ul className="booking-list">
                {ratings.map((r) => (
                  <li key={r._id}>
                    <strong>{r.stars}★</strong>
                    {r.comment ? <p>{r.comment}</p> : null}
                    <p className="text-muted" style={{ fontSize: 13 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <p>Loading ratings…</p>
      )}

      <section className="section-block">
        <h2>Timeline</h2>
        {!posts ? (
          <p>Loading timeline…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted">No posts yet.</p>
        ) : (
          <ul className="booking-list">
            {posts.map((p) => (
              <li key={p._id} className="detail-panel">
                <p>{p.body}</p>
                {p.imageUrl ? (
                  <p>
                    <a href={p.imageUrl} target="_blank" rel="noreferrer">
                      View image
                    </a>
                  </p>
                ) : null}
                <p className="text-muted" style={{ fontSize: 13 }}>
                  {new Date(p.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
