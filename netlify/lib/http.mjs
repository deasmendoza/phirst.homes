/* Small HTTP helpers for the private admin functions. */

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra || null;
  }
}

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, ...headers } });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return json({ ok: false, error: err.message, ...(err.extra || {}) }, err.status);
  }
  // Never log the error text: it could contain an applicant's details. The name is enough to find the cause.
  console.error("admin: unexpected error", err && err.name);
  return json({ ok: false, error: "Something went wrong on the server. Nothing was changed." }, 500);
}

// Wraps a handler so every error becomes a clean JSON response.
export function handle(fn) {
  return async (req, context) => {
    try { return await fn(req, context); }
    catch (err) { return errorResponse(err); }
  };
}

/* Requests that change data must come from the app itself:
   - a custom header that a cross-site form cannot send, and
   - if the browser sends an Origin header, it must match this site. */
export function requireSameOrigin(req) {
  if (req.method === "GET" || req.method === "HEAD") return;
  if (req.headers.get("x-phirst-request") !== "1") {
    throw new HttpError(403, "This request was not sent by the PHirst admin.");
  }
  const origin = req.headers.get("origin");
  if (origin) {
    let o;
    try { o = new URL(origin).host; } catch { o = ""; }
    const host = new URL(req.url).host;
    if (o !== host) throw new HttpError(403, "This request came from a different website.");
  }
}

export async function readJson(req, maxBytes) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > maxBytes) throw new HttpError(413, "This is too large to save.");
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new HttpError(413, "This is too large to save.");
  if (!text.trim()) return {};
  try {
    const v = JSON.parse(text);
    if (v === null || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object");
    return v;
  } catch {
    throw new HttpError(400, "The data sent was not valid.");
  }
}

// Path after a prefix, split into decoded segments. "/api/properties/abc/docs/x" → ["abc","docs","x"]
export function segments(req, prefix) {
  const path = new URL(req.url).pathname;
  if (!path.startsWith(prefix)) return null;
  return path.slice(prefix.length).split("/").filter(Boolean).map((s) => decodeURIComponent(s));
}

export function getCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
export const ID = /^[A-Za-z0-9_-]{6,64}$/;
