import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ThreeErrorBoundary from "../three/ThreeErrorBoundary";
import LoadingScreen from "../three/LoadingScreen";
import PixelFall from "./PixelFall";
import useReducedMotion from "../../hooks/useReducedMotion";
import Fallback2D from "./Fallback2D";
import WorldHUD from "./WorldHUD";
import { PALETTE } from "./worldData";
import { hasWebGL } from "../../lib/webgl";

gsap.registerPlugin(ScrollTrigger);

const CaveScene = lazy(() => import("./CaveScene"));

/**
 * R32 — Vertical tunnel descent.
 *
 * The visitor scrolls straight down through Grant's world. The art
 * style morphs as they descend:
 *   0.00 - 0.35   PIXEL FALL — 2D pixel-art sprites (Grant's projects)
 *                 tumble in from above; layer fades on scroll.
 *   0.35 - 0.75   CAVERN — living 3D cavern (drawn under the pixel
 *                 layer from the start so the 2D→3D crossfade is a
 *                 pure alpha morph, not a hard cut).
 *   0.75 - 1.00   DUNGEON — deeper stage; palette/lighting shift, real
 *                 projects laid out as spatial "loot". (R33+ — currently
 *                 the cavern continues to the bottom of the scroll rail.)
 *
 * No phase state machine — everything is a function of the shared
 * `scrollProgress` ref/state written by ScrollTrigger.
 */

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
  // R32: no phase state machine — scroll drives everything. Keeping
  // `intro` as a name for the "camera locked until user has scrolled a
  // hair" idea, but it's now just derived from scroll position (with
  // ?skipintro=1 forcing false).
  const intro = false;
  void skipIntro; // reserved for future — currently harmless.
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

      {/* R32: PixelFall — 2D pixel-art fall-in. Renders from t=0, fades
          on scroll progress. The 3D CaveScene renders under it so the
          2D→3D crossfade is a pure alpha morph. */}
      <PixelFall scrollProgress={scrollProgress} />

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
