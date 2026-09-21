import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";
import { PRINTS, type Print } from "../lib/prints";

/**
 * /3dtap — NFC-tap landing page for the 3D-print business. Someone taps a physical
 * NFC tag (on a print, a card, a market display) and lands here on their PHONE.
 * Purpose-built for the PRINT SHOP: its own layered logo + print-process theme,
 * distinct from the AI-consulting main site. Mobile-first, built to convert.
 */

// Only allow web (https/http) or local-relative hrefs — a hostile/fat-fingered
// Stripe URL (e.g. "javascript:…") must never become a clickable link.
function safeHref(u: string): string {
  const s = (u || "").trim().toLowerCase();
  return (s.startsWith("https://") || s.startsWith("http://") ||
          u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) ? u : "";
}

// Stacked-layers mark — reads as a 3D-printed object building up layer by layer.
function LayerMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M16 3l11 6-11 6L5 9l11-6z" fill="url(#lm)" opacity="0.95" />
      <path d="M16 15l11-6v4l-11 6L5 13V9l11 6z" fill="url(#lm)" opacity="0.6" />
      <path d="M16 21l11-6v4l-11 6L5 19v-4l11 6z" fill="url(#lm)" opacity="0.35" />
    </svg>
  );
}

const PROCESS = [
  { n: "01", k: "Model", v: "Your pick — or a custom design." },
  { n: "02", k: "Slice", v: "Tuned for strength + finish." },
  { n: "03", k: "Print", v: "Layer by layer on the Bambu X2D." },
  { n: "04", k: "Ship", v: "Made to order, tracked to you." },
];

const SPECS = [
  { k: "Multicolor", v: "Up to 4 filaments via AMS — real color, not paint." },
  { k: "Materials", v: "Durable PLA & PETG, matte or silk finishes." },
  { k: "Resolution", v: "Fine 0.1–0.2 mm layers on a Bambu Lab X2D." },
  { k: "Custom", v: "Bring an idea — I model & print one-offs too." },
];

// Subtle horizontal "print layer" lines for the hero backdrop.
const LAYER_LINES =
  "repeating-linear-gradient(0deg, rgba(192,132,252,0.06) 0px, rgba(192,132,252,0.06) 1px, transparent 1px, transparent 7px)";

export default function ThreeDTap() {
  const featured = PRINTS.slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      {/* ---- Branded header (its own print-shop identity) ---- */}
      <header className="sticky top-0 z-50 border-b border-neutral-800/70 bg-neutral-950/80 backdrop-blur">
        <div className="container-tight flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LayerMark className="h-8 w-8" />
            <span className="leading-none">
              <span className="block font-display text-lg font-bold tracking-tight">KernsDev</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-light">
                3D Print Lab
              </span>
            </span>
          </a>
          <a href="/3dprintshop" className="btn-primary px-4 py-2 text-sm">Shop →</a>
        </div>
      </header>

      <main className="relative">
        {/* ---- Hero ---- */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: LAYER_LINES }} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[460px]"
            style={{
              background:
                "radial-gradient(58% 60% at 50% 0%, rgba(168,85,247,0.20), rgba(168,85,247,0.03) 46%, transparent 70%)",
            }}
          />
          <div className="container-tight relative pb-14 pt-14 text-center sm:pt-20">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-light">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Tapped in
              </span>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
                Custom 3D prints,
                <span className="block bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
                  built layer by layer.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
                You tapped into the print lab. Multicolor, durable prints run on a
                <span className="text-neutral-100"> Bambu Lab X2D</span> — pick a
                piece and your colors, and it ships in days.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a href="/3dprintshop" className="btn-primary w-full justify-center sm:w-auto">
                  Browse the prints →
                </a>
                <a href="/#contact" className="btn-ghost w-full justify-center sm:w-auto">
                  Request a custom print
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---- How it's made (print process) ---- */}
        <section className="container-tight pb-14">
          <Reveal>
            <p className="section-eyebrow mb-4 text-center">From file to doorstep</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROCESS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <span className="font-mono text-xs text-accent-light">{s.n}</span>
                  <p className="mt-1 font-display text-sm font-bold">{s.k}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{s.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Featured prints ---- */}
        <section className="container-tight pb-14">
          <Reveal>
            <p className="section-eyebrow mb-2 text-center">Fresh off the bed</p>
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">A few favorites</h2>
          </Reveal>

          <div
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: "1500px" }}
          >
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Weighted tilt={4} lift={10} className="h-full">
                  <PrintCard print={p} />
                </Weighted>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 text-center">
              <a
                href="/3dprintshop"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light hover:text-accent"
              >
                See the full collection →
              </a>
            </div>
          </Reveal>
        </section>

        {/* ---- Specs / why ---- */}
        <section className="container-tight pb-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SPECS.map((s, i) => (
              <Reveal key={s.k} delay={i * 0.06}>
                <div className="flex h-full items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <LayerMark className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-display text-sm font-bold text-accent-light">{s.k}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{s.v}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Closing CTA ---- */}
        <section className="container-tight pb-24">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-2xl border border-accent/30 p-8 text-center"
              style={{ backgroundImage: LAYER_LINES }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/15 to-transparent" />
              <div className="relative">
                <h3 className="font-display text-2xl font-bold sm:text-3xl">Find something you like?</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-300">
                  Every piece is printed to order — grab one from the shop or ask
                  me for something custom.
                </p>
                <a href="/3dprintshop" className="btn-primary mt-6 justify-center">Shop all prints →</a>
              </div>
            </div>
          </Reveal>

          <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-neutral-600">
            <LayerMark className="h-4 w-4 opacity-70" />
            <a href="/" className="hover:text-neutral-400">KernsDev</a> · printed on a Bambu Lab X2D
          </p>
        </section>
      </main>
    </div>
  );
}

function PrintCard({ print: p }: { print: Print }) {
  const buyable = !p.soldOut && !!safeHref(p.stripeLink);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 transition-colors hover:border-accent/40">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800">
        <span className="absolute inset-0 grid place-items-center text-xs uppercase tracking-widest text-neutral-700">
          {p.material}
        </span>
        {p.image && (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        {p.badge && (
          <span className="absolute left-3 top-3 z-10 rounded bg-accent/90 px-2 py-1 text-[11px] uppercase tracking-wider text-white">
            {p.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold">{p.name}</h3>
          <span className="whitespace-nowrap text-base font-semibold">{p.price}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-neutral-300">{p.tagline}</p>

        <div className="mt-auto pt-5">
          {buyable ? (
            <a
              href={safeHref(p.stripeLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center text-sm"
            >
              Buy — {p.price}
            </a>
          ) : (
            <a
              href="/3dprintshop"
              className="inline-flex w-full justify-center rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-400 transition-colors hover:border-accent/40 hover:text-accent-light"
            >
              View in shop
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
