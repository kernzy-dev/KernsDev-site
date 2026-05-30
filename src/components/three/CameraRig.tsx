import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Eagle-eye camera descent. Starts high above the scene looking straight down,
 * then animates over ~2.5s to a cinematic 3/4 view.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);
  const startPos = useRef(new THREE.Vector3(0, 22, 0.1));
  const endPos = useRef(new THREE.Vector3(7, 5.5, 9));
  const lookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  useEffect(() => {
    camera.position.copy(startPos.current);
    camera.lookAt(lookAt.current);
  }, [camera]);

  useFrame((state) => {
    if (startTime.current === null) startTime.current = state.clock.getElapsedTime();
    const elapsed = state.clock.getElapsedTime() - startTime.current;
    const DURATION = 2.5;
    const t = Math.min(elapsed / DURATION, 1);

    // ease-out cubic
    const e = 1 - Math.pow(1 - t, 3);

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
