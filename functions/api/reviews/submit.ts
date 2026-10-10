/**
 * POST /api/reviews/submit — accept a customer review and store it as PENDING.
 *
 * Body (JSON): { rating: 1-5, name?: string, text: string, hp?: string }
 *   - `hp` is a honeypot: if a bot fills it, we return 200 OK but store nothing.
 *
 * The review is written to KV with status "pending" — it does NOT appear on the
 * site until an admin approves it (see admin.ts / admin/approve.ts). Nothing the
 * client sends is trusted: rating is clamped, text/name are sanitized + capped,
 * and a per-IP rate guard throttles floods.
 */

import {
  Ctx,
  ReviewsEnv,
  StoredReview,
  ReviewMeta,
  KEY_PREFIX,
  MAX_TEXT,
  MAX_NAME,
  RATE_MAX,
  RATE_WINDOW_SECONDS,
  json,
  sanitizeText,
  clampRating,
  newId,
} from "./_shared";

interface SubmitBody {
  rating?: unknown;
  name?: unknown;
  text?: unknown;
  message?: unknown; // tolerate the feedback form's field name too
  hp?: unknown; // honeypot
}

/** Best-effort per-IP rate guard. KV isn't atomic, but this stops obvious floods. */
async function rateLimited(env: ReviewsEnv, ip: string): Promise<boolean> {
  if (!env.REVIEWS || !ip) return false;
  const key = `rate:${ip}`;
  try {
    const current = Number((await env.REVIEWS.get(key)) || "0");
    if (current >= RATE_MAX) return true;
    await env.REVIEWS.put(key, String(current + 1), {
      expirationTtl: RATE_WINDOW_SECONDS,
    });
    return false;
  } catch {
    return false; // never block a legit submit on a rate-store hiccup
  }
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;

  if (!env.REVIEWS) {
    return json({ error: "reviews storage not configured" }, 503);
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  // Honeypot — pretend success so bots don't learn they were caught.
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
    return json({ ok: true, status: "pending" });
  }

  const rating = clampRating(body.rating);
  if (rating === null) {
    return json({ error: "a rating of 1–5 is required" }, 400);
  }

  const text = sanitizeText(body.text ?? body.message, MAX_TEXT);
  if (text.length < 2) {
    return json({ error: "a review comment is required" }, 400);
  }

  const name = sanitizeText(body.name, MAX_NAME) || "Anonymous";

  const ip = request.headers.get("cf-connecting-ip") || "";
  if (await rateLimited(env, ip)) {
    return json({ error: "too many submissions — please try again later" }, 429);
  }

  const now = new Date();
  const review: StoredReview = {
    id: newId(now),
    rating,
    name,
    text,
    status: "pending",
    date: now.toISOString(),
    ip: ip || null,
    ua: request.headers.get("user-agent") || null,
  };

  const meta: ReviewMeta = { status: review.status, date: review.date };

  try {
    await env.REVIEWS.put(KEY_PREFIX + review.id, JSON.stringify(review), {
      metadata: meta,
    });
  } catch {
    return json({ error: "could not store review" }, 502);
  }

  // Deliberately minimal response — don't echo stored fields back.
  return json({ ok: true, id: review.id, status: review.status });
}

// Anything other than POST is rejected (so the SPA fallback can't swallow it).
export const onRequest = async (context: Ctx): Promise<Response> => {
  if (context.request.method !== "POST") return json({ error: "POST only" }, 405);
  return onRequestPost(context);
};
