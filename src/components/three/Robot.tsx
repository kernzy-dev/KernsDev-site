import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

// CC0 "RobotExpressive" by Tomás Laulhé (via three.js examples) — the AI/tech
// centerpiece. Preload so the descent + model arrive together.
const MODEL = "/models/robot.glb";
useGLTF.preload(MODEL);

// One-shot "emote" clips (play once, then settle back to Idle) vs. looping states.
const EMOTES = new Set(["Yes", "No", "Wave", "ThumbsUp", "Jump", "Punch"]);

export default function Robot({ pose, scale = 1.55 }: { pose?: string | null; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  // useGLTF returns ONE shared scene object; a three.js object can only be
  // mounted in one place. The site now shows the robot in two canvases (hero +
  // values), so clone per-instance (SkeletonUtils handles the skinned mesh).
  const model = useMemo(() => skeletonClone(scene), [scene]);
  const { actions, names, mixer } = useAnimations(animations, group);
  const current = useRef<THREE.AnimationAction | null>(null);
  const posing = useRef(false);

  // Cross-fade to a clip. Emotes play once + clamp; states loop.
  function fadeTo(name: string, fade = 0.3) {
    const next = actions[name];
    if (!next) return;
    const prev = current.current;
    if (prev === next) return;
    next.reset();
    next.enabled = true;
    if (EMOTES.has(name)) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.fadeIn(fade).play();
    prev?.fadeOut(fade);
    current.current = next;
  }

  // Start on Idle.
  useEffect(() => {
    const first = actions["Idle"] ?? (names[0] ? actions[names[0]] : undefined);
    if (first) {
      first.reset().fadeIn(0.5).play();
      current.current = first;
    }
    return () => void current.current?.fadeOut(0.3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, names]);

  // When an emote finishes, drift back to Idle.
  useEffect(() => {
    if (!mixer) return;
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const name = (e.action.getClip() as THREE.AnimationClip).name;
      if (EMOTES.has(name)) fadeTo("Idle", 0.4);
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, actions]);

  // React to the selected value → play its pose (or return to Idle).
  useEffect(() => {
    posing.current = !!pose;
    fadeTo(pose || "Idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose]);

  // Shadows on every mesh.
  useEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [model]);

  // Slow turntable when idle; ease to face front while showing a pose.
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (posing.current) {
      const y = THREE.MathUtils.euclideanModulo(g.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      g.rotation.y = THREE.MathUtils.damp(y, 0, 4, dt);
    } else {
      g.rotation.y += dt * 0.3;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
