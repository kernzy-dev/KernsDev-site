import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ProjectMarker } from "./worldData";

type Props = {
  project: ProjectMarker;
  /** [0,1] scroll progress — used to gate visibility to the WORK chapter. */
  scrollProgress: number;
  /** Chapter progress marker for the WORK chapter (default 0.5). */
  chapterProgress: number;
  phase: number;
};

/**
 * A real project marker in the WORK chapter — represents one of Grant's
 * autonomous systems (polymarket-bot / fidel-daytrader / factvault /
 * fire-control). Small emissive core with a wireframe cage silhouette so
 * the flock reads as "a fleet of active processes" from the WORK camera
 * keyframe. Not full-hero-scale — these are supporting cast to the WORK
 * chapter's central generator.
 *
 * Presence-scaled to the WORK chapter window so they don't leak into
 * neighbouring frames.
 */
export default function ProjectNode({
  project,
  scrollProgress,
  chapterProgress,
  phase,
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const core = useRef<THREE.MeshStandardMaterial>(null!);

  const half = 0.2;
  const presence = Math.max(
    0,
    1 - Math.pow((scrollProgress - chapterProgress) / half, 2),
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    // Idle rotation + gentle bob
    group.current.rotation.y = t * 0.28 + phase;
    group.current.position.y =
      project.position[1] + Math.sin(t * 0.9 + phase) * 0.09;

    // Presence-scale so the fleet only shows when WORK chapter is being framed
    const smooth = presence * presence * (3 - 2 * presence);
    group.current.scale.setScalar(smooth);
    group.current.visible = smooth > 0.02;

    // Emissive breathing
    if (core.current) {
      const breath = 1 + Math.sin(t * 1.4 + phase) * 0.28;
      core.current.emissiveIntensity = 2.4 * breath;
    }
  });

  return (
    <group ref={group} position={project.position}>
      {/* Outer wireframe cage — silhouette */}
      <mesh>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={0.5}
          wireframe
          toneMapped={false}
        />
      </mesh>
      {/* Inner emissive core */}
      <mesh castShadow>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          ref={core}
          color={project.color}
          emissive={project.color}
          emissiveIntensity={2.4}
          roughness={0.3}
          metalness={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* Underlight — casts the project colour on the ground */}
      <pointLight
        position={[0, -0.6, 0]}
        color={project.color}
        intensity={2.4}
        distance={2.4}
        decay={1.6}
      />
      {/* Ground pip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <ringGeometry args={[0.18, 0.32, 32]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={1.8}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
