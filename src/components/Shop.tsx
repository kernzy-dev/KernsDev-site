import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";
import CustomPrint from "./CustomPrint";
import Logo from "./Logo";
import ThreeErrorBoundary from "./three/ThreeErrorBoundary";
import useReducedMotion from "../hooks/useReducedMotion";
import { hasWebGL } from "../lib/webgl";
import {
  PRINTS,
  sizeOptions,
  catalogCategories,
  catalogMaterials,
  priceValue,
  packTotal,
  shopProductsJsonLd,
  SHOP_URL,
  type Print,
} from "../lib/prints";

// SEO chrome for the storefront route. No SSR here, so the shop-specific
// <title>, meta description, canonical, and Product JSON-LD are applied
// client-side (Googlebot renders JS) and restored when leaving the route —
// this keeps index.html's AI-consulting defaults intact for every other page.
const SHOP_TITLE =
  "3D Printed Decor, Figurines & Gifts — Made to Order | KernsDev (Somerset, KY)";
const SHOP_DESC =
  "Shop handmade 3D printed decor, figurines, and gifts from KernsDev in Somerset, KY — Halloween and Christmas decor, desk accessories, planters, dice towers, and custom prints. Made to order in durable PLA/PETG and shipped nationwide.";

function useShopSeo() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = SHOP_TITLE;

    const descEl = document.querySelector('meta[name="description"]');
    const prevDesc = descEl?.getAttribute("content") ?? null;
    descEl?.setAttribute("content", SHOP_DESC);

    const canonEl = document.querySelector('link[rel="canonical"]');
    const prevCanon = canonEl?.getAttribute("href") ?? null;
    canonEl?.setAttribute("href", SHOP_URL);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.setAttribute("data-shop-ld", "");
    ld.textContent = JSON.stringify(shopProductsJsonLd());
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== null) descEl.setAttribute("content", prevDesc);
      if (canonEl && prevCanon !== null) canonEl.setAttribute("href", prevCanon);
      ld.remove();
    };
  }, []);
}

// Descriptive, keyworded alt text derived from the product — good for image
// search and accessibility (e.g. "Cozy Ghost — 3D printed Halloween decor in
// PLA"). Falls back gracefully when a product has no themed/category tag.
function imageAlt(p: Print): string {
  const occasion = (p.tags ?? []).find(
    (t) => t === "Halloween" || t === "Christmas",
  );
  const tags = p.tags ?? [];
  const kind = tags.includes("Desk & Office")
    ? "desk accessory"
    : tags.includes("Tabletop & Games")
      ? "tabletop piece"
      : tags.includes("Toys & Fidgets")
        ? "fidget toy"
        : tags.includes("Personalized")
          ? "personalized gift"
          : "decor";
  return `${p.name} — 3D printed ${occasion ? occasion + " " : ""}${kind} in ${p.material}, by KernsDev`;
}

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

// Heavy three.js viewer — only pulled in when a customer opens a 360° preview.
const ProductViewer3D = lazy(() => import("./ProductViewer3D"));

// Signature "print-in" hero scene — its own chunk (R3F/Three/postprocessing),
// only fetched when WebGL is present on a wide-enough viewport.
const PrintInHero = lazy(() => import("./shop/PrintInHero"));

/**
 * /shop — 3D-print storefront. Physical prints, checkout via Stripe Payment
 * Links (each product's `stripeLink`). Standalone page (own route in App.tsx),
 * styled to match the landing page's design system.
 */
export default function Shop() {
  useShopSeo();
  const live = PRINTS.filter((p) => p.stripeLink && !p.soldOut).length;
  const [viewing, setViewing] = useState<Print | null>(null);

  // Signature 3D hero: mounts wherever WebGL is available — phones included
  // (most of the shop's traffic), tiered down for performance on small screens.
  // No-WebGL devices get the static header; reduced-motion shows the finished
  // model without the print-in sweep or turntable.
  const reduced = useReducedMotion();
  const [heroOn, setHeroOn] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (hasWebGL()) {
      setMobile(window.innerWidth < 640);
      setHeroOn(true);
    }
  }, []);

  // Filter / search state — a normal storefront browse experience.
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [material, setMaterial] = useState("All");
  const [sort, setSort] = useState<SortKey>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const categories = catalogCategories();
  const materials = catalogMaterials();

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = PRINTS.filter((p) => {
      if (category !== "All" && !(p.tags ?? []).includes(category)) return false;
      if (material !== "All" && p.material !== material) return false;
      if (inStockOnly && (!p.stripeLink || p.soldOut)) return false;
      if (needle) {
        const hay = `${p.name} ${p.tagline} ${p.description} ${(p.tags ?? []).join(" ")} ${p.material}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => priceValue(a) - priceValue(b));
    else if (sort === "price-desc") list = [...list].sort((a, b) => priceValue(b) - priceValue(a));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, category, material, sort, inStockOnly]);

  const filtersActive =
    query.trim() !== "" || category !== "All" || material !== "All" || inStockOnly || sort !== "featured";
  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setMaterial("All");
    setSort("featured");
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Slim top bar */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="container-tight flex items-center justify-between h-16">
          <Logo />
          <a href="/" className="text-sm text-neutral-300 hover:text-white transition-colors">
            ← Back to site
          </a>
        </div>
      </header>

      <main className="container-tight py-16 md:py-24">
        <div className="relative isolate flex flex-col justify-center min-h-[clamp(380px,56vh,560px)]">
          {/* Signature print-in 3D backdrop — full-bleed behind the header copy.
              Decorative only (aria-hidden) + pointer-events-none so the real
              heading text below stays crawlable and links stay clickable. */}
          {heroOn && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 -z-10"
            >
              <ThreeErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <PrintInHero animate={!reduced} mobile={mobile} />
                </Suspense>
              </ThreeErrorBoundary>
              {/* Legibility scrim so the copy reads over the scene. */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 72% 82% at 50% 45%, rgba(10,10,12,0) 0%, rgba(10,10,12,0.38) 58%, rgba(10,10,12,0.86) 100%)",
                }}
              />
            </div>
          )}
          <Reveal>
            <p className="section-eyebrow mb-2">3D Print Shop</p>
            <h1 className="text-4xl md:text-5xl font-bold font-display max-w-2xl">
              3D Printed Decor, Figurines &amp; Gifts — Made to Order
            </h1>
            <p className="text-neutral-400 mt-4 max-w-xl">
              Original 3D printed decor, figurines, and gifts — Halloween and Christmas
              pieces, desk accessories, planters, and more — printed to order on a
              Bambu Lab X2D in durable PLA and PETG. Pick a color at checkout; each
              piece is handmade in Somerset, KY and shipped to you within a few days.
              Secure checkout is handled by Stripe.
            </p>
          </Reveal>
        </div>

        {/* Filter / search bar */}
        <Reveal delay={0.05}>
          <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 md:p-5">
            {/* Search + sort row */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 24 24"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prints…"
                  aria-label="Search prints"
                  className="w-full bg-neutral-950/60 border border-neutral-800 focus:border-accent/60 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-neutral-400 select-none cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-accent h-4 w-4"
                  />
                  In stock
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  aria-label="Filter by material"
                  className="flex-1 md:flex-none min-w-0 bg-neutral-950/60 border border-neutral-800 focus:border-accent/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-200"
                >
                  <option value="All">All materials</option>
                  {materials.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort prints"
                  className="flex-1 md:flex-none min-w-0 bg-neutral-950/60 border border-neutral-800 focus:border-accent/60 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-200"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name">Name: A–Z</option>
                </select>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {["All", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                    category === c
                      ? "bg-accent text-white border-accent"
                      : "bg-neutral-950/40 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Result count + clear */}
        <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
          <span>
            {results.length} {results.length === 1 ? "print" : "prints"}
            {filtersActive ? " match your filters" : ""}
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded"
            >
              Clear filters
            </button>
          )}
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4"
          style={{ perspective: "1500px" }}
        >
          {results.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <Weighted tilt={4} lift={12} className="h-full">
                <PrintCard print={p} onView={p.model ? () => setViewing(p) : undefined} />
              </Weighted>
            </Reveal>
          ))}
        </div>

        {results.length === 0 && (
          <Reveal delay={0.1}>
            <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/40 px-6 py-12 text-center">
              <p className="text-neutral-300 font-medium">No prints match these filters</p>
              <p className="mt-1 text-sm text-neutral-500">Try a different category or material, or clear your filters to see everything.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded"
              >
                Clear filters
              </button>
            </div>
          </Reveal>
        )}

        {live === 0 && (
          <Reveal delay={0.1}>
            <p className="text-sm text-neutral-500 mt-10 text-center">
              The shop is being stocked — checkout links go live shortly. Check back soon.
            </p>
          </Reveal>
        )}

        {/* Bring-your-own-model custom print intake */}
        <CustomPrint />

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

        <Reveal delay={0.2}>
          <p className="mt-10 text-xs text-neutral-600 max-w-2xl leading-relaxed">
            Model credits: several prints are made from community designs, shared
            under Creative Commons. Gridfinity organizer by jaketmiller93, headphone
            stand by MrMercenary, phone stand by heinandre, planter by Kodrann, dice
            tower by FresnelTHz, articulated slug by 8ran (CC&nbsp;BY / CC&nbsp;BY-SA).
            Dragon by illuminarti (public domain). Nameplate is our own design. We
            sell the printed object; design credit stays with the original makers.
          </p>
        </Reveal>
      </main>

      {viewing?.model && (
        <Suspense fallback={null}>
          <ProductViewer3D
            url={viewing.model}
            color={viewing.modelColor}
            name={viewing.name}
            onClose={() => setViewing(null)}
          />
        </Suspense>
      )}
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

function PrintCard({ print: p, onView }: { print: Print; onView?: () => void }) {
  const pack = p.pack;
  const sizes = sizeOptions(p);
  // Only offer sizes that actually have a checkout link. Most products ship a
  // single (base) size for now, so the S/M/L selector only appears once the
  // M/L links exist — keeps the card clean with no "coming soon" sub-states.
  const availSizes = sizes.filter((s) => !!safeHref(s.stripeLink));
  const [size, setSize] = useState(availSizes[0] ?? sizes[0]);
  const multiSize = availSizes.length > 1;
  const [qty, setQty] = useState(5);
  const packSum = pack ? packTotal(pack, qty) : 0;
  const savings = pack ? qty * pack.unit - packSum : 0;
  const priceLabel = pack ? `$${packSum.toFixed(2)}` : size.price;
  // Pack products check out via the single-unit stripeLink; sized products via the size link.
  const activeLink = pack ? p.stripeLink : size.stripeLink;
  const buyable = !p.soldOut && !!safeHref(activeLink);
  return (
    <article className="group relative bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 border border-neutral-800 hover:border-accent/40 rounded-2xl overflow-hidden transition-colors h-full flex flex-col">
      {/* Image (gradient fallback if the file is missing) */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800">
        <span className="absolute inset-0 grid place-items-center text-neutral-700 text-xs uppercase tracking-widest">
          {p.material}
        </span>
        {onView && (
          <>
            <button
              type="button"
              onClick={onView}
              aria-label={`View ${p.name} in an interactive 360° preview`}
              className="absolute inset-0 z-20 cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
            />
            <span className="absolute top-3 right-3 z-30 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider bg-neutral-950/70 text-neutral-100 px-2 py-1 rounded-full border border-neutral-700 group-hover:border-accent/60 group-hover:text-white transition-colors pointer-events-none">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" opacity="0.4" />
                <path d="M16 8l5-5M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              360°
            </span>
          </>
        )}
        {p.video ? (
          <video
            src={p.video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={imageAlt(p)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : p.image ? (
          <img
            src={p.image}
            alt={imageAlt(p)}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {p.badge && (
          <span className="absolute top-3 left-3 z-10 text-[11px] uppercase tracking-wider bg-accent/90 text-white px-2 py-1 rounded">
            {p.badge}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-display font-bold">{p.name}</h3>
          <span className="text-lg font-semibold text-neutral-100 whitespace-nowrap">{priceLabel}</span>
        </div>
        <p className="text-sm text-neutral-300 font-medium mt-1">{p.tagline}</p>
        <p className="text-sm text-neutral-400 leading-relaxed mt-3">{p.description}</p>

        {pack ? (
          /* Quantity selector with bulk pricing (buy as many as you want) */
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">Quantity</span>
              <div className="flex items-center border border-neutral-800 rounded-md overflow-hidden">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                >
                  −
                </button>
                <span aria-live="polite" className="px-4 py-1.5 text-sm tabular-nums min-w-[2.5rem] text-center text-neutral-100">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  className="px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1, 5, 10, 15].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQty(n)}
                  aria-pressed={qty === n}
                  aria-label={n === 1 ? "Single" : `${n}-pack`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                    qty === n
                      ? "bg-accent text-white border-accent"
                      : "bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {n === 1 ? "Single" : `${n}-pack`}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              ${pack.unit.toFixed(2)} each · ${pack.off.toFixed(2)} off every {pack.per}
              {savings > 0 && <span className="text-accent"> — you save ${savings.toFixed(2)}</span>}
            </p>
          </div>
        ) : multiSize ? (
          /* Size selector — only sizes that have a live checkout link */
          <div className="mt-4 flex gap-1.5" role="group" aria-label="Choose a size">
            {availSizes.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size.key === s.key}
                aria-label={`${s.name} — ${s.dims}`}
                title={`${s.name} — ${s.dims}`}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  size.key === s.key
                    ? "bg-accent text-white border-accent"
                    : "bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                }`}
              >
                {s.key}
              </button>
            ))}
          </div>
        ) : null}

        <dl className="text-xs text-neutral-500 mt-3 space-y-0.5">
          <div><span className="text-neutral-600">Material:</span> {p.material}</div>
          <div><span className="text-neutral-600">{pack || !multiSize ? "Size:" : `${size.name} size:`}</span> {pack ? p.size : size.dims}</div>
          {p.leadTime && <div>{p.leadTime}</div>}
        </dl>

        <div className="mt-auto pt-5">
          {buyable ? (
            <a
              href={safeHref(activeLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center text-sm w-full text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {pack ? `Buy ${qty} — ${priceLabel}` : multiSize ? `Buy ${size.name} — ${size.price}` : `Buy — ${size.price}`}
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex w-full justify-center text-sm border border-neutral-800 bg-neutral-900/30 text-neutral-500 px-4 py-2 rounded-md cursor-not-allowed"
            >
              {p.soldOut ? "Sold out" : pack ? "Coming soon" : `${size.name} — coming soon`}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
