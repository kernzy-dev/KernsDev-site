/**
 * POST /api/feedback — per-order feedback intake (rating + comment + photos).
 *
 * Why this exists: the public feedback page can't talk to the shop-ops Apps
 * Script directly without leaking its write key. This Cloudflare Pages Function
 * is the broker — it holds the key as a server-side secret, forwards the
 * submission (photos base64'd) to the shop-ops web app, which saves media to
 * Google Drive (Feedback/<orderid>/), logs the review on the Feedback tab, notes
 * the order, and emails Grant. The order id (from the sticker QR's ?o=) ties the
 * whole thing back to a specific transaction.
 *
 * Secrets (Pages env vars — never in the repo):
 *   SHOP_OPS_URL  — the shop-ops Apps Script /exec URL
 *   SHOP_OPS_KEY  — the shop-ops write key
 *
 * Request: multipart/form-data { order, rating, comment|message, name, email?,
 *                                photo (0..n File) }
 * Response (JSON): { ok, order, media: string[] }
 */

interface Env {
  SHOP_OPS_URL?: string;
  SHOP_OPS_KEY?: string;
}
interface Ctx {
  request: Request;
  env: Env;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// ArrayBuffer -> base64 (Workers runtime: btoa needs a binary string; build it
// in chunks so a few-MB photo doesn't blow the call stack).
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

const MAX_FILE = 12 * 1024 * 1024; // 12 MB/photo cap (videos come later)
const MAX_FILES = 6;

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  if (!env.SHOP_OPS_URL || !env.SHOP_OPS_KEY) {
    return json({ ok: false, error: "feedback intake not configured" }, 500);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "expected multipart/form-data" }, 400);
  }

  const str = (k: string) => (form.get(k) ?? "").toString().trim();
  const order = str("order") || str("o");
  const rating = str("rating");
  const comment = str("comment") || str("message");
  const name = str("name");

  // Collect uploaded photos (any File field), capped.
  const files: { name: string; type: string; b64: string }[] = [];
  for (const [, v] of form.entries()) {
    if (files.length >= MAX_FILES) break;
    if (v instanceof File && v.size > 0) {
      if (v.size > MAX_FILE) continue; // silently skip oversize (page also guards)
      if (!/^image\//i.test(v.type || "")) continue; // photos first — images only
      const buf = await v.arrayBuffer();
      files.push({ name: v.name || "photo.jpg", type: v.type || "image/jpeg", b64: toBase64(buf) });
    }
  }

  const body = new URLSearchParams();
  body.set("action", "feedbackupload");
  body.set("key", env.SHOP_OPS_KEY);
  body.set("order", order);
  body.set("rating", rating);
  body.set("comment", comment);
  body.set("name", name);
  body.set("channel", str("channel"));
  body.set("files", JSON.stringify(files));

  try {
    const r = await fetch(env.SHOP_OPS_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const text = await r.text();
    let res: unknown;
    try {
      res = JSON.parse(text);
    } catch {
      res = { ok: r.ok, note: text.slice(0, 160) };
    }
    return json(res, r.ok ? 200 : 502);
  } catch (e) {
    return json({ ok: false, error: "forward failed: " + (e as Error).message }, 502);
  }
};
