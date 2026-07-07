import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Environment, Sparkles, StatsGl } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import { ASSETS, CHAPTERS, PALETTE, PROJECTS, SECONDARY_MONOLITHS } from "./worldData";
import ChapterHero from "./ChapterHero";
import ProjectNode from "./ProjectNode";
import SecondaryMonolith from "./SecondaryMonolith";
import GltfProp from "./GltfProp";
import ScrollCamera from "./ScrollCamera";
import PostFX from "./PostFX";
import LivingCavern from "./LivingCavern";
import Dungeon from "./Dungeon";

type Props = {
  /** Shared scroll progress ref — 0 = arrival, 1 = final drift-out. */
  progressRef: MutableRefObject<number>;
  /** [0,1] cached for scene elements that need per-frame reactivity via prop. */
  scrollProgress: number;
  /** Scroll-rail element ScrollTrigger observes. */
  scrollRoot: RefObject<HTMLElement>;
  /** Fixed black overlay the intro fades (kept for API compatibility;
   *  R26 BootSequence intro doesn't use it). */
  curtainRef: RefObject<HTMLElement>;
  intro: boolean;
  reducedMotion: boolean;
  /** `?debug=1` in the URL → show StatsGl overlay (fps / ms / draw calls). */
  debug: boolean;
};

/**
 * CaveScene — R28 rename of WorldScene.tsx. Interim contents are the R25
 * NOCTURNE scroll-scene (chapters + heroes + secondaries + Sparkles +
 * Lantern GLTF + wet-metal floor + PostFX). R31 will gut this and rebuild
 * as the actual immersive cave interior per the new brief: cinderblock
 * entrance, vines down the ceiling, real projects embedded, LIGHT
 * (single EffectComposer, AdaptiveDpr, no multi-transmission).
 * For R28 the file is renamed only — no visual change — so the phase
 * state machine's `cave` phase resolves to a working scene.
 */
export default function CaveScene({
  progressRef,
  scrollProgress,
  scrollRoot,
  intro,
  reducedMotion,
  debug,
}: Props) {
  // FogExp2 gives distance-based falloff; matches the void colour so the fog
  // dissolves *into* the background instead of stacking over it. Density chosen
  // so the secondary monoliths at z=-6 to z=-18 receive progressively more
  // fog — each further slab dimmer than the one in front, sells parallax
  // depth. Slightly cooler than pure void so distant fog reads faintly teal.
  const fog = useMemo(() => new THREE.FogExp2("#0a0f16", 0.055), []);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        fov: 42,
        near: 0.1,
        far: 60,
        position: CHAPTERS[0].cameraPos,
      }}
      gl={{
        antialias: false, // SMAA handles AA in post
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      scene={{ fog }}
    >
      {/* R26 perf: AdaptiveDpr drops resolution when fps dips below 60 —
          keeps the scroll-fly frame-locked on slower hardware.
          AdaptiveEvents throttles pointer raycasts under load. */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <color attach="background" args={[PALETTE.void]} />

      {/* Real HDRI night sky — Poly Haven, background AND lighting.
          `environmentIntensity` drives IBL on PBR surfaces.
          `backgroundIntensity` is what shows in the SKY + gets mirrored
          in the metal floor. Kept lower than IBL so the wide-angle arrival
          shot doesn't have its floor mirror the horizon into a bloom
          sheet (R16 failure mode). Rebalanced 2026-07-05 R17.
          NOTE: R31 will replace this with a cave-appropriate dim IBL
          (or remove entirely — cave interior needn't see sky). */}
      <Suspense fallback={null}>
        <Environment
          files={ASSETS.hdri}
          background
          environmentIntensity={0.6}
          backgroundBlurriness={0.45}
          backgroundIntensity={0.32}
        />
      </Suspense>

      {/* Ambient fill so PBR geometry doesn't crush black in shadow */}
      <hemisphereLight args={[PALETTE.ambient, PALETTE.void, 0.6]} />
      <ambientLight intensity={0.22} color={PALETTE.ambient} />

      {/* Cool key light coming down from behind — moon/skylight */}
      <directionalLight
        position={[-6, 10, -8]}
        intensity={1.4}
        color="#a4bce8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />

      {/* Warm practical fill from the lantern side */}
      <pointLight
        position={[4.2, 2.0, 3.8]}
        color={PALETTE.amber}
        intensity={2.4}
        distance={12}
        decay={1.5}
      />
      {/* Distant cyan back-rim — the world beyond */}
      <pointLight
        position={[-4, 1.6, -8]}
        color={PALETTE.cyan}
        intensity={1.2}
        distance={18}
        decay={1.8}
      />

      {/* Wet PBR floor — high metalness so the monolith + lantern glow
          STREAK-reflect off it like a chromed puddle. `anisotropy: 0.9`
          stretches those reflections tangentially (rotation π/2 orients
          the streak toward the camera — the classic rain-slicked-street
          look). `clearcoat: 1` adds a water-film top layer over the metal
          so the surface reads as "wet asphalt with a mirror puddle"
          rather than pure metal.
          Metalness 0.85 (vs previous 0.05) is what Grant wanted — the
          reflections POP instead of getting eaten by diffuse. */}
      {/* R33: hide the wet-metal floor once the camera has descended
          into the dungeon layer (scroll > 0.7) — otherwise it becomes
          a "ceiling" over the dungeon and blocks the descent view. */}
      {scrollProgress < 0.72 && (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[80, 80, 1, 1]} />
          <meshPhysicalMaterial
            color="#04070d"
            roughness={0.14}
            metalness={0.85}
            clearcoat={1}
            clearcoatRoughness={0.06}
            anisotropy={0.9}
            anisotropyRotation={Math.PI / 2}
            envMapIntensity={0.55}
            reflectivity={1}
            transparent
            opacity={Math.max(0, 1 - (scrollProgress - 0.55) / 0.17)}
          />
        </mesh>
      )}

      {/* R33 stage 2: living cavern — inverted rock dome + drooping vines
          + bio-luminescent mushrooms + moss patches + floating spores.
          Renders as the "living cavern" middle stage of Grant's vertical
          descent. Instanced geometry keeps it LIGHT. */}
      <LivingCavern scrollProgress={scrollProgress} />

      {/* R33 stage 3: dungeon at the bottom of the descent — stone pillars
          ringing a torch-lit floor deep below (y = -5.5), with Grant's
          four real projects as loot chests distributed at scroll depths
          0.72 / 0.80 / 0.88 / 0.96. Presence-scales in from scroll > 0.6. */}
      <Dungeon scrollProgress={scrollProgress} />

      {/* Per-chapter hero objects — one themed model each, positioned at
          that chapter's lookAt so the scroll-fly camera frames it on
          arrival. R25: chapters now map to real portfolio sections
          (intro/about/work/services/contact). */}
      {CHAPTERS.map((c, i) => (
        <ChapterHero
          key={c.id}
          chapter={c}
          scrollProgress={scrollProgress}
          phase={i * 1.9}
        />
      ))}

      {/* Real projects — Grant's autonomous systems as explorable nodes
          in the WORK chapter (progress 0.5). Presence-scaled to that
          chapter window so they only show when the visitor is there. */}
      {PROJECTS.map((p, i) => (
        <ProjectNode
          key={p.key}
          project={p}
          scrollProgress={scrollProgress}
          chapterProgress={0.5}
          phase={i * 1.3}
        />
      ))}

      {/* Secondary monoliths — background parallax layer receding into fog.
          Each is progressively dimmer + more fog-obscured, sells depth. */}
      {SECONDARY_MONOLITHS.map((m, i) => (
        <SecondaryMonolith key={i} data={m} phase={i * 1.7} />
      ))}

      {/* Drifting particle motes — reads as atmosphere volume. Two layers so
          nearby motes are bigger (parallax) than far ones. */}
      <Sparkles
        count={110}
        speed={0.18}
        opacity={0.55}
        size={2.2}
        color={PALETTE.cyan}
        scale={[26, 8, 26]}
        position={[0, 3, -4]}
      />
      <Sparkles
        count={40}
        speed={0.12}
        opacity={0.35}
        size={4.5}
        color="#e8ecf4"
        scale={[16, 5, 16]}
        position={[0, 2.4, 0]}
        noise={0.6}
      />

      {/* Poly Haven GLTF prop — Lantern_01. Placed off-axis so it frames the
          monolith and reads as a warm practical light in the scene. */}
      <Suspense fallback={null}>
        <GltfProp
          url={ASSETS.lantern}
          position={[4.2, 0, 3.8]}
          scale={1.6}
          materialOverrides={{
            emissive: PALETTE.amber,
            emissiveIntensity: 0.35,
            envMapIntensity: 1.8,
            roughness: 0.42,
          }}
        />
      </Suspense>

      {/* R26: IntroCurtain retired — the intro is now the BootSequence 2D
          overlay (see WorldExperience). ScrollCamera picks up as soon as
          the scene mounts; `frozen={intro}` still respects the pre-boot
          state so the camera doesn't wander while the boot text plays. */}
      <ScrollCamera
        progressRef={progressRef}
        frozen={intro}
        scrollRoot={scrollRoot}
        reducedMotion={reducedMotion}
      />

      {/* Post-processing composer — bloom / DOF / vignette / grain */}
      <PostFX disabled={reducedMotion} />

      {/* Debug overlay — fps / ms / draw calls. Gated by ?debug=1 so the
          craft-bar review has numbers to check, not just eyeballs. */}
      {debug && <StatsGl className="!left-4 !top-4 !right-auto" />}
    </Canvas>
  );
}
