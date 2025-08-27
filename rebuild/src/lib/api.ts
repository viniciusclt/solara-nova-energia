export class HttpError extends Error {
  status: number;
  payload?: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(url: string, params?: Record<string, unknown>) {
  if (!params) return url;
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = new URL(url, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      u.searchParams.set(key, String(value));
    }
  });
  return u.pathname + (u.search ? `?${u.searchParams.toString()}` : "");
}

async function apiFetch<T>(
  url: string,
  init?: (RequestInit & { params?: Record<string, unknown> })
): Promise<T> {
  const target = buildUrl(url, init?.params);
  const res = await fetch(target, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (isRecord(body)) {
      const errField = typeof body.error === "string" ? body.error : undefined;
      const msgField = typeof body.message === "string" ? body.message : undefined;
      message = errField || msgField || message;
    }
    throw new HttpError(res.status, message, body);
  }

  return body as T;
}

export const api = {
  get<T>(url: string, opts?: RequestInit & { params?: Record<string, unknown> }) {
    return apiFetch<T>(url, { ...opts, method: "GET" });
  },
  post<T>(url: string, body?: unknown, opts?: RequestInit) {
    return apiFetch<T>(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined, ...(opts || {}) });
  },
  patch<T>(url: string, body?: unknown, opts?: RequestInit) {
    return apiFetch<T>(url, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined, ...(opts || {}) });
  },
  del<T>(url: string, opts?: RequestInit) {
    return apiFetch<T>(url, { method: "DELETE", ...(opts || {}) });
  },
};

export type ListResponse<T> = { data: T[]; total: number; page: number; limit: number };
export type ItemResponse<T> = { data: T };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}