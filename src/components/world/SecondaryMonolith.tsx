import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SecondaryMonolith as Data } from "./worldData";
import { PALETTE } from "./worldData";

type Props = {
  data: Data;
  /** Phase offset so the flock doesn't pulse in lockstep. */
  phase: number;
};

/**
 * Background monolith — a smaller, non-interactive kin of the hero. Uses
 * MeshStandardMaterial (not Physical) because at fog-depth the frost detail
 * would be invisible anyway — this saves the transmission cost and lets us
 * afford 5+ of them at 60fps.
 *
 * Two-slab construction: dark outer body + inset emissive core visible at the
 * edges. Reads as "another glowing pillar in the same architectural language."
 * Individual breathing pulse offset by `phase` so the crowd feels alive but
 * not synchronized.
 */
export default function SecondaryMonolith({ data, phase }: Props) {
  const panel = useRef<THREE.MeshStandardMaterial>(null!);
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (panel.current) {
      const pulse = 1.0 + Math.sin(t * 0.7 + phase) * 0.22;
      panel.current.emissiveIntensity = data.intensity * pulse;
    }
    if (group.current) {
      // subtle bob to sell "not a solid grid"
      group.current.position.y = Math.sin(t * 0.5 + phase) * 0.04;
    }
  });

  const { position, height: h, width: w, depth: d, rotation, color } = data;

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]}>
      {/* Body — dark slab, catches the HDRI env just enough to read */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          roughness={0.4}
          metalness={0.5}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Emissive core — the light bleeding out */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w * 0.35, h * 0.88, d * 0.35]} />
        <meshStandardMaterial
          ref={panel}
          color={color}
          emissive={color}
          emissiveIntensity={data.intensity}
          toneMapped={false}
        />
      </mesh>

      {/* Edge piping — thin verticals on 4 corners */}
      {[
        [w / 2, d / 2],
        [-w / 2, d / 2],
        [w / 2, -d / 2],
        [-w / 2, -d / 2],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], h / 2, p[1]]}>
          <boxGeometry args={[0.01, h * 0.98, 0.01]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={data.intensity * 1.4}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
