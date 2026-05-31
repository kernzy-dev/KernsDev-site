import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Eagle-eye camera descent. Starts high above the scene looking straight down,
 * then animates over ~2.5s to a cinematic 3/4 view.
 *
 * Respects prefers-reduced-motion: skips the descent entirely (camera snaps to
 * final position) and disables mouse-driven parallax.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const reduced = useReducedMotion();
  const startTime = useRef<number | null>(null);
  const startPos = useRef(new THREE.Vector3(0, 30, 0.1));
  const endPos = useRef(new THREE.Vector3(11, 7, 14));
  const lookAt = useRef(new THREE.Vector3(0, 2.2, 0));

  useEffect(() => {
    // If reduced motion is on, snap to the final cinematic angle immediately.
    // Otherwise, start high above and let useFrame animate down.
    camera.position.copy(reduced ? endPos.current : startPos.current);
    camera.lookAt(lookAt.current);
  }, [camera, reduced]);

  useFrame((state) => {
    if (reduced) {
      // Reduced motion: hold camera still at endPos — no descent, no parallax bob.
      camera.position.copy(endPos.current);
      camera.lookAt(lookAt.current);
      return;
    }

    if (startTime.current === null) startTime.current = state.clock.getElapsedTime();
    const elapsed = state.clock.getElapsedTime() - startTime.current;
    const DURATION = 5.0;  // longer, more cinematic descent
    const t = Math.min(elapsed / DURATION, 1);

    // ease-in-out cubic — slow start, slow end, smooth glide in the middle
    const e = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos.current, endPos.current, e);

    // Subtle ongoing parallax after descent — gentle bob + drift driven by mouse
    if (t >= 1) {
      const mx = state.pointer.x;
      const my = state.pointer.y;
      const bob = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.08;
      camera.position.x = endPos.current.x + mx * 0.6;
      camera.position.y = endPos.current.y + my * 0.3 + bob;
    }

    camera.lookAt(lookAt.current);
  });

  return null;
}
