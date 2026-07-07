import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";

/**
 * LivingCavern — R33 stage 2 of the vertical descent.
 *
 * As the visitor scrolls past the 2D pixel-art fall-in (which alpha-fades
 * out of view), the underlying 3D CAVERN reveals itself: rocky domed
 * walls, vines drooping from the ceiling and climbing up the pillars,
 * glowing bio-luminescent mushroom clusters, moss patches on the floor.
 * The cavern is LIT from a warm hearth in the center + cool bio-blue
 * ambient from moss + vine wildlife.
 *
 * LIGHT budget: pure MeshStandardMaterial (no transmission), drei
 * `<Instances>` for vines + plants so all instances share one draw
 * call each. No post-processing added here — the parent CaveScene
 * already owns the single EffectComposer.
 */

const CYAN = "#5be9e0";
const AMBER = "#f5a623";
const MOSS = "#4ade80";
const ROCK = "#1a1614";

type Props = {
  scrollProgress: number;
};

const VINE_COUNT = 42;
const MUSHROOM_COUNT = 34;
const MOSS_COUNT = 60;
const PLANT_ORB_COUNT = 20;

type InstanceCfg = {
  x: number;
  z: number;
  y: number;
  scale: number;
  rot: number;
  bright: number;
};

function seed(count: number, radius: number, yFn: () => number, scaleFn: () => number): InstanceCfg[] {
  return Array.from({ length: count }, () => {
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.55 + Math.random() * 0.45);
    return {
      x: Math.cos(theta) * r,
      z: Math.sin(theta) * r,
      y: yFn(),
      scale: scaleFn(),
      rot: Math.random() * Math.PI * 2,
      bright: 0.5 + Math.random() * 0.5,
    };
  });
}

export default function LivingCavern({ scrollProgress }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const orbsRef = useRef<THREE.Group>(null);

  // Instance seeds — stable per-mount so scrolling doesn't jitter positions.
  const vines = useMemo(
    () =>
      seed(
        VINE_COUNT,
        14,
        () => 6 + Math.random() * 4,
        () => 0.4 + Math.random() * 0.5,
      ),
    [],
  );
  const mushrooms = useMemo(
    () =>
      seed(
        MUSHROOM_COUNT,
        13,
        () => 0.05 + Math.random() * 0.05,
        () => 0.25 + Math.random() * 0.35,
      ),
    [],
  );
  const mossPatches = useMemo(
    () =>
      seed(
        MOSS_COUNT,
        15,
        () => 0.02,
        () => 0.35 + Math.random() * 0.45,
      ),
    [],
  );
  const plantOrbs = useMemo(
    () =>
      seed(
        PLANT_ORB_COUNT,
        13,
        () => 1.5 + Math.random() * 5,
        () => 0.1 + Math.random() * 0.15,
      ),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Vines sway subtly — group-level rotation is cheap.
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.09) * 0.02;
    }
    // Orb-plants pulse together (cheap uniform breathing).
    if (orbsRef.current) {
      const pulse = 0.85 + Math.sin(t * 0.9) * 0.15;
      orbsRef.current.scale.setScalar(pulse);
    }
  });

  // Presence factor — cavern is fully present only once we're past the
  // pixel-fall crossfade (scroll > 0.35). Below 0.15 it's still hidden
  // behind the opaque pixel-art layer, so no visual cost — but its geometry
  // still needs to render (composited under). Keep it at full lit intensity
  // once revealed; the pixel layer handles its own fade.
  const bloom = Math.min(1, Math.max(0, (scrollProgress - 0.18) / 0.22));
  void bloom; // reserved for future intensity modulation

  return (
    <group>
      {/* Cavern shell — inverted sphere half-dome. BackSide so we see the
          interior. Rocky dark base color, subtle emissive so the walls
          aren't pitch-black even in far shadow. */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[20, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial
          color={ROCK}
          roughness={0.95}
          metalness={0.05}
          side={THREE.BackSide}
          emissive={"#0a1218"}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Warm hearth — center point light (Grant's "hearth" cue). Amber, mid range,
          casts a soft glow. Physically no torch mesh yet (R34 add). */}
      <pointLight
        position={[0, 0.9, 0]}
        color={AMBER}
        intensity={2.8}
        distance={14}
        decay={1.6}
      />

      {/* Cool bio-blue fill — from moss growth on high walls. */}
      <pointLight
        position={[0, 6, 0]}
        color={CYAN}
        intensity={1.8}
        distance={18}
        decay={1.8}
      />

      {/* Vines drooping from the ceiling — instanced tall thin cylinders. */}
      <group ref={groupRef}>
        <Instances limit={VINE_COUNT} range={VINE_COUNT}>
          <cylinderGeometry args={[0.045, 0.02, 5.5, 6]} />
          <meshStandardMaterial
            color={"#274e2a"}
            roughness={0.75}
            metalness={0.0}
            emissive={MOSS}
            emissiveIntensity={0.18}
          />
          {vines.map((v, i) => (
            <Instance
              key={i}
              position={[v.x, v.y, v.z]}
              rotation={[Math.PI + Math.sin(i * 0.7) * 0.15, v.rot, Math.cos(i * 0.4) * 0.12]}
              scale={[v.scale, v.scale * 1.4, v.scale]}
            />
          ))}
        </Instances>
      </group>

      {/* Bio-luminescent mushroom caps clustered on floor + low walls.
          Bright cyan emissive so they read as living light sources. */}
      <Instances limit={MUSHROOM_COUNT} range={MUSHROOM_COUNT}>
        <coneGeometry args={[0.35, 0.55, 8]} />
        <meshStandardMaterial
          color={"#1a2a3a"}
          roughness={0.55}
          metalness={0.0}
          emissive={CYAN}
          emissiveIntensity={2.6}
          toneMapped={false}
        />
        {mushrooms.map((m, i) => (
          <Instance
            key={i}
            position={[m.x, m.y + m.scale * 0.5, m.z]}
            rotation={[0, m.rot, 0]}
            scale={m.scale * m.bright * 1.4}
          />
        ))}
      </Instances>

      {/* Mushroom stalks — chunky small cylinders under the caps. */}
      <Instances limit={MUSHROOM_COUNT} range={MUSHROOM_COUNT}>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 6]} />
        <meshStandardMaterial color={"#e8ecf4"} roughness={0.7} metalness={0.02} />
        {mushrooms.map((m, i) => (
          <Instance
            key={i}
            position={[m.x, m.y + m.scale * 0.2, m.z]}
            scale={m.scale * 1.3}
          />
        ))}
      </Instances>

      {/* Moss patches — flat discs low on the ground. Emissive so the moss
          FEELS lit from within. */}
      <Instances limit={MOSS_COUNT} range={MOSS_COUNT}>
        <cylinderGeometry args={[0.4, 0.5, 0.05, 8]} />
        <meshStandardMaterial
          color={"#0a1a12"}
          roughness={0.85}
          metalness={0.0}
          emissive={MOSS}
          emissiveIntensity={0.65}
        />
        {mossPatches.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, p.y, p.z]}
            rotation={[0, p.rot, 0]}
            scale={[p.scale, 1, p.scale]}
          />
        ))}
      </Instances>

      {/* Floating plant-orbs — tiny glowing spores drifting mid-height.
          Read as living wildlife between the vines. */}
      <group ref={orbsRef}>
        <Instances limit={PLANT_ORB_COUNT} range={PLANT_ORB_COUNT}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial
            color={"#0d1a24"}
            emissive={CYAN}
            emissiveIntensity={3.2}
            toneMapped={false}
          />
          {plantOrbs.map((o, i) => (
            <Instance
              key={i}
              position={[o.x, o.y, o.z]}
              scale={o.scale * o.bright}
            />
          ))}
        </Instances>
      </group>
    </group>
  );
}
