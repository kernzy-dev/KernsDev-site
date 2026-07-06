import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ThreeErrorBoundary from "../three/ThreeErrorBoundary";
import LoadingScreen from "../three/LoadingScreen";
import BootScene from "./BootScene";
import MatrixWarp from "./MatrixWarp";
import useReducedMotion from "../../hooks/useReducedMotion";
import Fallback2D from "./Fallback2D";
import WorldHUD from "./WorldHUD";
import { PALETTE } from "./worldData";
import { hasWebGL } from "../../lib/webgl";

gsap.registerPlugin(ScrollTrigger);

const CaveScene = lazy(() => import("./CaveScene"));

/**
 * Phase state machine (R28):
 *   'boot' → BootSequence terminal overlay (R26; R29 will replace with a
 *            3D bash/terminal loader inside the Canvas)
 *   'warp' → MatrixWarp overlay (R28 placeholder; R29 will render Matrix
 *            glyph rain → hyperspace tunnel)
 *   'cave' → CaveScene visible (R28 interim = NOCTURNE contents; R31
 *            rebuilds as the immersive cave interior)
 */
type Phase = "boot" | "warp" | "cave";

/**
 * Top-level of the NOCTURNE /world experience.
 *
 * Layout:
 *   - Fixed-position Canvas (fills viewport, doesn't scroll)
 *   - Tall invisible scroll rail (500vh) so the page has scrollable content;
 *     ScrollTrigger reads its progress and drives the camera along a
 *     Catmull-Rom curve through the CHAPTERS.
 *   - Fixed curtain overlay — GSAP fades it from void→transparent during intro
 *   - Fixed HUD chrome — chapter indicator, escape link, watermark. No navbar.
 *
 * Progress is stored in a mutable ref updated per-frame by ScrollTrigger; a
 * separate rAF loop mirrors it into React state ~15Hz for HUD reactivity so
 * we don't churn React state per scroll event.
 */
export default function WorldExperience() {
  const reducedMotion = useReducedMotion();
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  // `?skipintro=1` skips the intro animation entirely (used by the
  // capture script so screenshots don't hinge on GSAP timing / Suspense
  // race). Deterministic first frame → deterministic screenshot.
  const [skipIntro] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("skipintro") === "1",
  );
  // R28: 3-phase state machine boot → warp → cave. `skipIntro` jumps
  // straight to cave (capture/debug). ScrollCamera's `intro` freeze
  // stays on until we hit 'cave' so the camera doesn't wander while
  // the boot text or warp is playing.
  const [phase, setPhase] = useState<Phase>(skipIntro ? "cave" : "boot");
  const intro = phase !== "cave";
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressRef = useRef(0);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  // ?debug=1 flips on the perf overlay (StatsGl) so Grant's craft-bar review
  // has fps/ms/draw-call numbers. Captured once via useState initializer —
  // pathname/query stable in this no-router SPA (same pattern as isWorld in App).
  const [debug] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1",
  );

  // Skip-intro: hide the curtain immediately so it doesn't sit opaque over
  // the scene. IntroCurtain won't even mount (WorldScene sees intro=false).
  useEffect(() => {
    if (skipIntro && curtainRef.current) {
      curtainRef.current.style.opacity = "0";
    }
  }, [skipIntro]);

  // Lenis smooth scroll (Grant R25 ask) — drives native scroll on a rAF
  // loop with eased damping, killing the "choppy/unreliable" jank he
  // flagged in the review. ScrollTrigger.update on every Lenis frame
  // keeps the camera path perfectly in sync with the eased position.
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.15, // seconds of ease-out on each wheel tick
      lerp: 0.09, // damping — lower = smoother, more inertia
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Programmatic scroll — used by the HUD's clickable chapter nav to fly
  // the visitor to a specific chapter's keyframe. Uses Lenis if available
  // (smooth eased scroll) or falls back to native scrollTo.
  const scrollToChapter = useCallback((chapterProgress: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max * chapterProgress;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.6 });
    } else {
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  // Mirror the ref → state ~15Hz so the HUD's chapter reactivity works without
  // fighting per-scroll setState churn. rAF-throttled naturally.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      // ~15Hz — the HUD label switch doesn't need higher fidelity
      if (t - last >= 66) {
        last = t;
        const p = progressRef.current;
        setScrollProgress((prev) => (Math.abs(prev - p) > 0.001 ? p : prev));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Meta chrome — title only. We DELIBERATELY don't lock body overflow (the
  // page needs to scroll for ScrollTrigger to have progress to read).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "KernsDev · nocturne";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  if (webglOk === false) return <Fallback2D />;

  return (
    <div className="bg-neutral-950 text-neutral-100" style={{ background: PALETTE.void }}>
      {/* Canvas — fixed viewport, doesn't scroll. Mounts under the boot
          overlay so it starts loading immediately — fixes R26's
          "opens black" complaint. */}
      <div className="fixed inset-0 z-0">
        {webglOk === null ? (
          <LoadingScreen />
        ) : (
          <ThreeErrorBoundary fallback={<Fallback2D />}>
            <Suspense fallback={<LoadingScreen />}>
              <CaveScene
                progressRef={progressRef}
                scrollProgress={scrollProgress}
                scrollRoot={scrollRoot}
                curtainRef={curtainRef}
                intro={intro}
                reducedMotion={reducedMotion}
                debug={debug}
              />
            </Suspense>
          </ThreeErrorBoundary>
        )}
      </div>

      {/* R30 phase: boot → warp → cave. BootScene is a 3D CRT terminal
          inside its own R3F Canvas (replaces R26's 2D DOM overlay).
          MatrixWarp is R29's 2D-canvas Matrix rain → hyperspace visual.
          Both sit on top of the fixed CaveScene canvas so it can load
          under them — the "opens black" fix is preserved. */}
      {phase === "boot" && (
        <BootScene onDone={() => setPhase("warp")} />
      )}
      {phase === "warp" && (
        <MatrixWarp onDone={() => setPhase("cave")} />
      )}

      {/* Legacy curtain kept as an invisible passthrough (IntroCurtain in
          WorldScene still writes to it via ref — one-liner keeps that
          contract without visual effect). */}
      <div
        ref={curtainRef}
        className="fixed inset-0 z-20 pointer-events-none"
        style={{ opacity: 0 }}
        aria-hidden
      />

      {/* HUD — chapter indicator (CLICKABLE nav per R25), label, escape */}
      <WorldHUD
        scrollProgress={scrollProgress}
        intro={intro}
        debug={debug}
        onChapterClick={scrollToChapter}
      />

      {/* Scroll rail — the only tall element on the page. ScrollTrigger reads
          document scroll against this element's start/end. Empty; the visual
          world is the fixed canvas above. */}
      <div
        ref={scrollRoot}
        style={{ height: reducedMotion ? "100vh" : "500vh" }}
        aria-hidden
      />
    </div>
  );
}
