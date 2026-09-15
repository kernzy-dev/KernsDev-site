import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";
import { PRINTS, type Print } from "../lib/prints";

/**
 * /shop — 3D-print storefront. Physical prints, checkout via Stripe Payment
 * Links (each product's `stripeLink`). Standalone page (own route in App.tsx),
 * styled to match the landing page's design system.
 */
export default function Shop() {
  const live = PRINTS.filter((p) => p.stripeLink && !p.soldOut).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Slim top bar */}
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
        <Reveal>
          <p className="section-eyebrow mb-2">3D Prints</p>
          <h1 className="text-4xl md:text-5xl font-bold font-display max-w-2xl">
            Printed to order, shipped to you.
          </h1>
          <p className="text-neutral-400 mt-4 max-w-xl">
            Designs I print on a Bambu Lab X2D in durable PLA/PETG. Pick a color at
            checkout; each piece is made to order and shipped within a few days.
            Secure checkout is handled by Stripe.
          </p>
        </Reveal>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          style={{ perspective: "1500px" }}
        >
          {PRINTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Weighted tilt={4} lift={12} className="h-full">
                <PrintCard print={p} />
              </Weighted>
            </Reveal>
          ))}
        </div>

        {live === 0 && (
          <Reveal delay={0.1}>
            <p className="text-sm text-neutral-500 mt-10 text-center">
              The shop is being stocked — checkout links go live shortly. Check back soon.
            </p>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <div className="mt-16 border-t border-neutral-900 pt-8 text-sm text-neutral-500 max-w-2xl">
            <p className="font-medium text-neutral-300 mb-2">How it works</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Tap <span className="text-neutral-300">Buy</span> — checkout, shipping and payment are handled securely by Stripe.</li>
              <li>Each print is made to order; you'll get an email confirmation and tracking.</li>
              <li>Questions or a custom request? <a href="/#contact" className="text-accent hover:underline">Get in touch</a>.</li>
            </ul>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

// Only allow web (https/http) or local-relative hrefs. A hostile or fat-fingered
// Stripe URL (e.g. "javascript:…") must never become a clickable link — React
// escapes text content but NOT href schemes.
function safeHref(u: string): string {
  const s = (u || "").trim().toLowerCase();
  return (s.startsWith("https://") || s.startsWith("http://") ||
          u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) ? u : "";
}

function PrintCard({ print: p }: { print: Print }) {
  // Only "buyable" if the link is present, in stock, AND a safe scheme.
  const buyable = !p.soldOut && !!safeHref(p.stripeLink);
  return (
    <article className="group relative bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 border border-neutral-800 hover:border-accent/40 rounded-2xl overflow-hidden transition-colors h-full flex flex-col">
      {/* Image (gradient fallback if the file is missing) */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800">
        <span className="absolute inset-0 grid place-items-center text-neutral-700 text-xs uppercase tracking-widest">
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
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        {p.badge && (
          <span className="absolute top-3 left-3 z-10 text-[11px] uppercase tracking-wider bg-accent/90 text-white px-2 py-1 rounded">
            {p.badge}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-display font-bold">{p.name}</h3>
          <span className="text-lg font-semibold text-neutral-100 whitespace-nowrap">{p.price}</span>
        </div>
        <p className="text-sm text-neutral-300 font-medium mt-1">{p.tagline}</p>
        <p className="text-sm text-neutral-400 leading-relaxed mt-3">{p.description}</p>

        <dl className="text-xs text-neutral-500 mt-4 space-y-0.5">
          <div><span className="text-neutral-600">Material:</span> {p.material}</div>
          <div><span className="text-neutral-600">Size:</span> {p.size}</div>
          {p.leadTime && <div>{p.leadTime}</div>}
        </dl>

        <div className="mt-auto pt-5">
          {buyable ? (
            <a
              href={safeHref(p.stripeLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm w-full text-center"
            >
              Buy — {p.price}
            </a>
          ) : (
            <span className="inline-flex w-full justify-center text-sm border border-neutral-800 text-neutral-500 px-4 py-2 rounded-md cursor-not-allowed">
              {p.soldOut ? "Sold out" : "Coming soon"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
