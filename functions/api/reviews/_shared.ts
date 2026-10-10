/**
 * Shared types + helpers for the customer-reviews API.
 *
 * Cloudflare Pages Functions, pure Workers runtime (zero npm deps). Files that
 * start with `_` are NOT routed by Pages — they're importable helper modules
 * only (same convention `_middleware.ts` relies on).
 *
 * Storage model (KV binding `REVIEWS`):
 *   key    = `review:<id>`
 *   value  = JSON of StoredReview (full record, incl. moderation fields)
 *   meta   = { status, date }   ← lets list() filter/sort without reading values
 *
 * Reviews are stored UNAPPROVED ("pending") on submit. Only an admin call can
 * flip a review to "approved", and only approved reviews are ever returned to
 * the public GET. Client input is never trusted: rating is clamped to 1–5,
 * text/name are length-capped and stripped of control chars, and the raw text
 * is only ever rendered by React (which escapes it) — never as HTML.
 */

// @cloudflare/workers-types isn't installed in this project, so we declare the
// slice of the KV API we actually use (mirrors shipping-rates.ts's local-type
// approach for the handler context).
export interface KVNamespace {
  get(key: string, type?: "text"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { metadata?: unknown; expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string; metadata?: ReviewMeta }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface ReviewsEnv {
  /** KV binding — create the namespace and bind it as `REVIEWS` on the Pages project. */
  REVIEWS?: KVNamespace;
  /** Secret for the moderation endpoints. Set as a Pages env var (never in the repo). */
  REVIEWS_ADMIN_KEY?: string;
}

export interface Ctx {
  request: Request;
  env: ReviewsEnv;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface StoredReview {
  id: string;
  rating: number;
  name: string;
  text: string;
  status: ReviewStatus;
  date: string; // ISO timestamp
  // Moderation-only fields — never returned to the public endpoint.
  ip?: string | null;
  ua?: string | null;
}

export interface ReviewMeta {
  status: ReviewStatus;
  date: string;
}

/** Public shape returned by GET /api/reviews — no IP/UA/status leak. */
export interface PublicReview {
  id: string;
  rating: number;
  name: string;
  text: string;
  date: string;
}

export const KEY_PREFIX = "review:";
export const MAX_PUBLIC = 50; // cap returned to the homepage
export const MAX_TEXT = 2000;
export const MAX_NAME = 80;

// Rate guard: max submissions per IP per rolling window.
export const RATE_MAX = 5;
export const RATE_WINDOW_SECONDS = 600; // 10 minutes

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

/** Trim, strip control chars (keep normal whitespace), collapse, and length-cap. */
export function sanitizeText(input: unknown, max: number): string {
  let s = typeof input === "string" ? input : String(input ?? "");
  // Drop C0/C1 control chars except tab/newline/carriage-return.
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  s = s.replace(/\r\n?/g, "\n"); // normalize newlines
  s = s.replace(/\n{3,}/g, "\n\n"); // cap blank-line runs
  s = s.trim();
  if (s.length > max) s = s.slice(0, max).trim();
  return s;
}

/** Return an integer 1–5, or null if the input isn't a valid rating. */
export function clampRating(input: unknown): number | null {
  const n = Math.round(Number(input));
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

/** Sortable-enough, collision-resistant id. We sort by `date` metadata anyway. */
export function newId(now: Date): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(16).slice(2, 12);
  return `${now.getTime().toString(36)}-${rand}`;
}

/** Length-constant string compare so the admin key can't be timing-probed. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Validate the admin key from a request's `?key=` query param against the env secret. */
export function adminAuthorized(request: Request, env: ReviewsEnv): boolean {
  const secret = env.REVIEWS_ADMIN_KEY || "";
  if (!secret) return false;
  const provided = new URL(request.url).searchParams.get("key") || "";
  return safeEqual(provided, secret);
}

/** Read every key under the reviews prefix, following KV list pagination. */
export async function listAllKeys(
  kv: KVNamespace,
): Promise<Array<{ name: string; metadata?: ReviewMeta }>> {
  const out: Array<{ name: string; metadata?: ReviewMeta }> = [];
  let cursor: string | undefined;
  // Safety bound on pagination loops (10 pages × 1000 = 10k reviews).
  for (let i = 0; i < 10; i++) {
    const page = await kv.list({ prefix: KEY_PREFIX, limit: 1000, cursor });
    out.push(...page.keys);
    if (page.list_complete || !page.cursor) break;
    cursor = page.cursor;
  }
  return out;
}

export function toPublic(r: StoredReview): PublicReview {
  return { id: r.id, rating: r.rating, name: r.name, text: r.text, date: r.date };
}
