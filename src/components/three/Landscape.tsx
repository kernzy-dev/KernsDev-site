import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { useGrassPBR, useAsphaltPBR } from "./PBRMaterials";

/**
 * The world around the building — ground, driveway, path, trees, bushes,
 * mailbox, and a few decorative props.
 *
 * Performance: repeated meshes (trees, bushes, flowers) use drei's <Instances>
 * primitive. Every tree's trunk → 1 draw call total (not 22). Every tree's
 * foliage → 2 more. Same for bushes (1 draw call for all) and flowers (1).
 *
 * Procedural placement uses a deterministic seeded RNG so trees don't pop
 * around on hot-reload.
 */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Mailbox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
      </mesh>
      {/* Box */}
      <mesh castShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.5]} />
        <meshStandardMaterial color="#a855f7" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Flag */}
      <mesh castShadow position={[0.2, 1.4, -0.18]}>
        <boxGeometry args={[0.04, 0.18, 0.12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function Landscape() {
  const grassPBR = useGrassPBR();
  const asphaltPBR = useAsphaltPBR();

  // Per-instance tree state — position, scale, rotation, color shift,
  // species (pine / oak / broadleaf). Generated deterministically so
  // refresh doesn't reshuffle the forest.
  const trees = useMemo(() => {
    const rand = seeded(42);
    type Tree = {
      pos: [number, number, number];
      yaw: number;        // y-axis rotation (radians)
      tilt: number;       // x-axis micro-tilt
      scaleY: number;     // height multiplier
      scaleXZ: number;    // width multiplier
      species: 0 | 1 | 2; // 0=pine (tall narrow cones), 1=oak (round), 2=broadleaf (wide)
      foliageTint: string;
      trunkTint: string;
    };
    const out: Tree[] = [];

    // Hand-coded green palette for foliage — natural variation around forest green
    const foliageHues = ["#2f5e22", "#3d6b2e", "#3a7a30", "#4d8a3a", "#5a9a40", "#356a28"];
    const trunkHues   = ["#3a2410", "#4a2f1a", "#3d2818", "#523316", "#2e1a0b"];

    for (let i = 0; i < 28; i++) {
      let x = (rand() - 0.5) * 42;
      let z = (rand() - 0.5) * 42;
      const r = Math.sqrt(x * x + z * z);
      if (r < 8) {
        const angle = Math.atan2(z, x);
        x = Math.cos(angle) * (8 + rand() * 6);
        z = Math.sin(angle) * (8 + rand() * 6);
      }
      // Clear of the front approach drive
      if (Math.abs(x) < 2.0 && z > 3 && z < 12) continue;

      out.push({
        pos: [x, 0, z],
        yaw: rand() * Math.PI * 2,
        tilt: (rand() - 0.5) * 0.08,
        scaleY: 0.75 + rand() * 0.7,
        scaleXZ: 0.85 + rand() * 0.4,
        species: Math.floor(rand() * 3) as 0 | 1 | 2,
        foliageTint: foliageHues[Math.floor(rand() * foliageHues.length)],
        trunkTint: trunkHues[Math.floor(rand() * trunkHues.length)],
      });
    }
    return out;
  }, []);

  // Pre-bucket trees by species so each gets its own InstancedMesh pool
  // (drei <Instance>'s per-instance color works, but geometry can't vary).
  const trees0 = trees.filter((t) => t.species === 0);  // pine: narrow tall
  const trees1 = trees.filter((t) => t.species === 1);  // oak: round + chunky
  const trees2 = trees.filter((t) => t.species === 2);  // broadleaf: wide spread

  const bushes = useMemo(() => {
    const rand = seeded(7);
    const out: { pos: [number, number, number]; scale: number }[] = [];
    const hedgeLine: [number, number, number][] = [];
    for (let x = -5; x <= -2.2; x += 0.55) hedgeLine.push([x, 0, 2.1]);
    for (let x = 2.2; x <= 5; x += 0.55) hedgeLine.push([x, 0, 2.1]);
    for (let z = -0.8; z <= 0.8; z += 0.55) {
      hedgeLine.push([-5.2, 0, z]);
      hedgeLine.push([5.2, 0, z]);
    }
    for (const p of hedgeLine) {
      out.push({ pos: p, scale: 0.95 + rand() * 0.25 });
    }
    return out;
  }, []);

  const flowers = useMemo(
    () =>
      [
        { pos: [-2.1, 0.08, 2.4] as [number, number, number], color: "#fbbf24" },
        { pos: [-1.8, 0.08, 2.45] as [number, number, number], color: "#a855f7" },
        { pos: [-1.5, 0.08, 2.4] as [number, number, number], color: "#fbbf24" },
        { pos: [1.5, 0.08, 2.4] as [number, number, number], color: "#a855f7" },
        { pos: [1.8, 0.08, 2.45] as [number, number, number], color: "#fbbf24" },
        { pos: [2.1, 0.08, 2.4] as [number, number, number], color: "#a855f7" },
      ],
    [],
  );

  return (
    <group>
      {/* Grass ground plane — procedural texture */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial {...grassPBR} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[12, 30, 64]} />
        <meshStandardMaterial color="#1f3614" roughness={1} />
      </mesh>

      {/* === GRAND CIRCULAR DRIVEWAY === */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 5.5]}>
        <circleGeometry args={[1.4, 32]} />
        <meshStandardMaterial {...grassPBR} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 5.5]}>
        <ringGeometry args={[1.4, 2.8, 48]} />
        <meshStandardMaterial {...asphaltPBR} metalness={0.0} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 9.5]}>
        <planeGeometry args={[2.8, 4.5]} />
        <meshStandardMaterial {...asphaltPBR} metalness={0.0} />
      </mesh>

      {/* Central fountain */}
      <mesh castShadow receiveShadow position={[0, 0.3, 5.5]}>
        <cylinderGeometry args={[0.35, 0.5, 0.5, 24]} />
        <meshStandardMaterial color="#c0b298" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 0.7, 5.5]}>
        <cylinderGeometry args={[0.15, 0.3, 0.3, 24]} />
        <meshStandardMaterial color="#d8c8a8" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 5.5]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Stone walkway */}
      {Array.from({ length: 5 }, (_, i) => i).map((i) => (
        <mesh key={`stone-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 2.8 + i * 0.32]}>
          <planeGeometry args={[1.0, 0.28]} />
          <meshStandardMaterial color="#a09278" roughness={0.85} />
        </mesh>
      ))}

      {/* Flower beds */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={`bed-${x}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, 2.4]}>
          <planeGeometry args={[1.0, 0.45]} />
          <meshStandardMaterial color="#3d2817" roughness={1} />
        </mesh>
      ))}

      {/* === INSTANCED: FLOWERS (1 draw call for all) === */}
      <Instances castShadow limit={flowers.length}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshStandardMaterial emissiveIntensity={0.4} />
        {flowers.map((f, i) => (
          <Instance
            key={`flower-${i}`}
            position={f.pos}
            color={f.color}
          />
        ))}
      </Instances>

      {/* === INSTANCED TREES, THREE SPECIES === */}
      {/* All 3 species share the same trunk geometry (1 draw call for ALL trunks)
          but foliage varies — pine has 3 cones, oak has a sphere + cylinder, broadleaf has 2 round blobs. */}

      {/* Shared trunks for every tree */}
      {trees.length > 0 && (
        <Instances castShadow limit={trees.length}>
          <cylinderGeometry args={[0.12, 0.18, 1.2, 8]} />
          <meshStandardMaterial roughness={0.95} />
          {trees.map((t, i) => (
            <Instance
              key={`tt-${i}`}
              position={[t.pos[0], 0.6 * t.scaleY, t.pos[2]]}
              rotation={[t.tilt, t.yaw, 0]}
              scale={[t.scaleXZ, t.scaleY, t.scaleXZ]}
              color={t.trunkTint}
            />
          ))}
        </Instances>
      )}

      {/* PINE — narrow tall cones stacked (3 tiers per tree, 3 draw calls for all pines) */}
      {trees0.length > 0 && (
        <>
          <Instances castShadow limit={trees0.length}>
            <coneGeometry args={[0.55, 1.0, 8]} />
            <meshStandardMaterial roughness={0.85} />
            {trees0.map((t, i) => (
              <Instance
                key={`p0-${i}`}
                position={[t.pos[0], 1.4 * t.scaleY, t.pos[2]]}
                rotation={[0, t.yaw, 0]}
                scale={[t.scaleXZ, t.scaleY, t.scaleXZ]}
                color={t.foliageTint}
              />
            ))}
          </Instances>
          <Instances castShadow limit={trees0.length}>
            <coneGeometry args={[0.42, 0.85, 8]} />
            <meshStandardMaterial roughness={0.85} />
            {trees0.map((t, i) => (
              <Instance
                key={`p1-${i}`}
                position={[t.pos[0], 2.0 * t.scaleY, t.pos[2]]}
                rotation={[0, t.yaw + 0.4, 0]}
                scale={[t.scaleXZ, t.scaleY, t.scaleXZ]}
                color={t.foliageTint}
              />
            ))}
          </Instances>
          <Instances castShadow limit={trees0.length}>
            <coneGeometry args={[0.28, 0.7, 8]} />
            <meshStandardMaterial roughness={0.85} />
            {trees0.map((t, i) => (
              <Instance
                key={`p2-${i}`}
                position={[t.pos[0], 2.55 * t.scaleY, t.pos[2]]}
                rotation={[0, t.yaw + 0.8, 0]}
                scale={[t.scaleXZ, t.scaleY, t.scaleXZ]}
                color={t.foliageTint}
              />
            ))}
          </Instances>
        </>
      )}

      {/* OAK — rounded chunky canopy (1 sphere per tree, slightly elongated) */}
      {trees1.length > 0 && (
        <Instances castShadow limit={trees1.length}>
          <sphereGeometry args={[0.85, 10, 8]} />
          <meshStandardMaterial roughness={0.88} />
          {trees1.map((t, i) => (
            <Instance
              key={`o-${i}`}
              position={[t.pos[0], 1.8 * t.scaleY, t.pos[2]]}
              rotation={[0, t.yaw, 0]}
              scale={[t.scaleXZ * 1.1, t.scaleY * 0.95, t.scaleXZ * 1.1]}
              color={t.foliageTint}
            />
          ))}
        </Instances>
      )}

      {/* BROADLEAF — wide low canopy (2 stacked rounded shapes) */}
      {trees2.length > 0 && (
        <>
          <Instances castShadow limit={trees2.length}>
            <sphereGeometry args={[0.95, 10, 7]} />
            <meshStandardMaterial roughness={0.88} />
            {trees2.map((t, i) => (
              <Instance
                key={`b0-${i}`}
                position={[t.pos[0], 1.6 * t.scaleY, t.pos[2]]}
                rotation={[0, t.yaw, 0]}
                scale={[t.scaleXZ * 1.2, t.scaleY * 0.7, t.scaleXZ * 1.2]}
                color={t.foliageTint}
              />
            ))}
          </Instances>
          <Instances castShadow limit={trees2.length}>
            <sphereGeometry args={[0.65, 10, 7]} />
            <meshStandardMaterial roughness={0.88} />
            {trees2.map((t, i) => (
              <Instance
                key={`b1-${i}`}
                position={[t.pos[0], 2.15 * t.scaleY, t.pos[2]]}
                rotation={[0, t.yaw + 0.5, 0]}
                scale={[t.scaleXZ, t.scaleY * 0.75, t.scaleXZ]}
                color={t.foliageTint}
              />
            ))}
          </Instances>
        </>
      )}

      {/* === INSTANCED: BUSHES (1 draw call for all hedge bushes) === */}
      <Instances castShadow limit={bushes.length}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#3d5e2a" roughness={0.9} />
        {bushes.map((b, i) => (
          <Instance
            key={`bush-${i}`}
            position={b.pos}
            scale={[b.scale, b.scale, b.scale]}
          />
        ))}
      </Instances>

      {/* Mailbox at the end of the long approach drive */}
      <Mailbox position={[1.8, 0, 11.5]} />
    </group>
  );
}
