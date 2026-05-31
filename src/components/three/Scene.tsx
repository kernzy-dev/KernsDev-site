import { Canvas } from "@react-three/fiber";
import { useState, type Dispatch, type SetStateAction } from "react";
import { ContactShadows, SoftShadows, Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  SMAA,
  DepthOfField,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import * as THREE from "three";
import Building, { type BuildingPart } from "./Building";
import Landscape from "./Landscape";
import CameraRig from "./CameraRig";

type Props = {
  active: BuildingPart;
  setActive: Dispatch<SetStateAction<BuildingPart>>;
};

/**
 * Full 3D scene — Building + Landscape + golden-hour HDR environment +
 * post-processing pipeline (Bloom + Vignette + chromatic aberration + SMAA).
 */
export default function Scene({ active, setActive }: Props) {
  const [ready, setReady] = useState(true);

  if (!ready) {
    return (
      <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
        3D scene failed to start. The rest of the site still works.
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 32, near: 0.1, far: 200, position: [11, 7, 14] }}
      gl={{
        antialias: false,   // SMAA handles AA in post
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onError={() => setReady(false)}
    >
      {/* Soft shadows — PCSS approximation */}
      <SoftShadows size={25} samples={10} focus={0.6} />

      {/* Real PolyHaven HDR — drives the sky background AND image-based lighting.
          The single biggest realism upgrade available — atmospheric photo, not procedural. */}
      <Environment
        files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr"
        background
        environmentIntensity={1.0}
      />

      {/* LIGHTING — warm golden hour */}
      <hemisphereLight args={["#ffdcb0", "#3a4a2a", 0.85]} />
      <ambientLight intensity={0.55} color="#fff5e0" />

      <directionalLight
        position={[12, 14, 6]}
        intensity={2.3}
        color="#ffd9a0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      />

      <directionalLight position={[-8, 6, -4]} intensity={0.4} color="#a0c8ff" />

      {/* Brand-violet accent rim */}
      <pointLight position={[6, 1.5, 5]} intensity={1.4} distance={14} color="#a855f7" decay={1.6} />
      <pointLight position={[-7, 3, -5]} intensity={0.9} distance={12} color="#8b5cf6" decay={1.6} />

      {/* Ground contact shadow */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={20}
        blur={2.4}
        far={4}
        resolution={1024}
        color="#000000"
      />

      <Landscape />
      <Building active={active} setActive={setActive} />
      <CameraRig />

      {/* Atmospheric fog */}
      <fog attach="fog" args={["#d9b48a", 28, 60]} />

      {/* === POST-PROCESSING — turns "render" into "movie" === */}
      <EffectComposer multisampling={0}>
        {/* SMAA antialiasing (replaces canvas-level antialias for crisper edges) */}
        <SMAA />
        {/* Depth of Field — barely-there focus falloff. Building + most of the scene stay sharp,
            only the FAR distance (sky + far trees beyond ~30 units) gets a hint of softness. */}
        <DepthOfField
          focusDistance={0.025}
          focalLength={0.08}
          bokehScale={0.8}
        />
        {/* Bloom — makes the glowing windows / accents bleed light realistically */}
        <Bloom
          intensity={0.65}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        {/* Vignette — subtle darken at edges for cinematic framing */}
        <Vignette
          offset={0.25}
          darkness={0.55}
          blendFunction={BlendFunction.NORMAL}
        />
        {/* Chromatic aberration — tiny lens-style color separation */}
        <ChromaticAberration
          offset={new Vector2(0.0006, 0.0006)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}
