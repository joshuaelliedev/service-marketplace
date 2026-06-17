"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticatedBlobUrl } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";

type Props = {
  path: string;
  alt: string;
  className?: string;
};

export function KycDocumentImage({ path, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Sign in required to view documents");
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        objectUrl = await fetchAuthenticatedBlobUrl(path, token);
        if (!cancelled) setSrc(objectUrl);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load image");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (error) {
    return (
      <p className="text-error" style={{ fontSize: 14, maxWidth: 280 }}>
        {error}
      </p>
    );
  }
  if (!src) return <p className="text-muted">Loading image…</p>;

  return (
    <div className="kyc-doc-frame">
      <img src={src} alt={alt} className={className ?? "kyc-doc-image"} />
      <a href={src} target="_blank" rel="noreferrer" className="kyc-doc-open">
        Open full size
      </a>
    </div>
  );
}
