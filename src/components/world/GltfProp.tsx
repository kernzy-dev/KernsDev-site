import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** Per-mesh material overrides — applied to EVERY mesh in the model. */
  materialOverrides?: {
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
    envMapIntensity?: number;
    roughness?: number;
    metalness?: number;
  };
};

/**
 * Rewrite Poly Haven texture URLs. Their .gltf files reference textures at
 * `textures/…jpg` (relative to a `textures/` subfolder that only exists in
 * the downloadable zip). On the CDN, the actual textures live at
 * `.../Models/jpg/{res}/{slug}/…jpg`, one level up and across from the GLTF.
 * Without this rewrite, drei's loader 404s every texture.
 */
function rewritePolyHavenUrl(url: string): string {
  // .../Models/gltf/1k/Lantern_01/textures/foo.jpg  →  .../Models/jpg/1k/Lantern_01/foo.jpg
  return url.replace(
    /\/Models\/gltf\/(\dk)\/([^/]+)\/textures\//,
    "/Models/jpg/$1/$2/",
  );
}

const extendLoader = (loader: { manager: THREE.LoadingManager }) => {
  loader.manager.setURLModifier(rewritePolyHavenUrl);
};

/**
 * Loads a real GLTF from a CC0 CDN URL (Poly Haven) via drei's `useGLTF`.
 * Clones the scene so multiple instances don't share transforms, and applies
 * shadow flags + optional material tweaks — the HDRI-lit brass looks flat by
 * default; a nudge of `emissive` + high `envMapIntensity` sells the moody
 * night frame.
 *
 * Suspense-friendly: drei's useGLTF throws a promise until the fetch resolves,
 * so any parent <Suspense fallback=…> handles the loading state.
 */
export default function GltfProp({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  materialOverrides,
}: Props) {
  const { scene } = useGLTF(url, true, false, extendLoader);
  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (materialOverrides && mesh.material instanceof THREE.MeshStandardMaterial) {
          const m = mesh.material.clone();
          if (materialOverrides.emissive !== undefined) {
            m.emissive = new THREE.Color(materialOverrides.emissive);
          }
          if (materialOverrides.emissiveIntensity !== undefined) {
            m.emissiveIntensity = materialOverrides.emissiveIntensity;
          }
          if (materialOverrides.envMapIntensity !== undefined) {
            m.envMapIntensity = materialOverrides.envMapIntensity;
          }
          if (materialOverrides.roughness !== undefined) {
            m.roughness = materialOverrides.roughness;
          }
          if (materialOverrides.metalness !== undefined) {
            m.metalness = materialOverrides.metalness;
          }
          mesh.material = m;
        }
      }
    });
    return s;
  }, [scene, materialOverrides]);

  const s = typeof scale === "number" ? ([scale, scale, scale] as [number, number, number]) : scale;

  return (
    <group position={position} rotation={rotation} scale={s}>
      <primitive object={cloned} />
    </group>
  );
}
