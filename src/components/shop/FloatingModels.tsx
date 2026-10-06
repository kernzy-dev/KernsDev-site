import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * FloatingModels — an ambient field of the store's product models drifting and
 * tumbling behind the printed dragon. Each model is merged into one geometry and
 * drawn as a single InstancedMesh (so the field is ~N_models draw calls, not
 * N_copies), tinted its own warm color.
 *
 * Perf: kept to LIGHT models only (the 1–2 MB cute-ghost / witch-dog meshes are
 * deliberately NOT in the field) and low instance counts, so it stays smooth on
 * any GPU. Reduced-motion → placed once, frozen.
 */

// Light models, ordered lightest-first so the mobile slice loads the smallest
// GLBs. Each carries a VIVID tint and is self-emissive (see materials below) so
// the field reads as glowing colored particles against the dark shop ground,
// not grey silhouettes swallowed by fog — one material per model keeps it ~one
// draw call each.
const MODELS = [
  { url: "/models/shop/geometric-planter.glb", color: "#2dd4bf" }, // teal
  { url: "/models/shop/dice-tower.glb", color: "#a855f7" }, // violet
  { url: "/models/shop/articulated-axolotl.glb", color: "#ec4899" }, // pink
  { url: "/models/shop/neutral-pumpkin.glb", color: "#f97316" }, // orange
  { url: "/models/shop/halloween-pumpkin-cat.glb", color: "#fbbf24" }, // gold
];

type Inst = {
  base: THREE.Vector3;
  scale: number;
  rot: THREE.Euler; // live, advanced each frame
  spin: THREE.Vector3; // rad/s on x,y,z
  amp: number; // drift amplitude
  freq: number; // drift speed
  phase: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Merge a GLTF scene's meshes into one centered, unit-sized BufferGeometry
 *  (position + normal only) so it can drive a single InstancedMesh. */
function mergedGeo(scene: THREE.Object3D): THREE.BufferGeometry | null {
  scene.updateMatrixWorld(true);
  const parts: THREE.BufferGeometry[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry?.getAttribute("position")) return;
    let g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const clean = new THREE.BufferGeometry();
    clean.setAttribute("position", g.getAttribute("position").clone());
    clean.setAttribute("normal", g.getAttribute("normal").clone());
    parts.push(clean);
    g.dispose();
  });
  if (!parts.length) return null;
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (parts.length > 1) parts.forEach((p) => p.dispose());
  if (!merged) return null;
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  merged.translate(-center.x, -center.y, -center.z);
  const s = 1 / (Math.max(size.x, size.y, size.z) || 1);
  merged.scale(s, s, s);
  return merged;
}

/** A random instance placed in a wide volume that fills the whole frame around
 *  (and slightly in front of) the dragon — a drifting particle field — while
 *  skipping the central column so the hero model + header copy stay clear. */
function makeInst(): Inst {
  let x = 0,
    y = 0,
    z = 0;
  for (let t = 0; t < 10; t++) {
    x = rand(-7.5, 7.5);
    y = rand(-4.5, 5.5);
    z = rand(-8, -0.3); // spread in depth, but not so close they blow up into blobs
    // keep clear of the hero dragon's column (centered on the camera axis)
    const nearAxis = x * x + z * z < 2.3 * 2.3;
    if (!(nearAxis && y > -0.5 && y < 3.8)) break;
  }
  return {
    base: new THREE.Vector3(x, y, z),
    scale: rand(0.3, 0.82), // smaller = more particle-like
    rot: new THREE.Euler(rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)),
    spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.4, 0.4)),
    amp: rand(0.2, 0.6),
    freq: rand(0.15, 0.5),
    phase: rand(0, 6.28),
  };
}

export default function FloatingModels({
  animate = true,
  mobile = false,
}: {
  animate?: boolean;
  mobile?: boolean;
}) {
  // Mobile: fewer distinct models (3 lightest) to cut GLB fetches + draw calls.
  const models = useMemo(() => (mobile ? MODELS.slice(0, 3) : MODELS), [mobile]);
  const urls = useMemo(() => models.map((m) => m.url), [models]);
  const gltfs = useGLTF(urls) as unknown as { scene: THREE.Object3D }[];
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // One vivid material per model — strongly self-emissive in its own hue so each
  // model glows as a colored "particle" and keeps its color even out in the fog
  // (lit shading alone read as grey/black against the dark ground). A little
  // diffuse on top keeps some form/shading so they don't look flat.
  const materials = useMemo(
    () =>
      models.map((m) => {
        const c = new THREE.Color(m.color);
        return new THREE.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 0.9,
          roughness: 0.45,
          metalness: 0.0,
          toneMapped: false, // let the vivid hues pop instead of being rolled off
        });
      }),
    [models],
  );

  const geos = useMemo(
    () =>
      gltfs.map((g, i) => {
        const geo = g?.scene ? mergedGeo(g.scene) : null;
        if (!geo) console.warn("[FloatingModels] merge produced nothing, skipping", urls[i]);
        return geo;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gltfs],
  );

  // A fuller field now that each model is a small self-lit particle: ~12 mobile,
  // ~20 narrow, ~28 wide. Still instanced (≈5 draw calls total) so it stays smooth.
  const insts = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1280;
    const total = mobile ? 12 : w >= 1024 ? 28 : 20;
    const n = geos.length || 1;
    const buckets: Inst[][] = geos.map(() => []);
    for (let i = 0; i < total; i++) {
      if (geos[i % n]) buckets[i % n].push(makeInst());
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geos, mobile]);

  const write = (i: number, now: number) => {
    const mesh = meshes.current[i];
    const list = insts[i];
    if (!mesh || !list) return;
    for (let j = 0; j < list.length; j++) {
      const p = list[j];
      const dy = Math.sin(now * p.freq + p.phase) * p.amp;
      const dx = Math.cos(now * p.freq * 0.7 + p.phase) * p.amp * 0.5;
      dummy.position.set(p.base.x + dx, p.base.y + dy, p.base.z);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(j, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => {
    const now = performance.now() / 1000;
    for (let i = 0; i < insts.length; i++) write(i, now);
    const n = insts.reduce((a, b) => a + b.length, 0);
    console.info(
      `[FloatingModels] ${n} instances across ${geos.filter(Boolean).length}/${urls.length} models${mobile ? " (mobile)" : ""}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insts]);

  useFrame((_, dt) => {
    if (!animate) return;
    const now = performance.now() / 1000;
    for (let i = 0; i < insts.length; i++) {
      const list = insts[i];
      for (let j = 0; j < list.length; j++) {
        list[j].rot.x += list[j].spin.x * dt;
        list[j].rot.y += list[j].spin.y * dt;
        list[j].rot.z += list[j].spin.z * dt;
      }
      write(i, now);
    }
  });

  // Dispose merged geometries + the per-model materials on unmount.
  useEffect(() => {
    return () => {
      geos.forEach((g) => g?.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [geos, materials]);

  return (
    <group>
      {geos.map((geo, i) =>
        geo && insts[i]?.length ? (
          <instancedMesh
            key={urls[i]}
            ref={(el) => {
              meshes.current[i] = el;
            }}
            args={[geo, materials[i], insts[i].length]}
            frustumCulled={false}
          />
        ) : null,
      )}
    </group>
  );
}

// Preload the 3 mobile models (used on every device); desktop fetches the other
// two when the hero mounts.
MODELS.slice(0, 3).forEach((m) => useGLTF.preload(m.url));
