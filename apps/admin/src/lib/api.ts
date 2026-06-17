export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  const direct =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.INTERNAL_API_URL?.trim() ||
    "http://127.0.0.1:3001";
  return direct.replace(/\/$/, "");
}

export async function apiJson<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    if (text.includes("Cannot POST") || text.includes("Cannot GET")) {
      throw new Error(
        `Got a Next.js/HTML response instead of JSON. Set NEXT_PUBLIC_API_URL to the API (e.g. http://localhost:3001). Current base: ${getApiBaseUrl()}`,
      );
    }
    throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const errBody = json as { message?: string | string[] } | null;
    const msg =
      typeof errBody?.message === "string"
        ? errBody.message
        : Array.isArray(errBody?.message)
          ? errBody.message.join(", ")
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function apiFormData<T>(
  path: string,
  formData: FormData,
  init: { method?: string; token?: string | null } = {},
): Promise<T> {
  const headers = new Headers();
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: init.method ?? "POST",
    headers,
    body: formData,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const errBody = json as { message?: string | string[] } | null;
    const msg =
      typeof errBody?.message === "string"
        ? errBody.message
        : Array.isArray(errBody?.message)
          ? errBody.message.join(", ")
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function fetchAuthenticatedBlobUrl(
  path: string,
  token: string,
): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
