"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticatedBlobUrl } from "@/lib/api";

type Props = {
  path: string;
  token: string;
  alt: string;
  className?: string;
};

export function KycDocumentImage({ path, token, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [path, token]);

  if (error) return <p className="text-error">{error}</p>;
  if (!src) return <p className="text-muted">Loading image…</p>;
  return <img src={src} alt={alt} className={className ?? "kyc-doc-image"} />;
}
