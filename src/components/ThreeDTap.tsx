import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";
import { PRINTS, type Print } from "../lib/prints";

/**
 * /3dtap — NFC-tap landing page for the 3D prints. Someone taps a physical NFC
 * tag (on a print, a card, a market display) and lands here on their PHONE, so
 * this is mobile-first and built to convert: acknowledge the tap, show the goods
 * fast, and drive to the shop. Reuses the /shop catalog + the site design system.
 */

// Only allow web (https/http) or local-relative hrefs — a hostile/fat-fingered
// Stripe URL (e.g. "javascript:…") must never become a clickable link.
function safeHref(u: string): string {
  const s = (u || "").trim().toLowerCase();
  return (s.startsWith("https://") || s.startsWith("http://") ||
          u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) ? u : "";
}

const PERKS = [
  { k: "Multicolor", v: "Vivid multi-filament prints, not flat single-color." },
  { k: "Made to order", v: "Printed for you on a Bambu Lab X2D — pick your colors." },
  { k: "Ships in days", v: "Most orders go out in 3–5 days, tracked." },
  { k: "Custom welcome", v: "Have an idea? I model and print one-offs too." },
];

export default function ThreeDTap() {
  const featured = PRINTS.slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      {/* Ambient violet glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 0%, rgba(168,85,247,0.22), rgba(168,85,247,0.04) 45%, transparent 70%)",
        }}
      />

      <main className="relative container-tight">
        {/* ---- Hero ---- */}
        <section className="pt-16 pb-14 text-center sm:pt-24">
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
              Prints you can hold,
              <span className="block bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
                made just for you.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
              You tapped into the print shop. Multicolor, durable 3D prints —
              designed &amp; printed by Grant Kerns on a Bambu Lab X2D. Pick a
              piece, pick your colors, and it ships in days.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href="/shop" className="btn-primary w-full justify-center sm:w-auto">
                Browse the prints →
              </a>
              <a href="/#contact" className="btn-ghost w-full justify-center sm:w-auto">
                Request a custom print
              </a>
            </div>
          </Reveal>
        </section>

        {/* ---- Featured prints ---- */}
        <section className="pb-16">
          <Reveal>
            <p className="section-eyebrow mb-2 text-center">Fresh off the X2D</p>
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
              A few favorites
            </h2>
          </Reveal>

          <div
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: "1500px" }}
          >
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Weighted tilt={4} lift={10} className="h-full">
                  <TapCard print={p} />
                </Weighted>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 text-center">
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light hover:text-accent"
              >
                See the full collection →
              </a>
            </div>
          </Reveal>
        </section>

        {/* ---- Why / trust ---- */}
        <section className="pb-20">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PERKS.map((perk, i) => (
              <Reveal key={perk.k} delay={i * 0.06}>
                <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <p className="font-display text-sm font-bold text-accent-light">{perk.k}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{perk.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Closing CTA ---- */}
        <section className="pb-24">
          <Reveal>
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-transparent p-8 text-center">
              <h3 className="font-display text-2xl font-bold sm:text-3xl">
                Find something you like?
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-300">
                Every piece is made to order — grab one from the shop or ask me
                for something custom.
              </p>
              <a href="/shop" className="btn-primary mt-6 justify-center">
                Shop all prints →
              </a>
            </div>
          </Reveal>

          <p className="mt-10 text-center text-xs text-neutral-600">
            <a href="/" className="hover:text-neutral-400">KernsDev</a> · printed on a Bambu Lab X2D
          </p>
        </section>
      </main>
    </div>
  );
}

function TapCard({ print: p }: { print: Print }) {
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
              href="/shop"
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
