import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { CHAPTERS, buildCameraCurve, buildLookAtCurve } from "./worldData";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  /** Progress ref shared with the rest of the scene (monolith rise, etc.) */
  progressRef: MutableRefObject<number>;
  /**
   * Freezes the scroll-driven camera while true (intro animation is running).
   * When it flips to false the ScrollTrigger takes over.
   */
  frozen: boolean;
  /** DOM element the ScrollTrigger reads scroll against (the tall scroll rail). */
  scrollRoot: RefObject<HTMLElement>;
  /** Respect reduced-motion: skip ScrollTrigger, park camera at arrival. */
  reducedMotion: boolean;
};

/**
 * Scroll-choreographed camera flight.
 *
 * The visitor's scroll drives a normalized progress in [0,1]; we sample two
 * Catmull-Rom curves (position + lookAt) built from the CHAPTERS array in
 * `worldData.ts`. The camera glides along both curves — no discrete cuts.
 *
 * The intro animation runs first (owned by WorldExperience); this component
 * respects a `frozen` flag and hands over control to ScrollTrigger when the
 * intro finishes.
 */
export default function ScrollCamera({
  progressRef,
  frozen,
  scrollRoot,
  reducedMotion,
}: Props) {
  const { camera } = useThree();
  const cameraCurve = useMemo(buildCameraCurve, []);
  const lookAtCurve = useMemo(buildLookAtCurve, []);
  const lookAtVec = useRef(new THREE.Vector3());
  const posVec = useRef(new THREE.Vector3());

  // Remap scroll progress → Catmull-Rom curve `t` so that a chapter's declared
  // `progress` marker actually lands at that chapter's control point.
  //
  // The Catmull-Rom curve is uniformly parameterized: with N points, control
  // point i lives at t = i/(N-1). Chapter progress markers aren't uniform
  // (e.g., [0, 0.5, 0.75, 1] — heavier flow into the workshop reveal). Without
  // this remap, `scroll=0.5` samples the midpoint of the curve, which is
  // between the workshop and field control points, not AT the workshop.
  const progressToT = useMemo(() => {
    return (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      for (let i = 0; i < CHAPTERS.length - 1; i++) {
        const a = CHAPTERS[i].progress;
        const b = CHAPTERS[i + 1].progress;
        if (clamped <= b) {
          const chunk = b > a ? (clamped - a) / (b - a) : 0;
          return (i + chunk) / (CHAPTERS.length - 1);
        }
      }
      return 1;
    };
  }, []);

  // Wire ScrollTrigger to write into the shared progress ref.
  useEffect(() => {
    if (reducedMotion) {
      progressRef.current = 0;
      return;
    }
    const el = scrollRoot.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    return () => {
      trigger.kill();
    };
  }, [scrollRoot, progressRef, reducedMotion]);

  useFrame(() => {
    if (frozen) return; // intro owns the camera
    const t = progressToT(progressRef.current);
    cameraCurve.getPoint(t, posVec.current);
    lookAtCurve.getPoint(t, lookAtVec.current);
    // Damped follow so scrub jitter smooths out
    camera.position.lerp(posVec.current, 0.18);
    camera.lookAt(lookAtVec.current);
  });

  return null;
}
