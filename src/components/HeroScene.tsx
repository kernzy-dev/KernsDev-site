import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense } from "react";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import Robot from "./three/Robot";

/**
 * Immersive, scroll-driven hero scene — the robot full-bleed behind the copy.
 * The camera dollies up/back as you scroll the hero away, so the robot "hands
 * off" to the page. Self-contained lighting (no network HDRI) + a transparent
 * canvas so the page's gradient reads through. Prototype for the 3D-forward
 * redesign; only mounts when WebGL is available.
 */

function ScrollRig({ progress }: { progress: MotionValue<number> }) {
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  useFrame(({ camera }) => {
    const p = progress.get(); // 0 (top) → 1 (scrolled past hero)
    // Pulled back + aimed at the robot's mid so the FULL figure (head included)
    // fits with headroom on any aspect ratio. Eases up + back as you scroll away.
    target.set(0, 2.2 + p * 3.0, 9.4 + p * 4.2);
    camera.position.lerp(target, 0.08);
    look.set(0, 1.3 + p * 0.55, 0);
    camera.lookAt(look);
  });
  return null;
}

export default function HeroScene({
  progress,
  pose,
}: {
  progress: MotionValue<number>;
  pose?: string | null;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 2.2, 9.4] }}
    >
      <hemisphereLight args={["#cdd6ff", "#0a0a12", 0.6]} />
      <ambientLight intensity={0.3} color="#dfe6ff" />
      <directionalLight
        position={[6, 11, 6]}
        intensity={2.3}
        color="#ffe6c0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-7, 5, -4]} intensity={0.5} color="#a0c8ff" />
      {/* Brand-violet rims */}
      <pointLight position={[5, 1.8, 4.5]} intensity={1.5} distance={16} color="#a855f7" decay={1.6} />
      <pointLight position={[-6, 3, -5]} intensity={0.9} distance={13} color="#8b5cf6" decay={1.6} />

      <Suspense fallback={null}>
        <Robot pose={pose} />
      </Suspense>

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.5}
        scale={16}
        blur={2.6}
        far={4}
        resolution={1024}
        color="#000000"
      />
      <ScrollRig progress={progress} />
    </Canvas>
  );
}
