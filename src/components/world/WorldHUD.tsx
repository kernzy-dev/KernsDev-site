import { AnimatePresence, motion } from "framer-motion";
import { CHAPTERS, type Chapter } from "./worldData";

type Props = {
  /** [0,1] scroll progress — same source as the camera. */
  scrollProgress: number;
  intro: boolean;
  debug?: boolean;
  /** Called when a chapter dash is clicked — jumps the visitor there. */
  onChapterClick?: (progress: number) => void;
};

/**
 * Minimal HUD chrome. Per ART_DIRECTION.md there is NO static navbar — the
 * only always-visible affordances are:
 *   - a tiny "escape home" corner link so a lost visitor can get back to /
 *   - a live chapter indicator that materializes IN the flow (right side)
 *   - a prototype watermark
 *
 * The chapter indicator IS the emergent-nav seed: labels animate in when the
 * scroll crosses their chapter window, and animate out when it leaves. This is
 * the primary way the visitor knows where they are in the flow.
 */
export default function WorldHUD({ scrollProgress, intro, debug, onChapterClick }: Props) {
  const active = activeChapter(scrollProgress);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* Corner escape — small, low-contrast, always available */}
      <a
        href="/"
        className="pointer-events-auto absolute top-6 left-6 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-100 transition-colors"
        style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
      >
        ← kernsdev.com
      </a>

      {/* Emergent nav — right-side chapter list. Only visible after intro. */}
      <AnimatePresence>
        {!intro && (
          <motion.nav
            key="chapters"
            aria-label="Chapters"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-4"
          >
            {CHAPTERS.map((c) => {
              const state = chapterState(c, scrollProgress);
              const clickable = !!onChapterClick;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChapterClick?.(c.progress)}
                  disabled={!clickable}
                  className={`pointer-events-auto group flex items-center gap-3 text-left ${
                    clickable ? "cursor-pointer" : "cursor-default"
                  }`}
                  aria-current={state === "active" ? "true" : undefined}
                  aria-label={`Jump to ${c.label}`}
                >
                  <motion.span
                    animate={{
                      width: state === "active" ? 34 : 14,
                      opacity: state === "past" || state === "active" ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-px block group-hover:opacity-100"
                    style={{
                      background:
                        state === "active"
                          ? "linear-gradient(90deg, transparent, #35E7E0)"
                          : "#4b5563",
                    }}
                  />
                  <motion.span
                    animate={{
                      opacity: state === "upcoming" ? 0.5 : 1,
                      color: state === "active" ? "#E8ECF4" : "#6b7280",
                    }}
                    transition={{ duration: 0.4 }}
                    className="text-[10px] font-mono uppercase tracking-[0.22em] group-hover:text-neutral-200 transition-colors"
                  >
                    {c.label}
                  </motion.span>
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Live chapter label — bottom-left, big display type */}
      <AnimatePresence mode="wait">
        {!intro && active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute bottom-8 left-6 md:left-10"
          >
            <p
              className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-500 mb-1"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
            >
              {active.eyebrow}
            </p>
            <h2
              className="font-display font-bold text-3xl md:text-5xl text-neutral-100"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
            >
              {active.label}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll cue — visible only near the start */}
      <AnimatePresence>
        {!intro && scrollProgress < 0.08 && (
          <motion.div
            key="scroll-cue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-mono uppercase tracking-[0.28em] text-neutral-500"
          >
            scroll to flow
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="absolute bottom-3 right-4 text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
        nocturne · v1 milestone 1
        {debug && (
          <span className="ml-2" style={{ color: "#35E7E0" }}>
            · debug on
          </span>
        )}
      </div>

      {/* Debug live-progress readout — bottom-center, only when ?debug=1 */}
      {debug && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-neutral-500 tabular-nums"
          style={{ color: "#35E7E0" }}
        >
          scroll {scrollProgress.toFixed(3)}
        </div>
      )}
    </div>
  );
}

function activeChapter(p: number): Chapter {
  // Which chapter is the visitor currently arriving at? Use each chapter's
  // progress marker as its "peak" and find the closest one within a window.
  let best = CHAPTERS[0];
  let bestD = Infinity;
  for (const c of CHAPTERS) {
    const d = Math.abs(c.progress - p);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function chapterState(c: Chapter, p: number): "past" | "active" | "upcoming" {
  // Active window is +/- 0.12 around the chapter's peak — a fifth of the flow
  const half = 0.12;
  if (Math.abs(p - c.progress) <= half) return "active";
  if (p > c.progress) return "past";
  return "upcoming";
}
