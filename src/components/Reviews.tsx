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

type BubblePhysics = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
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
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const physicsRef = useRef<BubblePhysics[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // (Re)initialise physics whenever the review set or container size changes.
  const initPhysics = (w: number, h: number) => {
    const speed = isMobile ? SPEED_MOBILE : SPEED_DESKTOP;
    physicsRef.current = reviews.map((r) => {
      const size = computeBubbleSize(r, isMobile);
      const seed = hashStr(r.id);
      const angle = ((seed % 360) * Math.PI) / 180;
      const spd = speed * (0.55 + ((seed >> 3) % 100) / 100); // varied speeds
      return {
        id: r.id,
        x: Math.max(0, Math.min(w - size, ((seed % 997) / 997) * (w - size))),
        y: Math.max(0, Math.min(h - size, (((seed >> 5) % 991) / 991) * (h - size))),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size,
      };
    });
    // Paint an initial frame so bubbles don't flash at (0,0).
    for (const b of physicsRef.current) {
      const el = nodeRefs.current.get(b.id);
      if (el) el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
    }
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      initPhysics(rect.width, rect.height);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let last = performance.now();
    const step = (ts: number) => {
      const { w, h } = sizeRef.current;
      // Clamp delta so a backgrounded tab doesn't teleport bubbles on return.
      const dt = Math.min(48, ts - last);
      last = ts;
      for (const b of physicsRef.current) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const maxX = Math.max(0, w - b.size);
        const maxY = Math.max(0, h - b.size);
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        else if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        else if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }
        const node = nodeRefs.current.get(b.id);
        if (node) node.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
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
      {reviews.map((r) => (
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
          aria-label={`Read the ${r.rating}-star review from ${r.name}`}
          className="group absolute left-0 top-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          style={{
            width: computeBubbleSize(r, isMobile),
            height: computeBubbleSize(r, isMobile),
            willChange: "transform",
          }}
        >
          <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full border border-accent/20 bg-neutral-900/55 px-2 py-1.5 text-center shadow-[0_6px_22px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-accent/70 group-hover:bg-neutral-900/90">
            <Stars rating={r.rating} className="text-[8px] leading-none tracking-tighter" />
            <span className="line-clamp-2 text-[9px] leading-[1.15] text-neutral-300">
              {snippet(r.text, 26)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
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
        className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
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
        transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 26 }}
        className="relative w-full max-w-lg rounded-2xl border border-accent/30 bg-neutral-900 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close review"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 outline-none transition-colors hover:border-accent/60 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>

        <Stars rating={review.rating} className="text-xl" />
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-neutral-100">
          {review.text}
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm">
          <span className="font-semibold text-neutral-200">{review.name}</span>
          {review.date && <span className="text-neutral-500">· {fmtDate(review.date)}</span>}
          {sample && (
            <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-300">
              sample
            </span>
          )}
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
