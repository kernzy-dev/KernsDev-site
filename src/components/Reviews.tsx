import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./motion/Reveal";
import useReducedMotion from "../hooks/useReducedMotion";
import { fetchApprovedReviews, SAMPLE_REVIEWS, type Review } from "../lib/reviews";

/**
 * Reviews — the homepage showpiece. Approved customer reviews drift around the
 * section as floating "bubbles" (continuous particle-style motion, varied sizes
 * and speeds, soft edge-bounce). Click a bubble and it zooms to center showing
 * the full review; the rest keep drifting behind a dimmed backdrop until you
 * close it.
 *
 * Performance: motion is driven by a single requestAnimationFrame loop that
 * writes `transform: translate3d(...)` straight to the DOM nodes (no React
 * re-render per frame), bubble count is capped, and the loop pauses when the
 * tab is hidden.
 *
 * Accessibility: every bubble is a real <button> with an aria-label; the
 * expanded card is a focus-trapped dialog closable with Esc or the X; and when
 * the user prefers reduced motion the whole field falls back to a static,
 * responsive grid of the same reviews (same click-to-expand, no drifting).
 */

// ---- tuning -----------------------------------------------------------------
// Smaller, more numerous bubbles → an ambient particle field rather than a set
// of cards. Caps stay modest so the single rAF loop stays cheap.
const MAX_BUBBLES_DESKTOP = 22;
const MAX_BUBBLES_MOBILE = 10;
const SPEED_DESKTOP = 0.17; // px per ms-ish (scaled by frame delta)
const SPEED_MOBILE = 0.11;

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return mobile;
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={className} role="img" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= r ? "text-accent" : "text-neutral-700"}>
          ★
        </span>
      ))}
    </span>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** Human "2 weeks ago" style relative time; falls back to the month-year. */
function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return "today";
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} month${m > 1 ? "s" : ""} ago`;
  }
  return fmtDate(iso);
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

type BubblePhysics = {
  id: string;
  x: number; // integrated base position (bounce bookkeeping)
  y: number;
  vx: number;
  vy: number;
  size: number;
  // depth: 0 = far background (small, slow, dim, soft) .. 1 = foreground.
  depth: number;
  opacity: number; // steady-state opacity from depth
  baseZ: number; // stacking from depth
  // organic per-bubble wobble (a gentle 2-axis sine on top of linear drift)
  wobbleAmpX: number;
  wobbleFreqX: number;
  wobblePhaseX: number;
  wobbleAmpY: number;
  wobbleFreqY: number;
  wobblePhaseY: number;
  // soft "breath" scale oscillation
  breathAmp: number;
  breathFreq: number;
  breathPhase: number;
  // staggered entrance
  entranceDelay: number; // ms after the field becomes visible
  hover: number; // lerped 0..1, mutated each frame
};

export default function Reviews() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const [reviews, setReviews] = useState<Review[] | null>(null); // null = loading
  const [usingSamples, setUsingSamples] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Screen-space origin of the clicked bubble, for the zoom-from-bubble effect.
  const [origin, setOrigin] = useState<{ dx: number; dy: number } | null>(null);

  // --- load approved reviews -------------------------------------------------
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const list = await fetchApprovedReviews(ctrl.signal);
        if (list.length > 0) {
          setReviews(list);
          setUsingSamples(false);
        } else if (import.meta.env.DEV) {
          // Dev/preview only: demo the animation with clearly-marked samples.
          setReviews(SAMPLE_REVIEWS);
          setUsingSamples(true);
        } else {
          setReviews([]);
        }
      } catch {
        if (ctrl.signal.aborted) return;
        // On a real failure, dev shows samples; prod shows the empty state.
        if (import.meta.env.DEV) {
          setReviews(SAMPLE_REVIEWS);
          setUsingSamples(true);
        } else {
          setReviews([]);
        }
      }
    })();
    return () => ctrl.abort();
  }, []);

  const cap = isMobile ? MAX_BUBBLES_MOBILE : MAX_BUBBLES_DESKTOP;
  const shown = useMemo(() => (reviews ?? []).slice(0, cap), [reviews, cap]);
  const expanded = useMemo(
    () => shown.find((r) => r.id === expandedId) ?? null,
    [shown, expandedId],
  );

  return (
    <section id="reviews" className="relative py-20 md:py-28 border-t border-neutral-900 overflow-hidden">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="section-eyebrow mb-2">Reviews</p>
              <h2 className="text-3xl md:text-4xl font-bold">What customers say.</h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              Real feedback from real orders. Tap a bubble to read the full review —
              or{" "}
              <a href="/feedback" className="text-accent hover:text-accent-light underline underline-offset-4">
                leave your own
              </a>
              .
            </p>
          </div>
        </Reveal>

        {usingSamples && (
          <div
            role="note"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-amber-300"
          >
            ⚠ Dev preview — sample reviews (not real), hidden in production
          </div>
        )}
      </div>

      {/* Animated field is full-bleed (ambient), the boxed states stay contained. */}
      {reviews === null ? (
        <div className="container-tight mt-6">
          <FieldSkeleton />
        </div>
      ) : shown.length === 0 ? (
        <div className="container-tight mt-6">
          <EmptyState />
        </div>
      ) : reduced ? (
        <div className="container-tight mt-8">
          <StaticGrid
            reviews={shown}
            sample={usingSamples}
            onOpen={(id) => {
              setOrigin(null);
              setExpandedId(id);
            }}
          />
        </div>
      ) : (
        <div className="mt-2 w-full px-2 sm:px-4">
          <BubbleField
            reviews={shown}
            isMobile={isMobile}
            onOpen={(id, dx, dy) => {
              setOrigin({ dx, dy });
              setExpandedId(id);
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <ExpandedReview
            key={expanded.id}
            review={expanded}
            sample={usingSamples}
            origin={origin}
            reduced={reduced}
            onClose={() => setExpandedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Floating bubble field (default, animated)
// -----------------------------------------------------------------------------
function BubbleField({
  reviews,
  isMobile,
  onOpen,
}: {
  reviews: Review[];
  isMobile: boolean;
  onOpen: (id: string, dx: number, dy: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const physicsRef = useRef<BubblePhysics[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });
  const hoverIdRef = useRef<string | null>(null);
  const startRef = useRef<number | null>(null); // entrance clock (set when visible)

  const linkDist = isMobile ? 132 : 196; // max px distance for a constellation line

  // (Re)initialise physics whenever the review set or container size changes.
  const initPhysics = (w: number, h: number) => {
    const speed = isMobile ? SPEED_MOBILE : SPEED_DESKTOP;
    const sizes = reviews.map((r) => computeBubbleSize(r, isMobile));
    const minS = Math.min(...sizes);
    const maxS = Math.max(...sizes);
    const span = Math.max(1, maxS - minS);

    physicsRef.current = reviews.map((r, i) => {
      const size = sizes[i];
      const seed = hashStr(r.id);
      // Depth from size — bigger bubbles sit "closer" (parallax).
      const depth = (size - minS) / span; // 0..1
      const angle = ((seed % 360) * Math.PI) / 180;
      // Parallax speed: far/small drift slower, near/large faster.
      const spd = speed * (0.42 + depth * 0.95) * (0.82 + ((seed >> 3) % 40) / 100);
      const rnd = (shift: number, mod: number) => ((seed >> shift) % mod) / mod;
      return {
        id: r.id,
        x: Math.max(0, Math.min(w - size, rnd(2, 997) * (w - size))),
        y: Math.max(0, Math.min(h - size, rnd(7, 991) * (h - size))),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size,
        depth,
        opacity: 0.42 + depth * 0.58, // dim background .. bright foreground
        baseZ: 1 + Math.round(depth * 8),
        wobbleAmpX: (5 + rnd(5, 10) * 11) * (0.5 + depth * 0.6),
        wobbleFreqX: 0.00035 + rnd(9, 60) / 90000,
        wobblePhaseX: rnd(11, 628) / 100,
        wobbleAmpY: (5 + rnd(13, 10) * 10) * (0.5 + depth * 0.6),
        wobbleFreqY: 0.0004 + rnd(15, 60) / 80000,
        wobblePhaseY: rnd(17, 628) / 100,
        breathAmp: 0.03 + depth * 0.035,
        breathFreq: 0.0012 + rnd(19, 50) / 60000,
        breathPhase: rnd(21, 628) / 100,
        entranceDelay: i * (isMobile ? 55 : 70),
        hover: 0,
      };
    });
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      const cv = canvasRef.current;
      if (cv) {
        cv.width = Math.round(rect.width * dpr);
        cv.height = Math.round(rect.height * dpr);
        cv.style.width = `${rect.width}px`;
        cv.style.height = `${rect.height}px`;
      }
      initPhysics(rect.width, rect.height);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    // Staggered entrance begins when the field scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && startRef.current == null) {
          startRef.current = performance.now();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    const ctx = canvasRef.current?.getContext("2d") ?? null;
    // Reusable scratch for constellation centers (avoids per-frame allocation).
    const cx: number[] = [];
    const cy: number[] = [];
    const cEnt: number[] = [];

    let last = performance.now();
    const step = (ts: number) => {
      const { w, h, dpr } = sizeRef.current;
      const dt = Math.min(48, ts - last); // clamp so a hidden tab can't teleport
      last = ts;
      const bubbles = physicsRef.current;
      const hoverId = hoverIdRef.current;
      const started = startRef.current != null;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        // integrate linear drift + soft edge-bounce
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const maxX = Math.max(0, w - b.size);
        const maxY = Math.max(0, h - b.size);
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        else if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        else if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }

        // organic wobble offset (doesn't affect bounce bookkeeping)
        const ox = Math.sin(ts * b.wobbleFreqX + b.wobblePhaseX) * b.wobbleAmpX;
        const oy = Math.sin(ts * b.wobbleFreqY + b.wobblePhaseY) * b.wobbleAmpY;
        const drawX = b.x + ox;
        const drawY = b.y + oy;

        // staggered entrance
        const ep = started
          ? Math.max(0, Math.min(1, (ts - (startRef.current as number) - b.entranceDelay) / 620))
          : 0;
        const eEased = easeOutCubic(ep);

        // hover ease toward target
        const target = hoverId === b.id ? 1 : 0;
        b.hover += (target - b.hover) * Math.min(1, dt / 90);

        const breath = 1 + b.breathAmp * Math.sin(ts * b.breathFreq + b.breathPhase);
        const scale = (0.32 + 0.68 * eEased) * breath * (1 + 0.22 * b.hover);

        const node = nodeRefs.current.get(b.id);
        if (node) {
          node.style.transform = `translate3d(${drawX}px, ${drawY}px, 0) scale(${scale.toFixed(3)})`;
          node.style.opacity = (b.opacity * eEased).toFixed(3);
          node.style.zIndex = String(b.hover > 0.02 ? 60 : b.baseZ);
        }

        // record center for the constellation
        const half = b.size / 2;
        cx[i] = drawX + half;
        cy[i] = drawY + half;
        cEnt[i] = eEased;
      }

      // --- constellation: faint lines between nearby bubbles -----------------
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const n = bubbles.length;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = cx[i] - cx[j];
            const dy = cy[i] - cy[j];
            const d2 = dx * dx + dy * dy;
            if (d2 > linkDist * linkDist) continue;
            const d = Math.sqrt(d2);
            const prox = 1 - d / linkDist; // 1 near .. 0 far
            const a = prox * 0.22 * cEnt[i] * cEnt[j];
            if (a < 0.012) continue;
            ctx.strokeStyle = `rgba(168,85,247,${a.toFixed(3)})`;
            ctx.lineWidth = 0.6 + prox * 0.7;
            ctx.beginPath();
            ctx.moveTo(cx[i], cy[i]);
            ctx.lineTo(cx[j], cy[j]);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (rafRef.current == null) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews, isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden h-[80vh] min-h-[520px] max-h-[880px]"
    >
      {/* soft ambient accent glow — no border/box, the field blends into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(45% 40% at 22% 28%, rgba(168,85,247,0.09), transparent 72%), radial-gradient(40% 45% at 80% 68%, rgba(168,85,247,0.07), transparent 72%), radial-gradient(35% 30% at 55% 85%, rgba(168,85,247,0.05), transparent 72%)",
        }}
      />
      {/* constellation layer — thin network lines between nearby bubbles */}
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" />
      {reviews.map((r, i) => {
        const size = computeBubbleSize(r, isMobile);
        const depthBlur = (1 - depthOf(r, reviews, isMobile)) * (isMobile ? 1.0 : 1.5);
        return (
          <button
            key={r.id}
            type="button"
            ref={(el) => {
              if (el) nodeRefs.current.set(r.id, el);
              else nodeRefs.current.delete(r.id);
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const bubbleCx = rect.left + rect.width / 2;
              const bubbleCy = rect.top + rect.height / 2;
              const dx = bubbleCx - window.innerWidth / 2;
              const dy = bubbleCy - window.innerHeight / 2;
              onOpen(r.id, dx, dy);
            }}
            onPointerEnter={() => (hoverIdRef.current = r.id)}
            onPointerLeave={() => {
              if (hoverIdRef.current === r.id) hoverIdRef.current = null;
            }}
            onFocus={() => (hoverIdRef.current = r.id)}
            onBlur={() => {
              if (hoverIdRef.current === r.id) hoverIdRef.current = null;
            }}
            aria-label={`Read the ${r.rating}-star review from ${r.name}`}
            className="group absolute left-0 top-0 cursor-pointer rounded-full opacity-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            style={{ width: size, height: size, willChange: "transform, opacity", zIndex: 1 + i }}
          >
            <span
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full border border-accent/20 bg-neutral-900/55 px-2 py-1.5 text-center shadow-[0_6px_22px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-[box-shadow,border-color,background-color] duration-300 group-hover:border-accent/70 group-hover:bg-neutral-900/90 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              style={depthBlur > 0.05 ? { filter: `blur(${depthBlur.toFixed(2)}px)` } : undefined}
            >
              <Stars rating={r.rating} className="text-[8px] leading-none tracking-tighter" />
              <span className="line-clamp-2 text-[9px] leading-[1.15] text-neutral-300">
                {snippet(r.text, 26)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Depth (0 bg .. 1 fg) for a review relative to the shown set — matches initPhysics. */
function depthOf(r: Review, reviews: Review[], isMobile: boolean): number {
  const sizes = reviews.map((x) => computeBubbleSize(x, isMobile));
  const minS = Math.min(...sizes);
  const maxS = Math.max(...sizes);
  const span = Math.max(1, maxS - minS);
  return (computeBubbleSize(r, isMobile) - minS) / span;
}

// Deterministic bubble pixel size: a small base that varies a little with the
// rating plus a stable per-id jitter. Kept small so the field reads as drifting
// particles. Used for BOTH the physics bounds and the rendered element so
// edge-bounce lines up exactly.
function computeBubbleSize(r: Review, isMobile: boolean): number {
  const base = isMobile ? 46 : 58;
  const ratingBoost = (Math.max(1, Math.min(5, r.rating)) - 3) * (isMobile ? 3 : 5);
  const jitter = ((hashStr(r.id) % 1000) / 1000) * (isMobile ? 22 : 36);
  return Math.round(base + ratingBoost + jitter);
}

// -----------------------------------------------------------------------------
// Reduced-motion fallback: static responsive grid
// -----------------------------------------------------------------------------
function StaticGrid({
  reviews,
  sample,
  onOpen,
}: {
  reviews: Review[];
  sample: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onOpen(r.id)}
          aria-label={`Read the ${r.rating}-star review from ${r.name}`}
          className="group text-left rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Stars rating={r.rating} className="text-sm" />
          <p className="mt-2 line-clamp-4 text-sm text-neutral-200">{r.text}</p>
          <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500">
            {r.name}
            {sample && <span className="ml-2 text-amber-400/80">· sample</span>}
          </p>
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Expanded review dialog (zoom-to-center)
// -----------------------------------------------------------------------------
function ExpandedReview({
  review,
  sample,
  origin,
  reduced,
  onClose,
}: {
  review: Review;
  sample: boolean;
  origin: { dx: number; dy: number } | null;
  reduced: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const prevFocus = useRef<Element | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock background scroll while the dialog is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus();
    };
  }, [onClose]);

  const cardInitial = reduced
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.3, x: origin?.dx ?? 0, y: origin?.dy ?? 0 };
  const cardAnimate = reduced ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 };
  const cardExit = cardInitial;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial="x"
      animate="x"
      exit="x"
    >
      {/* Backdrop — dims the still-drifting field behind. */}
      <motion.div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Review from ${review.name}`}
        initial={cardInitial}
        animate={cardAnimate}
        exit={cardExit}
        transition={
          reduced
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 240, damping: 24, mass: 0.9 }
        }
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-7 md:p-9 shadow-[0_40px_120px_-20px_rgba(168,85,247,0.35),0_30px_80px_rgba(0,0,0,0.6)]"
      >
        {/* subtle top accent hairline */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
        {/* decorative oversized quotation mark */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-5 left-4 select-none font-display text-[7rem] leading-none text-accent/15"
        >
          &ldquo;
        </span>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close review"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/60 text-neutral-400 outline-none transition-colors hover:border-accent/60 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>

        <div className="relative">
          <Stars rating={review.rating} className="text-xl tracking-[0.15em]" />
          <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-neutral-100">
            {review.text}
          </p>
          <div className="mt-7 flex items-center gap-3 border-t border-neutral-800 pt-4 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-display text-sm font-semibold uppercase text-accent-light">
              {initialsOf(review.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-neutral-100">{review.name}</div>
              {review.date && (
                <div className="text-xs text-neutral-500" title={fmtDate(review.date)}>
                  {relativeTime(review.date)}
                </div>
              )}
            </div>
            {sample && (
              <span className="ml-auto shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                sample
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Empty + loading states
// -----------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 px-6 py-20 text-center">
      <div className="mb-3 text-4xl opacity-70">💬</div>
      <h3 className="text-lg font-display font-semibold text-neutral-200">
        No reviews yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Ordered a print or worked with me? Be the first to leave a review — it
        genuinely helps.
      </p>
      <a href="/feedback" className="btn-primary mt-6 text-sm">
        Leave a review →
      </a>
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div
      className="flex h-[80vh] min-h-[520px] max-h-[880px] items-center justify-center rounded-2xl border border-neutral-900 bg-neutral-900/20"
      aria-hidden="true"
    >
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-600">
        loading reviews…
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// utils
// -----------------------------------------------------------------------------
/** 1–2 letter monogram from a name, for the dialog avatar. */
function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "★";
  const first = words[0][0] ?? "";
  const second = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + second).toUpperCase();
}

function snippet(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Tiny stable string hash → deterministic per-review layout/speed/size. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
