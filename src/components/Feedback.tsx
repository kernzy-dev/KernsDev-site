import { useState } from "react";
import { submitReview } from "../lib/forms";

const MAX_PHOTO_MB = 12;

/**
 * Feedback — a standalone, deep-linkable page (route: /feedback) meant to be the
 * target of an NFC tag on a shipped print: a customer taps the tag, lands here,
 * leaves a quick rating + comment, and on submit is bounced back to the home page.
 *
 * No backend: posts to FormSubmit so feedback emails Grant directly.
 */

const RETURN_TO = "/";          // where a completed form sends the visitor
const RETURN_DELAY = 1800;      // ms to show the thank-you before redirecting

type State = "idle" | "sending" | "ok" | "error";

export default function Feedback() {
  const [state, setState] = useState<State>("idle");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [photoCount, setPhotoCount] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending");
    setError("");
    try {
      const data = new FormData(form);
      // Per-order feedback: the printed sticker's QR carries ?o=<orderid>, so the
      // submission ties back to a specific transaction.
      const order = new URLSearchParams(window.location.search).get("o") || "";
      if (order) data.append("order", order);
      data.append("rating", rating ? `${rating} / 5` : "not rated");

      // Public reviews feed (KV) — best-effort, independent of the order-linked path.
      const reviewText = String(data.get("message") || "").trim();
      if (rating >= 1 && reviewText.length >= 2) {
        void submitReview({
          rating,
          name: String(data.get("name") || "").trim(),
          text: reviewText,
          hp: String(data.get("_honey") || ""),
        });
      }

      // Order-linked intake: any photos -> Google Drive, the review logged on the
      // order, Grant emailed. The /api/feedback function brokers it with the
      // shop-ops key held server-side (never exposed on this public page).
      const res = await fetch("/api/feedback", { method: "POST", body: data });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok !== false) {
        setState("ok");
        window.setTimeout(() => { window.location.href = RETURN_TO; }, RETURN_DELAY);
      } else {
        setError(json.error || "Something went wrong — please try again.");
        setState("error");
      }
    } catch {
      setError("Network error — please try again.");
      setState("error");
    }
  }

  const stars = [1, 2, 3, 4, 5];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-sm uppercase tracking-[0.2em] text-neutral-500 hover:text-accent transition-colors">
            KernsDev · 3D Print Shop
          </a>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">How did we do?</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Thirty seconds of feedback helps a lot — thank you.
          </p>
        </div>

        {state === "ok" ? (
          <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <p className="text-emerald-300 font-medium text-lg">Thanks for the feedback! 🎉</p>
            <p className="text-sm text-neutral-400 mt-2">Taking you back home…</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 md:p-8 space-y-5"
          >
            {/* Honeypot — bots fill this, humans never see it. */}
            <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {/* Star rating */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                Your rating
              </label>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Rating out of 5">
                {stars.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    aria-checked={rating === n}
                    role="radio"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    <span className={(hover || rating) >= n ? "text-accent" : "text-neutral-700"}>★</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="fb-message" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                What stood out? Anything we can improve?
              </label>
              <textarea
                id="fb-message"
                name="message"
                rows={4}
                className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                placeholder="Print quality, packaging, shipping speed, a request…"
              />
            </div>

            {/* Optional photo upload — lands in Drive against this order */}
            <div>
              <label htmlFor="fb-photos" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                Add photos <span className="text-neutral-600 normal-case tracking-normal">(optional — show off the print!)</span>
              </label>
              <input
                id="fb-photos"
                name="photo"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const fs = Array.from(e.target.files || []);
                  const tooBig = fs.find((f) => f.size > MAX_PHOTO_MB * 1024 * 1024);
                  if (tooBig) {
                    setError(`"${tooBig.name}" is over ${MAX_PHOTO_MB} MB — pick a smaller photo.`);
                    e.target.value = "";
                    setPhotoCount(0);
                    return;
                  }
                  setError("");
                  setPhotoCount(fs.length);
                }}
                className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-100 hover:file:bg-neutral-700 file:cursor-pointer"
              />
              {photoCount > 0 && (
                <p className="mt-1 text-xs text-accent">
                  {photoCount} photo{photoCount > 1 ? "s" : ""} attached
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fb-name" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  Name <span className="text-neutral-600 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="fb-name"
                  name="name"
                  autoComplete="name"
                  className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                />
              </div>
              <div>
                <label htmlFor="fb-email" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  Email <span className="text-neutral-600 normal-case tracking-normal">(if you want a reply)</span>
                </label>
                <input
                  id="fb-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                />
              </div>
            </div>

            {state === "error" && <p role="alert" className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={state === "sending"}
              aria-busy={state === "sending"}
              className="btn-primary w-full justify-center text-base outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {state === "sending" ? "Sending…" : "Send feedback →"}
            </button>
            <p className="text-center text-xs text-neutral-600">
              You'll be taken back to the home page when you're done.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
