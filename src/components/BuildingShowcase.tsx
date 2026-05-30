import { Suspense, useState, useEffect, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./motion/Reveal";
import ThreeErrorBoundary from "./three/ThreeErrorBoundary";
import type { BuildingPart } from "./three/Building";

// Lazy-load THE ENTIRE 3D scene module (which itself imports R3F + Three).
// Headless / no-WebGL browsers never download this chunk.
const Scene = lazy(() => import("./three/Scene"));

const VALUES: Record<Exclude<BuildingPart, null>, { title: string; subtitle: string; body: string }> = {
  foundation: {
    title: "Honest",
    subtitle: "The foundation",
    body:
      "If a project won't work the way you're imagining, I tell you up front — not after the invoice. No oversold scope, no surprise overages.",
  },
  walls: {
    title: "Fast",
    subtitle: "The structure",
    body:
      "I ship working software in weeks, not quarters. Real features get into your hands early so you can iterate from what you actually use.",
  },
  roof: {
    title: "Detail-oriented",
    subtitle: "The finish",
    body:
      "The visual polish, the empty-state copy, the keyboard shortcut nobody asked for. The thing visitors notice but can't name — that's where trust gets built.",
  },
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      (canvas.getContext as any)("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

function StaticFallback({ active }: { active: BuildingPart }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-8">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4 opacity-30">🏗</div>
        <p className="text-sm text-neutral-400">
          The interactive 3D scene needs WebGL — your browser doesn't have it (or it's disabled).
          The values map cleanly anyway: <span className="text-neutral-200">Foundation = Honest</span>,
          <span className="text-neutral-200"> Walls = Fast</span>,
          <span className="text-neutral-200"> Roof = Detail-oriented</span>.
        </p>
        {active && (
          <p className="mt-4 text-xs text-accent">
            (Currently focused: {active})
          </p>
        )}
      </div>
    </div>
  );
}

export default function BuildingShowcase() {
  const [active, setActive] = useState<BuildingPart>(null);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const activeContent = active ? VALUES[active] : null;

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  return (
    <section className="py-20 md:py-28 border-t border-neutral-900 relative overflow-hidden">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="section-eyebrow mb-2">How I work</p>
              <h2 className="text-3xl md:text-4xl font-bold">A build, broken down.</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-md">
                Hover any part of the building. Each one is a value I bring to the work.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 h-[520px] md:h-[640px]">
          {webglOk === false ? (
            <StaticFallback active={active} />
          ) : webglOk === null ? (
            <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
              Loading the scene…
            </div>
          ) : (
            <ThreeErrorBoundary fallback={<StaticFallback active={active} />}>
              <Suspense fallback={
                <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
                  Loading the scene…
                </div>
              }>
                <Scene active={active} setActive={setActive} />
              </Suspense>
            </ThreeErrorBoundary>
          )}

          {/* Hover tooltip overlay */}
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
              ↑ hover any part
            </div>
          )}

          <div className="absolute top-4 right-4 flex gap-2 text-[10px] uppercase tracking-wider pointer-events-none">
            {(["foundation", "walls", "roof"] as const).map((part) => (
              <div
                key={part}
                className={`px-2 py-1 rounded border transition-colors ${
                  active === part
                    ? "bg-accent text-white border-accent"
                    : "bg-neutral-900/60 text-neutral-500 border-neutral-800"
                }`}
              >
                {VALUES[part].title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
