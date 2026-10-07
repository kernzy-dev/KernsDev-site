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
