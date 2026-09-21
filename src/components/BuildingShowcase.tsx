import { Suspense, useState, useEffect, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./motion/Reveal";
import ThreeErrorBoundary from "./three/ThreeErrorBoundary";
import LoadingScreen from "./three/LoadingScreen";
import { hasWebGL } from "../lib/webgl";

// Lazy-load THE ENTIRE 3D scene module (which itself imports R3F + Three).
// Headless / no-WebGL browsers never download this chunk.
const Scene = lazy(() => import("./three/Scene"));

type ValueKey = "honest" | "fast" | "detail";

const VALUES: Record<ValueKey, { title: string; subtitle: string; body: string }> = {
  honest: {
    title: "Honest",
    subtitle: "No surprises",
    body:
      "If a project won't work the way you're imagining, I tell you up front — not after the invoice. No oversold scope, no surprise overages.",
  },
  fast: {
    title: "Fast",
    subtitle: "Weeks, not quarters",
    body:
      "I ship working software fast — real features in your hands early, so you can iterate from what you actually use.",
  },
  detail: {
    title: "Detail-oriented",
    subtitle: "The finish",
    body:
      "The visual polish, the empty-state copy, the keyboard shortcut nobody asked for. The thing visitors notice but can't name — that's where trust gets built.",
  },
};

const VALUE_KEYS: ValueKey[] = ["honest", "fast", "detail"];

// Each value maps to a RobotExpressive animation clip the robot performs.
const POSE: Record<ValueKey, string> = {
  honest: "Yes", // a sincere nod
  fast: "Running", // literal speed
  detail: "ThumbsUp", // approval / the finish
};

function StaticFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-8">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4 opacity-30">🤖</div>
        <p className="text-sm text-neutral-400">
          The interactive 3D scene needs WebGL — your browser doesn't have it (or it's disabled).
          The values hold anyway:
          <span className="text-neutral-200"> Honest</span>,
          <span className="text-neutral-200"> Fast</span>,
          <span className="text-neutral-200"> Detail-oriented</span>.
        </p>
      </div>
    </div>
  );
}

export default function BuildingShowcase() {
  // `pinned` is the sticky selection (chip click / arrows); `hovered` is a
  // transient preview. The visible value is hover-preview over the pinned one.
  const [pinned, setPinned] = useState<ValueKey | null>(null);
  const [hovered, setHovered] = useState<ValueKey | null>(null);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const active = hovered ?? pinned;
  const activeContent = active ? VALUES[active] : null;

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  // Step through the values with the arrows (wraps around).
  const step = (dir: 1 | -1) => {
    const i = active ? VALUE_KEYS.indexOf(active) : dir === 1 ? -1 : 0;
    const next = VALUE_KEYS[(i + dir + VALUE_KEYS.length) % VALUE_KEYS.length];
    setHovered(null);
    setPinned(next);
  };

  return (
    <section className="py-20 md:py-28 border-t border-neutral-900 relative overflow-hidden">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="section-eyebrow mb-2">How I work</p>
              <h2 className="text-3xl md:text-4xl font-bold">Three things, every build.</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-md">
                Pick a value — the robot reacts. Hover the chips, or step through with
                the arrows. This is what every project gets, no matter the size.
              </p>
            </div>
          </div>
        </Reveal>

        <div
          role="img"
          aria-label="Animated 3D robot — the centerpiece of an AI-focused dev studio. Three values define the work: honest, fast, and detail-oriented."
          className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 h-[520px] md:h-[640px]"
        >
          {webglOk === false ? (
            <StaticFallback />
          ) : webglOk === null ? (
            <LoadingScreen />
          ) : (
            <ThreeErrorBoundary fallback={<StaticFallback />}>
              <Suspense fallback={<LoadingScreen />}>
                <Scene pose={active ? POSE[active] : null} />
              </Suspense>
            </ThreeErrorBoundary>
          )}

          {/* Value tooltip overlay */}
          <AnimatePresence mode="wait">
            {activeContent && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute bottom-6 left-6 right-6 md:left-6 md:right-auto md:max-w-md pointer-events-none"
              >
                <div className="bg-neutral-950/90 backdrop-blur border border-accent/40 rounded-xl p-5 shadow-2xl shadow-black/60">
                  <p className="text-xs uppercase tracking-wider text-accent font-semibold">
                    {activeContent.subtitle}
                  </p>
                  <h3 className="text-2xl font-display font-bold mt-1 mb-2">{activeContent.title}</h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">{activeContent.body}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!activeContent && webglOk && (
            <div className="absolute bottom-6 left-6 text-xs text-neutral-500 font-mono pointer-events-none">
              select a value ↗
            </div>
          )}

          {/* Value chips — hover / focus / tap to reveal each value. */}
          <div
            role="group"
            aria-label="Select a value to learn about"
            className="absolute top-4 right-4 flex gap-2 text-[10px] uppercase tracking-wider"
          >
            {VALUE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onMouseEnter={() => setHovered(key)}
                onFocus={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned(pinned === key ? null : key)}
                aria-pressed={active === key}
                aria-label={`${VALUES[key].title} — ${VALUES[key].subtitle}`}
                className={`px-2 py-1 rounded border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
                  active === key
                    ? "bg-accent text-white border-accent"
                    : "bg-neutral-900/60 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                }`}
              >
                {VALUES[key].title}
              </button>
            ))}
          </div>

          {/* Arrow nav — step the robot through each value. */}
          {webglOk && (
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous value"
                className="grid place-items-center h-9 w-9 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300 hover:text-white hover:border-accent/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ‹
              </button>
              <div className="flex items-center gap-1.5" aria-hidden>
                {VALUE_KEYS.map((key) => (
                  <span
                    key={key}
                    className={`h-1.5 rounded-full transition-all ${
                      active === key ? "w-5 bg-accent" : "w-1.5 bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next value"
                className="grid place-items-center h-9 w-9 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300 hover:text-white hover:border-accent/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
