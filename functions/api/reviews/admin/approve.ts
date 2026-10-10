/**
 * POST /api/reviews/admin/approve?key=<secret> — approve or reject one review.
 *
 * Body (JSON): { id: string, action: "approve" | "reject" }
 *   (also accepts { status: "approved" | "rejected" } as an alias)
 *
 * Flips the stored review's status and its KV metadata so the public GET picks
 * up (or drops) it immediately. Gated by REVIEWS_ADMIN_KEY.
 */

import {
  Ctx,
  ReviewStatus,
  StoredReview,
  ReviewMeta,
  KEY_PREFIX,
  json,
  adminAuthorized,
} from "../_shared";

interface ApproveBody {
  id?: unknown;
  action?: unknown; // "approve" | "reject"
  status?: unknown; // "approved" | "rejected"
}

function resolveStatus(body: ApproveBody): ReviewStatus | null {
  const action = typeof body.action === "string" ? body.action.toLowerCase() : "";
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  const status = typeof body.status === "string" ? body.status.toLowerCase() : "";
  if (status === "approved" || status === "rejected" || status === "pending") {
    return status as ReviewStatus;
  }
  return null;
}

export async function onRequestPost(context: Ctx): Promise<Response> {
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

  let body: ApproveBody;
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return json({ error: "review id is required" }, 400);

  const status = resolveStatus(body);
  if (!status) {
    return json({ error: 'action must be "approve" or "reject"' }, 400);
  }

  const key = KEY_PREFIX + id;
  let review: StoredReview;
  try {
    const raw = await env.REVIEWS.get(key);
    if (!raw) return json({ error: "review not found" }, 404);
    review = JSON.parse(raw) as StoredReview;
  } catch {
    return json({ error: "could not read review" }, 502);
  }

  review.status = status;
  const meta: ReviewMeta = { status, date: review.date };

  try {
    await env.REVIEWS.put(key, JSON.stringify(review), { metadata: meta });
  } catch {
    return json({ error: "could not update review" }, 502);
  }

  return json({ ok: true, id: review.id, status: review.status });
}

export const onRequest = async (context: Ctx): Promise<Response> => {
  if (context.request.method !== "POST") return json({ error: "POST only" }, 405);
  return onRequestPost(context);
};
