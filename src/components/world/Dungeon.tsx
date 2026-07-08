import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import { PROJECTS } from "./worldData";

/**
 * Dungeon — R33 stage 3, the deepest reach of the vertical descent.
 *
 * Below the living cavern, the visitor breaks into a stone dungeon.
 * Warm torchlight against cool cavern remains, angular stone pillars
 * ringing the space, amber ember dust drifting. Grant's four real
 * projects appear as LOOT — glowing chests with project-color rim
 * emissive, arranged at spaced scroll depths so the visitor "falls
 * past" each one.
 *
 * Presence-scales to scroll > 0.65; fully realised past 0.82. Below
 * the cavern floor (y < 0). Everything decorative uses drei
 * `<Instances>` so it stays LIGHT.
 */

const AMBER = "#f5a623";
const AMBER_DIM = "#7c4d10";
const STONE = "#2a2620";
const STONE_DARK = "#141210";
const GOLD = "#e8b04a";

type Props = {
  scrollProgress: number;
};

const PILLAR_COUNT = 16;
const EMBER_COUNT = 40;
const FLOOR_TILE_COUNT = 24;

type Placed = {
  x: number;
  z: number;
  y: number;
  scale: number;
  rot: number;
  jitter: number;
};

function ringPlacement(count: number, radius: number, y: number, scale: number): Placed[] {
  return Array.from({ length: count }, (_, i) => {
    const theta = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    return {
      x: Math.cos(theta) * radius,
      z: Math.sin(theta) * radius,
      y,
      scale: scale * (0.9 + Math.random() * 0.2),
      rot: theta + Math.PI / 2 + (Math.random() - 0.5) * 0.2,
      jitter: Math.random(),
    };
  });
}

function scatterPlacement(count: number, radius: number, yMin: number, yMax: number): Placed[] {
  return Array.from({ length: count }, () => {
    const theta = Math.random() * Math.PI * 2;
    const r = radius * Math.random();
    return {
      x: Math.cos(theta) * r,
      z: Math.sin(theta) * r,
      y: yMin + Math.random() * (yMax - yMin),
      scale: 0.4 + Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2,
      jitter: Math.random(),
    };
  });
}

// Deeper floor level so the dungeon reads as "below the cavern."
const FLOOR_Y = -5.5;
const CEIL_Y = -0.5;

export default function Dungeon({ scrollProgress }: Props) {
  const emberRef = useRef<THREE.Group>(null);

  const pillars = useMemo(
    () => ringPlacement(PILLAR_COUNT, 11, FLOOR_Y + 2.6, 1),
    [],
  );
  const embers = useMemo(
    () => scatterPlacement(EMBER_COUNT, 11, FLOOR_Y + 0.4, CEIL_Y - 0.5),
    [],
  );
  const floorTiles = useMemo(
    () => scatterPlacement(FLOOR_TILE_COUNT, 10, FLOOR_Y, FLOOR_Y),
    [],
  );

  // Loot chests — one per Grant's project, distributed at scroll depths
  // 0.72 / 0.80 / 0.88 / 0.96 so the visitor "falls past" each one.
  const loot = useMemo(
    () =>
      PROJECTS.map((p, i) => {
        const angle = (i / PROJECTS.length) * Math.PI * 2 + Math.PI / 4;
        const r = 4.5;
        // Descend the loot along Y as scroll-progress goal grows.
        const goalScroll = 0.72 + i * 0.08;
        return {
          project: p,
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          y: FLOOR_Y + 0.5 + (3 - i * 0.5),
          goalScroll,
        };
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (emberRef.current) {
      // Drift embers upward + swirl slightly — cheap group animation
      emberRef.current.rotation.y = t * 0.06;
      emberRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    }
  });

  // Presence — start ramp at 0.6, full by 0.82.
  const presence = Math.max(0, Math.min(1, (scrollProgress - 0.6) / 0.22));
  const emissiveGain = presence * presence;

  return (
    <group>
      {/* Ambient stone floor plate — deep dungeon base. */}
      <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 40]} />
        <meshStandardMaterial
          color={STONE_DARK}
          roughness={0.95}
          metalness={0.05}
          emissive={AMBER_DIM}
          emissiveIntensity={0.12 * presence}
        />
      </mesh>

      {/* Torch cluster in the center — warm amber point light. Only
          intensifies as the visitor descends. */}
      <pointLight
        position={[0, FLOOR_Y + 1.6, 0]}
        color={AMBER}
        intensity={3.6 * presence}
        distance={12}
        decay={1.6}
      />

      {/* Warm rim from below-and-outside so pillar silhouettes ping. */}
      <pointLight
        position={[6, FLOOR_Y + 2.4, 6]}
        color={"#c96b1a"}
        intensity={2.0 * presence}
        distance={16}
        decay={1.9}
      />

      {/* Stone pillars — instanced tall boxes ringing the perimeter.
          Angular stone aesthetic. */}
      <Instances limit={PILLAR_COUNT} range={PILLAR_COUNT}>
        <boxGeometry args={[0.9, 5.2, 0.9]} />
        <meshStandardMaterial
          color={STONE}
          roughness={0.85}
          metalness={0.08}
          emissive={AMBER_DIM}
          emissiveIntensity={0.08 * presence}
        />
        {pillars.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, p.y, p.z]}
            rotation={[0, p.rot, 0]}
            scale={p.scale}
          />
        ))}
      </Instances>

      {/* Floor tile chunks — offset stone tiles scattered on floor. */}
      <Instances limit={FLOOR_TILE_COUNT} range={FLOOR_TILE_COUNT}>
        <boxGeometry args={[1.4, 0.16, 1.4]} />
        <meshStandardMaterial
          color={STONE}
          roughness={0.9}
          metalness={0.05}
        />
        {floorTiles.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.y + 0.08, t.z]}
            rotation={[0, t.rot, 0]}
            scale={[t.scale, 1, t.scale]}
          />
        ))}
      </Instances>

      {/* Ember dust — small emissive amber spheres, drifting upward
          as a group. Reads as spark motes rising from torch. */}
      <group ref={emberRef}>
        <Instances limit={EMBER_COUNT} range={EMBER_COUNT}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshStandardMaterial
            color={"#2a1804"}
            emissive={AMBER}
            emissiveIntensity={3.8 * emissiveGain}
            toneMapped={false}
          />
          {embers.map((e, i) => (
            <Instance
              key={i}
              position={[e.x, e.y, e.z]}
              scale={0.5 + e.jitter * 0.9}
            />
          ))}
        </Instances>
      </group>

      {/* Loot chests — Grant's four projects as descending treasure. */}
      {loot.map((entry) => {
        // Per-chest presence — starts ramping just before goalScroll and
        // stays full through the tail so the loot doesn't pop out.
        const chestPresence = Math.max(
          0,
          Math.min(1, (scrollProgress - (entry.goalScroll - 0.12)) / 0.12),
        );
        const glow = 2.6 * chestPresence * emissiveGain;
        return (
          <group key={entry.project.key} position={[entry.x, entry.y, entry.z]}>
            {/* Chest body */}
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.6, 0.6]} />
              <meshStandardMaterial
                color={"#3d2a12"}
                roughness={0.55}
                metalness={0.3}
                emissive={GOLD}
                emissiveIntensity={0.55 * glow}
              />
            </mesh>
            {/* Lid — slightly angled up to hint "cracked open" */}
            <mesh position={[0, 0.42, -0.08]} rotation={[Math.PI * -0.14, 0, 0]}>
              <boxGeometry args={[0.9, 0.15, 0.6]} />
              <meshStandardMaterial
                color={"#3d2a12"}
                roughness={0.55}
                metalness={0.35}
                emissive={GOLD}
                emissiveIntensity={0.55 * glow}
              />
            </mesh>
            {/* Rim / trim glow in the project's color — is what identifies
                which project the chest is for. */}
            <mesh position={[0, 0.06, 0.32]}>
              <boxGeometry args={[0.94, 0.06, 0.02]} />
              <meshStandardMaterial
                color={entry.project.color}
                emissive={entry.project.color}
                emissiveIntensity={2.2 * chestPresence}
                toneMapped={false}
              />
            </mesh>
            {/* Inner-loot glow — a small emissive core to hint "gold inside" */}
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.14, 8, 6]} />
              <meshStandardMaterial
                color={GOLD}
                emissive={GOLD}
                emissiveIntensity={4 * chestPresence * emissiveGain}
                toneMapped={false}
              />
            </mesh>
            {/* Point light — chest illuminates its immediate neighborhood
                only when it's near-visible; keeps the total light count
                low most of the time. */}
            {chestPresence > 0.15 && (
              <pointLight
                position={[0, 0.5, 0]}
                color={GOLD}
                intensity={1.6 * chestPresence * emissiveGain}
                distance={4}
                decay={1.7}
              />
            )}
            {/* R35 per-project ID glyph — a distinctive floating shape
                above the chest in the project's colour, echoing the
                pixel-fall opening icons. Each project gets its own
                geometry so it reads at a glance even when the rim
                colour is subtle. */}
            <ChestGlyph
              projectKey={entry.project.key}
              color={entry.project.color}
              presence={chestPresence}
              emissiveGain={emissiveGain}
            />
          </group>
        );
      })}
    </group>
  );
}

/** Per-project distinctive floating glyph above each loot chest. */
function ChestGlyph({
  projectKey,
  color,
  presence,
  emissiveGain,
}: {
  projectKey: string;
  color: string;
  presence: number;
  emissiveGain: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle bob so the glyph reads as "floating loot" rather than static.
    ref.current.position.y = 0.95 + Math.sin(t * 1.8 + projectKey.length) * 0.05;
    ref.current.rotation.y = t * 0.6;
  });
  const intensity = 3.4 * presence * emissiveGain;
  return (
    <group ref={ref} position={[0, 0.95, 0]}>
      {projectKey === "polymarket-bot" && (
        // Coin ring — matches "$" from pixel-fall
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.045, 8, 20]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      )}
      {projectKey === "fidel-daytrader" && (
        // Upward triangle prism — matches "▲"
        <mesh>
          <coneGeometry args={[0.14, 0.26, 3]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      )}
      {projectKey === "factvault" && (
        // Diamond — matches "◈"
        <mesh>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      )}
      {projectKey === "fire-control" && (
        // Fireball sphere — pixel-fall has a triangle but fire feels
        // more spherical + shares the amber tone with the ember dust.
        <mesh>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
