import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter, HeroKind } from "./worldData";
import { CHAPTERS } from "./worldData";

// Preload all four themed chapter GLTFs so per-chapter transitions don't
// stall. Fires once at module load — parallel background fetches, no
// blocking of the initial /world render.
for (const c of CHAPTERS) {
  if (c.hero.gltfPath) useGLTF.preload(c.hero.gltfPath);
}

type Props = {
  chapter: Chapter;
  scrollProgress: number;
  phase: number;
};

/**
 * Per-chapter themed hero object.
 *
 * When `chapter.hero.gltfPath` is set, mounts the themed GLTF on a fully
 * lit hero stage:
 *   - Auto-fits the model via bounding box (scale so height = hero.size in
 *     world units, center on x/z, base at y=0). Different Poly Haven models
 *     have wildly different natural scales — auto-fit normalizes that.
 *   - Dramatic 3-point lighting: warm KEY from front-left, cyan RIM from
 *     back-right, cyan UNDERLIGHT under the hero. Puts the model IN the
 *     scene as a hero, not as a dark blob catching night HDRI.
 *   - Cyan ground-ring accent + soft underglow = the emissive wraps AROUND
 *     the hero as its focal point.
 * When there is no gltfPath, renders one of four clearly-distinct
 * placeholder silhouettes (slab / icosahedron / torusKnot / octahedron).
 */
export default function ChapterHero({ chapter, scrollProgress, phase }: Props) {
  const group = useRef<THREE.Group>(null!);
  const emissive = useRef<THREE.MeshStandardMaterial>(null!);
  const ringRef = useRef<THREE.MeshStandardMaterial>(null!);

  const half = 0.18;
  const presence = Math.max(
    0,
    1 - Math.pow((scrollProgress - chapter.progress) / half, 2),
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.15 + phase;
    if (chapter.hero.kind !== "slab" && !chapter.hero.gltfPath) {
      group.current.position.y =
        chapter.hero.position[1] + Math.sin(t * 0.6 + phase) * 0.08;
    }
    const smooth = presence * presence * (3 - 2 * presence);
    const floor = chapter.hero.gltfPath || chapter.hero.kind === "slab" ? 0.12 : 0.0;
    const s = floor + (1 - floor) * smooth;
    group.current.scale.setScalar(s);
    group.current.visible = s > 0.01;
    if (emissive.current) {
      const breath = 1 + Math.sin(t * 1.1 + phase) * 0.18;
      emissive.current.emissiveIntensity = (1.2 + presence * 2.6) * breath;
    }
    if (ringRef.current) {
      const breath = 1 + Math.sin(t * 0.9 + phase) * 0.22;
      ringRef.current.emissiveIntensity = (1.4 + presence * 3.2) * breath;
    }
  });

  if (chapter.hero.gltfPath) {
    return (
      <group ref={group} position={chapter.hero.position}>
        <Suspense fallback={null}>
          <AutoFitGltf
            url={chapter.hero.gltfPath}
            targetHeight={chapter.hero.size}
            emissiveColor={chapter.hero.color}
          />
        </Suspense>

        <HeroStage color={chapter.hero.color} height={chapter.hero.size} ringRef={ringRef} coreRef={emissive} />
      </group>
    );
  }

  return (
    <group ref={group} position={chapter.hero.position}>
      <Placeholder kind={chapter.hero.kind} color={chapter.hero.color} size={chapter.hero.size} matRef={emissive} />
    </group>
  );
}

// ── Auto-fit GLTF loader ─────────────────────────────────────────────────────
// Loads a GLTF, measures its bounding box, and normalizes it: scaled so
// `size.y === targetHeight`, centered on x/z, base at y=0. Applies cyan
// emissive material overrides to make the model READ in the dark scene.

function AutoFitGltf({
  url,
  targetHeight,
  emissiveColor,
}: {
  url: string;
  targetHeight: number;
  emissiveColor: string;
}) {
  const { scene } = useGLTF(url);
  const overrides = useMemo(
    () => ({
      emissive: new THREE.Color(emissiveColor),
      emissiveIntensity: 0.35,
      envMapIntensity: 2.8,
      roughness: 0.42,
      metalness: 0.35,
    }),
    [emissiveColor],
  );

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const m = mesh.material.clone();
          m.emissive = overrides.emissive;
          m.emissiveIntensity = overrides.emissiveIntensity;
          m.envMapIntensity = overrides.envMapIntensity;
          m.roughness = overrides.roughness;
          m.metalness = overrides.metalness;
          mesh.material = m;
        }
      }
    });
    return s;
  }, [scene, overrides]);

  const { scale, offset } = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const modelHeight = size.y || 1;
    const s = targetHeight / modelHeight;
    // Position offset (in unscaled coords) so bbox base sits at y=0 and
    // horizontal center at (0,0).
    return {
      scale: s,
      offset: [-center.x, -bbox.min.y, -center.z] as [number, number, number],
    };
  }, [cloned, targetHeight]);

  return (
    <group scale={scale}>
      <group position={offset}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

// ── Hero stage ───────────────────────────────────────────────────────────────
// Dramatic 3-point lighting + ground-ring underglow. The stage wraps around
// whatever hero geometry sits at group origin.

function HeroStage({
  color,
  height,
  ringRef,
  coreRef,
}: {
  color: string;
  height: number;
  ringRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
  coreRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  const midY = height * 0.55;
  const topY = height * 1.15;

  // Spot targets — Object3D at hero's mid-height. Adding to scene is
  // necessary for the spotlight to actually aim at them.
  const keyTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, midY, 0);
    return t;
  }, [midY]);
  const rimTarget = useMemo(() => {
    const t = new THREE.Object3D();
    t.position.set(0, midY * 0.9, 0);
    return t;
  }, [midY]);

  const ringR = Math.max(0.55, height * 0.4);

  return (
    <group>
      {/* KEY light — warm, front-left, high intensity spot. This is what
          makes the hero POP out of the void HDRI instead of reading as a
          dark blob. */}
      <primitive object={keyTarget} />
      <spotLight
        position={[-height * 1.4, topY, height * 1.0]}
        angle={0.55}
        penumbra={0.45}
        intensity={height * 42}
        distance={height * 5}
        decay={1.4}
        color="#fff2d0"
        castShadow={false}
        target={keyTarget}
      />

      {/* RIM light — cyan from back-right, kisses the hero's silhouette
          with the chapter accent colour. */}
      <primitive object={rimTarget} />
      <spotLight
        position={[height * 1.6, topY * 0.9, -height * 1.1]}
        angle={0.55}
        penumbra={0.5}
        intensity={height * 34}
        distance={height * 5}
        decay={1.5}
        color={color}
        target={rimTarget}
      />

      {/* UNDERLIGHT — cyan practical from directly below, wraps the hero
          in accent glow from the base up. This IS the "emissive accent
          around the hero" per Grant's brief. */}
      <pointLight
        position={[0, 0.15, 0]}
        color={color}
        intensity={height * 8}
        distance={height * 2.4}
        decay={1.6}
      />

      {/* Cyan ground ring — the hero's chapter emblem on the wet-PBR
          floor. Emissive, breathing intensity via ringRef. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[ringR * 0.75, ringR, 64]} />
        <meshStandardMaterial
          ref={ringRef}
          color={color}
          emissive={color}
          emissiveIntensity={2.4}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft outer glow disc — makes the ring bleed into the fog for a
          halo effect on the wet floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[ringR * 1.05, ringR * 1.9, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Emissive core beacon just above the hero — a tiny cyan pip that
          keeps the eye anchored. `coreRef` picks this up for the presence
          breathing pulse. Kept SMALL so it doesn't compete with the model. */}
      <mesh position={[0, topY, 0]}>
        <sphereGeometry args={[Math.max(0.08, height * 0.05), 12, 8]} />
        <meshStandardMaterial
          ref={coreRef}
          color={color}
          emissive={color}
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ── Placeholders ────────────────────────────────────────────────────────────
// Kept as fallbacks; used only if a chapter has no gltfPath.

function Placeholder({
  kind,
  color,
  size,
  matRef,
}: {
  kind: HeroKind;
  color: string;
  size: number;
  matRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  switch (kind) {
    case "slab":
      return <SlabPlaceholder color={color} size={size} matRef={matRef} />;
    case "icosahedron":
      return <IcosahedronPlaceholder color={color} size={size} matRef={matRef} />;
    case "torusKnot":
      return <TorusKnotPlaceholder color={color} size={size} matRef={matRef} />;
    case "octahedron":
      return <OctahedronPlaceholder color={color} size={size} matRef={matRef} />;
  }
}

function SlabPlaceholder({
  color,
  size,
  matRef,
}: {
  color: string;
  size: number;
  matRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  const w = 1.7 * size;
  const h = 4.8 * size;
  const d = 0.55 * size;
  return (
    <group>
      {/* R26 perf: was meshPhysicalMaterial with transmission=0.78 (backbuffer
          sample per frame — expensive). Replaced with plain
          meshStandardMaterial — the placeholder is a fallback that only
          shows if a chapter has no gltfPath, so the aesthetic loss is
          acceptable and the perf win is real. */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#0a1e22"
          roughness={0.4}
          metalness={0.3}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w * 0.72, h * 0.86, d * 0.36]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={3.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[w + 0.35, 0.1, d + 0.35]} />
        <meshStandardMaterial color="#07080D" roughness={0.9} metalness={0.2} />
      </mesh>
    </group>
  );
}

function IcosahedronPlaceholder({
  color,
  size,
  matRef,
}: {
  color: string;
  size: number;
  matRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  const r = 0.9 * size;
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[r * 1.15, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          wireframe
          toneMapped={false}
        />
      </mesh>
      <mesh castShadow>
        <icosahedronGeometry args={[r * 0.7, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.4}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function TorusKnotPlaceholder({
  color,
  size,
  matRef,
}: {
  color: string;
  size: number;
  matRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  return (
    <mesh castShadow>
      <torusKnotGeometry args={[0.65 * size, 0.18 * size, 128, 20, 2, 3]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.6}
        roughness={0.22}
        metalness={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

function OctahedronPlaceholder({
  color,
  size,
  matRef,
}: {
  color: string;
  size: number;
  matRef: React.MutableRefObject<THREE.MeshStandardMaterial>;
}) {
  const r = 0.85 * size;
  return (
    <group>
      <mesh castShadow>
        <octahedronGeometry args={[r, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          roughness={0.28}
          metalness={0.55}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <octahedronGeometry args={[r * 1.02, 0]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
