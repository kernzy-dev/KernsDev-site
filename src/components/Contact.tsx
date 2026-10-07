import { useState } from "react";
import { motion } from "framer-motion";
import Reveal from "./motion/Reveal";
import { FORM_ENDPOINT, formSucceeded } from "../lib/forms";

/**
 * Contact — a real, working inquiry form. Posts to FormSubmit (no backend) so
 * messages email Grant directly. Replaces the old dead "Book a call" button
 * (href="#") that just jumped to the top with no way to actually get in touch.
 */

type State = "idle" | "sending" | "ok" | "error";

export default function Contact() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("sending");
    setError("");
    try {
      const data = new FormData(form);
      data.append("_subject", "New project inquiry — kernsdev.com");
      data.append("_template", "table");
      data.append("_captcha", "false");
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (formSucceeded(json)) {
        setState("ok");
        form.reset();
      } else {
        setError((json as { message?: string }).message || "Something went wrong — please try again.");
        setState("error");
      }
    } catch {
      setError("Network error — please try again.");
      setState("error");
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-neutral-900 relative overflow-hidden">
      {/* Animated accent glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-accent/10 blur-3xl rounded-full"
        />
      </div>

      <div className="container-tight max-w-2xl text-center">
        <Reveal>
          <p className="section-eyebrow mb-3">Get in touch</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Got a problem that needs <span className="text-accent">specific software</span>?
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg text-neutral-300 mb-10">
            Tell me about it. First call is free, 20 minutes, no pitch deck. If it's a fit we'll
            scope the build; if it isn't I'll tell you what tool already does it.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          {state === "ok" ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8">
              <p className="text-emerald-300 font-medium text-lg">Message sent — thanks! 🎉</p>
              <p className="text-sm text-neutral-400 mt-2">
                I'll get back to you shortly to set up that first call.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="text-left rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 md:p-8 space-y-4">
              <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                    Name<span className="text-accent"> *</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                    Email<span className="text-accent"> *</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">
                  What do you need built?<span className="text-accent"> *</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60"
                  placeholder="A rough description of the problem, the workflow, or the app you have in mind…"
                />
              </div>
              {state === "error" && <p role="alert" className="text-sm text-red-400">{error}</p>}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-neutral-600">Based in Somerset, KY · Remote-friendly</p>
                <motion.button
                  type="submit"
                  disabled={state === "sending"}
                  aria-busy={state === "sending"}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-base outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {state === "sending" ? "Sending…" : "Send →"}
                </motion.button>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
