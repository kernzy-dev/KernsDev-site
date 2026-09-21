import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// CC0 "RobotExpressive" by Tomás Laulhé (via three.js examples) — the AI/tech
// centerpiece. Preload so the descent + model arrive together.
const MODEL = "/models/robot.glb";
useGLTF.preload(MODEL);

export default function Robot() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions, names } = useAnimations(animations, group);

  // Play a calm idle loop (RobotExpressive ships an "Idle" clip).
  useEffect(() => {
    const clip = actions["Idle"] ?? (names[0] ? actions[names[0]] : undefined);
    clip?.reset().fadeIn(0.5).play();
    return () => void clip?.fadeOut(0.3);
  }, [actions, names]);

  // Cast/receive shadows on every mesh so the scene lighting reads.
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene]);

  // Slow turntable rotation — a product-shot spin.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.3;
  });

  return (
    <group ref={group} position={[0, 0, 0]} scale={2.4}>
      <primitive object={scene} />
    </group>
  );
}
