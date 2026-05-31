import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Loads PBR texture sets from PolyHaven (CC0, free, browser-cacheable).
 * Each material has diffuse + normal + roughness + ambient-occlusion maps,
 * configured with appropriate tiling/repeat for the surface it covers.
 */

const HOST = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg";

function urls(name: string, size: "1k" | "2k" = "2k") {
  return {
    map:          `${HOST}/${size}/${name}/${name}_diff_${size}.jpg`,
    normalMap:    `${HOST}/${size}/${name}/${name}_nor_gl_${size}.jpg`,
    roughnessMap: `${HOST}/${size}/${name}/${name}_rough_${size}.jpg`,
    aoMap:        `${HOST}/${size}/${name}/${name}_ao_${size}.jpg`,
  };
}

function applyRepeat(textures: Record<string, THREE.Texture>, repeat: number) {
  for (const t of Object.values(textures)) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = 8;
  }
}

/** Hook → PBR set for the mansion stone walls. */
export function useStonePBR() {
  const tex = useTexture(urls("castle_brick_07"));
  return useMemo(() => {
    applyRepeat(tex, 2);
    return tex;
  }, [tex]);
}

/** Hook → PBR set for the asphalt roof shingles. Tiled tighter. */
export function useRoofPBR() {
  const tex = useTexture(urls("roof_09"));
  return useMemo(() => {
    applyRepeat(tex, 4);
    return tex;
  }, [tex]);
}

/** Hook → PBR set for the grass ground. Tiled aggressively because plane is huge. */
export function useGrassPBR() {
  const tex = useTexture(urls("forrest_ground_01"));
  return useMemo(() => {
    applyRepeat(tex, 24);
    return tex;
  }, [tex]);
}

/** Hook → PBR set for the asphalt driveway. */
export function useAsphaltPBR() {
  const tex = useTexture(urls("asphalt_02"));
  return useMemo(() => {
    applyRepeat(tex, 3);
    return tex;
  }, [tex]);
}
