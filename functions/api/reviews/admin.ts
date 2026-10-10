/**
 * GET /api/reviews/admin?key=<secret> — moderation listing.
 *
 * Returns ALL reviews (pending, approved, rejected) with full fields so Grant
 * can moderate. Gated by the REVIEWS_ADMIN_KEY env var (set as a Pages secret).
 * Approve/reject happens via POST /api/reviews/admin/approve.
 */

import {
  Ctx,
  StoredReview,
  json,
  listAllKeys,
  adminAuthorized,
} from "./_shared";

export async function onRequestGet(context: Ctx): Promise<Response> {
  const { request, env } = context;

  if (!env.REVIEWS_ADMIN_KEY) {
    return json({ error: "moderation not configured (no REVIEWS_ADMIN_KEY)" }, 503);
  }
  if (!adminAuthorized(request, env)) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!env.REVIEWS) {
    return json({ error: "reviews storage not configured" }, 503);
  }

  const kv = env.REVIEWS;
  let keys: Array<{ name: string }>;
  try {
    keys = await listAllKeys(kv);
  } catch {
    return json({ error: "could not read reviews" }, 502);
  }

  const settled = await Promise.all(
    keys.map(async (k) => {
      try {
        const raw = await kv.get(k.name);
        return raw ? (JSON.parse(raw) as StoredReview) : null;
      } catch {
        return null;
      }
    }),
  );

  const all = settled
    .filter((r): r is StoredReview => r !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const counts = {
    pending: all.filter((r) => r.status === "pending").length,
    approved: all.filter((r) => r.status === "approved").length,
    rejected: all.filter((r) => r.status === "rejected").length,
    total: all.length,
  };

  return json({ counts, reviews: all });
}

export const onRequest = async (context: Ctx): Promise<Response> => {
  if (context.request.method !== "GET") return json({ error: "GET only" }, 405);
  return onRequestGet(context);
};
