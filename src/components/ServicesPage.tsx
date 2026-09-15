import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";
import { SERVICES } from "../lib/services";

/**
 * /services — dedicated services page (standalone route, like /shop and /world).
 * Modeled on a classic agency services layout (hero → grid → trust → CTA) but
 * carrying the AI-specialist brand and honest positioning (no fabricated stats).
 */

// Honest trust points — capabilities & how I work, NOT invented project counts.
const TRUST: { k: string; v: string }[] = [
  { k: "AI-first", v: "LLM, agent & automation systems I build and run daily" },
  { k: "Full-stack", v: "Strategy → build → the automation around it, one person" },
  { k: "$0-ish hosting", v: "Deployed on infra that costs next to nothing to run" },
  { k: "1–3 calls", v: "Most projects scope fast, real pricing up front" },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="container-tight flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="bg-accent text-white w-8 h-8 rounded-md grid place-items-center">K</span>
            <span>KernsDev</span>
          </a>
          <a href="/" className="text-sm text-neutral-300 hover:text-white transition-colors">
            ← Back to site
          </a>
        </div>
      </header>

      <main className="container-tight py-16 md:py-24">
        {/* Hero */}
        <Reveal>
          <p className="section-eyebrow mb-2">Services</p>
          <h1 className="text-4xl md:text-6xl font-bold font-display max-w-3xl leading-[1.05]">
            AI-first software,{" "}
            <span className="text-accent">built end-to-end.</span>
          </h1>
          <p className="text-neutral-400 mt-5 max-w-2xl text-lg">
            An AI specialist who also ships the whole stack — strategy, build, and the
            automation around it. From a single integration to a full autonomous system,
            here's what I do and roughly what it costs.
          </p>
          <div className="mt-6 flex gap-4 flex-wrap">
            <a href="/#contact" className="btn-primary">Book a call →</a>
            <a href="/" className="text-sm text-neutral-400 hover:text-white transition-colors self-center">
              See the work →
            </a>
          </div>
        </Reveal>

        {/* Trust strip */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
            {TRUST.map((t) => (
              <div key={t.k} className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/30">
                <div className="text-accent font-display font-semibold">{t.k}</div>
                <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{t.v}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Services grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16"
          style={{ perspective: "1500px" }}
        >
          {SERVICES.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.05}>
              <Weighted tilt={3} lift={10} className="h-full">
                <article className="group relative bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 border border-neutral-800 hover:border-accent/40 rounded-2xl p-6 transition-colors h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl text-accent group-hover:scale-110 transition-transform origin-left">
                      {s.icon}
                    </div>
                    {s.tag && (
                      <span className="text-[10px] uppercase tracking-wider border border-accent/40 text-accent/90 bg-accent/10 px-2 py-0.5 rounded">
                        {s.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 className="font-display font-semibold text-lg">{s.name}</h3>
                    {s.startingAt && (
                      <span className="text-xs text-neutral-500 whitespace-nowrap">{s.startingAt}</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">{s.desc}</p>
                  {s.detail && (
                    <p className="text-sm text-neutral-500 leading-relaxed mt-3 pt-3 border-t border-neutral-800/70">
                      {s.detail}
                    </p>
                  )}
                </article>
              </Weighted>
            </Reveal>
          ))}
        </div>

        {/* Closing CTA */}
        <Reveal delay={0.15}>
          <div className="mt-20 border-t border-neutral-900 pt-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-display">
              Have something in mind?
            </h2>
            <p className="text-neutral-400 mt-3 max-w-xl mx-auto">
              Tell me the problem — I'll tell you honestly whether AI (or just good software)
              is the fix, and what it'd take. Most projects scope in a call or two.
            </p>
            <div className="mt-6">
              <a href="/#contact" className="btn-primary">Start the conversation →</a>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
