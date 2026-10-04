import { useState } from "react";

/**
 * Feedback — a standalone, deep-linkable page (route: /feedback) meant to be the
 * target of an NFC tag on a shipped print: a customer taps the tag, lands here,
 * leaves a quick rating + comment, and on submit is bounced back to the home page.
 *
 * No backend: posts to Web3Forms (same VITE_WEB3FORMS_KEY the contact/custom-print
 * forms use), so feedback emails Grant directly and his address never ships to the
 * client. Reuses the house dark aesthetic; no new dependencies.
 */

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;
const RETURN_TO = "/";          // where a completed form sends the visitor
const RETURN_DELAY = 1800;      // ms to show the thank-you before redirecting

type State = "idle" | "sending" | "ok" | "error";

export default function Feedback() {
  const [state, setState] = useState<State>("idle");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending");
    setError("");
    try {
      const data = new FormData(form);
      data.append("access_key", WEB3FORMS_KEY || "");
      data.append("subject", "New shop feedback — kernsdev.com");
      data.append("rating", rating ? `${rating} / 5` : "not rated");
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
      const json = await res.json();
      if (json.success) {
        setState("ok");
        // Completed → return to the home page.
        window.setTimeout(() => { window.location.href = RETURN_TO; }, RETURN_DELAY);
      } else {
        setError(json.message || "Something went wrong — please try again.");
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
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <p className="text-emerald-300 font-medium text-lg">Thanks for the feedback! 🎉</p>
            <p className="text-sm text-neutral-400 mt-2">Taking you back home…</p>
          </div>
        ) : !WEB3FORMS_KEY ? (
          <p className="text-center text-sm text-neutral-500">
            The feedback form is switching on — check back shortly.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 md:p-8 space-y-5"
          >
            {/* Honeypot — bots fill this, humans never see it. */}
            <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

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
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                What stood out? Anything we can improve?
              </label>
              <textarea
                name="message"
                rows={4}
                className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
                placeholder="Print quality, packaging, shipping speed, a request…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  Name <span className="text-neutral-600 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  name="name"
                  className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  Email <span className="text-neutral-600 normal-case tracking-normal">(if you want a reply)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent outline-none"
                />
              </div>
            </div>

            {state === "error" && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={state === "sending"}
              className="btn-primary w-full text-base disabled:opacity-60"
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
