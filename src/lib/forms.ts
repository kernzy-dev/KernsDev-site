// Form delivery endpoint — FormSubmit.co (no backend, no key, works with any
// inbox). One-time activation: the first real submission triggers a confirmation
// email to FORM_TARGET; click it once and the form is live.
//
// TEMPORARY target = Grant's Gmail (FormSubmit needs a reachable inbox and the
// kernsdev.com inbox isn't live yet). Once gkerns@kernsdev.com is routing, change
// FORM_TARGET to "gkerns@kernsdev.com" and redeploy — that also hides the
// personal address from the bundle.
export const FORM_TARGET = "grant.kerns14@gmail.com";

export const FORM_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(FORM_TARGET)}`;

/** True for FormSubmit's success payload (it returns success as `true` or "true"). */
export function formSucceeded(json: unknown): boolean {
  const s = (json as { success?: unknown })?.success;
  return s === true || s === "true";
}

// ---------------------------------------------------------------------------
// Customer reviews — same-origin Cloudflare Pages Function backed by KV.
// Submitting a review stores it as PENDING (unapproved); it only appears on the
// site once Grant approves it. This runs ALONGSIDE the FormSubmit email so a
// failure of one path never breaks the other.
export const REVIEWS_SUBMIT_ENDPOINT = "/api/reviews/submit";

/**
 * Fire a review at the KV-backed store. Resolves true on success, false on any
 * failure (never throws) — callers should treat it as best-effort so the email
 * path stays authoritative for the UI's success state.
 */
export async function submitReview(review: {
  rating: number;
  name?: string;
  text: string;
  hp?: string; // honeypot passthrough
}): Promise<boolean> {
  try {
    const res = await fetch(REVIEWS_SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify(review),
    });
    if (!res.ok) return false;
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return json?.ok === true;
  } catch {
    return false;
  }
}
