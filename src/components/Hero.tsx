import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import Magnetic from "./motion/Magnetic";
import { hasWebGL } from "../lib/webgl";

// Immersive 3D hero scene — its own chunk (pulls in R3F/Three), only fetched
// when WebGL is present.
const HeroScene = lazy(() => import("./HeroScene"));

// The three values — pick one and the hero robot performs the matching pose.
type ValueKey = "honest" | "fast" | "detail";
const VALUES: Record<ValueKey, { title: string; blurb: string }> = {
  honest: { title: "Honest", blurb: "If it won't work the way you're picturing, I tell you up front — not after the invoice." },
  fast: { title: "Fast", blurb: "Working software in weeks, not quarters — real features in your hands early." },
  detail: { title: "Detail-oriented", blurb: "The polish, the empty states, the thing visitors notice but can't name." },
};
const VALUE_KEYS: ValueKey[] = ["honest", "fast", "detail"];
// value → RobotExpressive clip the hero robot plays.
const POSE: Record<ValueKey, string> = { honest: "Yes", fast: "Running", detail: "ThumbsUp" };

export default function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [webglOk, setWebglOk] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Disable parallax + mesh scale when reduced-motion is set.
  const textY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], reduced ? [1, 1] : [1, 0]);
  const meshScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.4]);
  // Fade the 3D scene out slightly as the hero scrolls away.
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  // Value interaction: hover previews, click/arrows pin. Active value → robot pose.
  const [pinned, setPinned] = useState<ValueKey | null>(null);
  const [hovered, setHovered] = useState<ValueKey | null>(null);
  const active = hovered ?? pinned;
  const step = (dir: 1 | -1) => {
    const i = active ? VALUE_KEYS.indexOf(active) : dir === 1 ? -1 : 0;
    setHovered(null);
    setPinned(VALUE_KEYS[(i + dir + VALUE_KEYS.length) % VALUE_KEYS.length]);
  };

  // Only mount the 3D scene when the browser can actually render it.
  useEffect(() => {
    if (!reduced) setWebglOk(hasWebGL());
  }, [reduced]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative min-h-screen flex flex-col justify-start pt-28 md:pt-36 pb-24 overflow-hidden"
    >
      {/* Immersive 3D robot — full-bleed behind the copy. */}
      {webglOk && (
        <motion.div style={{ opacity: sceneOpacity }} className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <HeroScene progress={scrollYProgress} pose={active ? POSE[active] : null} />
          </Suspense>
        </motion.div>
      )}
      {/* Legibility scrim — darken top + bottom, let the robot read through the middle. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,8,15,0.72) 0%, rgba(8,8,15,0.20) 40%, rgba(8,8,15,0.12) 62%, rgba(8,8,15,0.88) 100%)",
        }}
      />
      {/* Layered animated background — multiple offset gradients on slow loops + subtle grid */}
      <motion.div
        style={{ scale: meshScale }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* Mesh blob 1 — animated drift, disabled when reduced-motion is on */}
        <motion.div
          animate={reduced ? undefined : {
            x: [0, 60, -40, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[25%] w-[40rem] h-[40rem] bg-accent/20 blur-3xl rounded-full"
        />
        <motion.div
          animate={reduced ? undefined : {
            x: [0, -50, 30, 0],
            y: [0, 50, -20, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[15%] w-[36rem] h-[36rem] bg-fuchsia-700/20 blur-3xl rounded-full"
        />
        <motion.div
          animate={reduced ? undefined : {
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
          }}
          transition={reduced ? undefined : { duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[5%] left-[10%] w-[32rem] h-[32rem] bg-violet-700/15 blur-3xl rounded-full"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
          }}
        />
      </motion.div>

      <div className="container-tight w-full relative z-[2]">
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-eyebrow mb-4"
          >
            AI Solutions &amp; Automation Consultant · Somerset, KY
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
          >
            I build the AI-driven software<br className="hidden md:block" />{" "}
            <span className="text-accent">you can't buy off the shelf.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto"
          >
            Somerset, KY–based AI solutions &amp; automation consultant — custom AI systems, agents,
            and software for Kentucky businesses (and clients anywhere) who need something specific.
            Built fast, honest, and detail-oriented.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Magnetic radius={90} strength={0.28}>
              <a href="#contact" className="btn-primary">
                Book a call →
              </a>
            </Magnetic>
            <Magnetic radius={90} strength={0.28}>
              <a href="#running" className="btn-ghost">
                See what's running
              </a>
            </Magnetic>
          </motion.div>

          {/* Interactive values — pick one and the robot above reacts. */}
          <div className="mt-12">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              What every build gets
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Previous value"
                onClick={() => step(-1)}
                className="grid place-items-center h-8 w-8 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-accent/60 transition-colors"
              >
                ‹
              </button>
              {VALUE_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(key)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setPinned(pinned === key ? null : key)}
                  aria-pressed={active === key}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    active === key
                      ? "bg-accent text-white border-accent"
                      : "bg-neutral-900/50 text-neutral-300 border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {VALUES[key].title}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next value"
                onClick={() => step(1)}
                className="grid place-items-center h-8 w-8 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-accent/60 transition-colors"
              >
                ›
              </button>
            </div>
            {/* caption — fixed height so the layout doesn't jump */}
            <div className="h-12 mt-4">
              <AnimatePresence mode="wait">
                {active && (
                  <motion.p
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-neutral-400 max-w-lg mx-auto"
                  >
                    {VALUES[active].blurb}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Subtle scroll cue — bouncing arrow, static when reduced-motion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: [0, 8, 0] }}
          transition={reduced
            ? { opacity: { delay: 1.5, duration: 0.8 } }
            : { opacity: { delay: 1.5, duration: 0.8 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 text-xs tracking-wider"
        >
          ↓ scroll
        </motion.div>
      </div>
    </section>
  );
}
