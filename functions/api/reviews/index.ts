/**
 * GET /api/reviews — the public feed: APPROVED reviews only, newest first,
 * capped at MAX_PUBLIC. Pending/rejected reviews are never exposed here, and
 * moderation-only fields (ip/ua/status) are stripped.
 *
 * If storage isn't configured yet it returns an empty list (200) so the
 * homepage shows its "be the first" empty state instead of an error.
 */

import {
  Ctx,
  StoredReview,
  MAX_PUBLIC,
  json,
  listAllKeys,
  toPublic,
} from "./_shared";

export async function onRequestGet(context: Ctx): Promise<Response> {
  const { env } = context;

  if (!env.REVIEWS) {
    return json({ reviews: [] });
  }

  let approvedKeys: Array<{ name: string; date: string }> = [];
  try {
    const keys = await listAllKeys(env.REVIEWS);
    approvedKeys = keys
      .filter((k) => k.metadata?.status === "approved")
      .map((k) => ({ name: k.name, date: k.metadata?.date || "" }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)) // newest first
      .slice(0, MAX_PUBLIC);
  } catch {
    return json({ reviews: [] });
  }

  const kv = env.REVIEWS;
  const settled = await Promise.all(
    approvedKeys.map(async (k) => {
      try {
        const raw = await kv.get(k.name);
        if (!raw) return null;
        const r = JSON.parse(raw) as StoredReview;
        // Defensive: value's own status must also be approved.
        if (r.status !== "approved") return null;
        return toPublic(r);
      } catch {
        return null;
      }
    }),
  );

  const reviews = settled.filter((r): r is NonNullable<typeof r> => r !== null);
  return json({ reviews });
}

// Only GET is meaningful here.
export const onRequest = async (context: Ctx): Promise<Response> => {
  if (context.request.method !== "GET") return json({ error: "GET only" }, 405);
  return onRequestGet(context);
};
