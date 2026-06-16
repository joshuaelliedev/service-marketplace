"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { useRequireRole } from "@/lib/use-require-role";

type Post = {
  _id: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
};

export default function ProviderTimelinePage() {
  const { ready } = useRequireRole("provider");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const token = getToken();
    if (!token) return;
    const data = await apiJson<Post[]>("/provider-posts/mine", { token });
    setPosts(data);
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

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setBusy("create");
    setError(null);
    try {
      await apiJson("/provider-posts", {
        method: "POST",
        token,
        body: JSON.stringify({ body, imageUrl: imageUrl || undefined }),
      });
      setBody("");
      setImageUrl("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed");
    } finally {
      setBusy(null);
    }
  }

  async function removePost(id: string) {
    const token = getToken();
    if (!token) return;
    setBusy(id);
    try {
      await apiJson(`/provider-posts/${id}`, { method: "DELETE", token });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
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
        <Link href="/dashboard">Dashboard</Link> / Timeline
      </p>
      <h1>Provider timeline</h1>
      <p className="text-muted">Share updates visible on your public profile.</p>
      {error ? <p className="text-error">{error}</p> : null}

      <section className="detail-panel section-block">
        <h2>New post</h2>
        <form onSubmit={createPost} className="form">
          <label className="field">
            <span>Text</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          </label>
          <label className="field">
            <span>Image URL (optional)</span>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <button type="submit" disabled={busy === "create"}>
            {busy === "create" ? "Posting…" : "Publish post"}
          </button>
        </form>
      </section>

      {!posts ? (
        <p>Loading posts…</p>
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
              <button
                type="button"
                className="btn-secondary"
                disabled={busy === p._id}
                onClick={() => void removePost(p._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
