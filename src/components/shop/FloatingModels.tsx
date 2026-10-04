import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * FloatingModels — an ambient field of the store's real product models drifting
 * in the air and tumbling on all three axes behind the printed dragon, like a
 * particle field made of actual products.
 *
 * Performance: each distinct model's meshes are merged into ONE geometry and
 * drawn as a single InstancedMesh, so the whole field is ~N_models draw calls
 * (not N_copies). All instances share one muted material so they recede behind
 * the warm hero dragon and never bloom. Reduced-motion → placed once, frozen.
 */

const URLS = [
  "/models/shop/articulated-axolotl.glb",
  "/models/shop/halloween-cute-ghost.glb",
  "/models/shop/halloween-pumpkin-cat.glb",
  "/models/shop/halloween-witch-dog.glb",
  "/models/shop/christmas-nutcracker.glb",
  "/models/shop/dice-tower.glb",
  "/models/shop/neutral-pumpkin.glb",
  "/models/shop/geometric-planter.glb",
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
  merged.scale(
    1 / (Math.max(size.x, size.y, size.z) || 1),
    1 / (Math.max(size.x, size.y, size.z) || 1),
    1 / (Math.max(size.x, size.y, size.z) || 1),
  );
  return merged;
}

/** A random instance placed in a volume behind the dragon, skipping the central
 *  cylinder so the hero model + header text stay clear. */
function makeInst(): Inst {
  let x = 0,
    y = 0,
    z = 0;
  // Keep inside the camera frustum at these depths and out of the central hero
  // zone, so they frame the dragon on-screen instead of landing off-frame/too deep.
  for (let t = 0; t < 8; t++) {
    x = rand(-5.5, 5.5);
    y = rand(-1, 5);
    z = rand(-9, -2.5);
    if (!(Math.abs(x) < 1.9 && z > -5)) break; // keep clear of the hero dragon
  }
  return {
    base: new THREE.Vector3(x, y, z),
    scale: rand(0.5, 1.3),
    rot: new THREE.Euler(rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)),
    spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.4, 0.4)),
    amp: rand(0.12, 0.4),
    freq: rand(0.2, 0.6),
    phase: rand(0, 6.28),
  };
}

export default function FloatingModels({ animate = true }: { animate?: boolean }) {
  const gltfs = useGLTF(URLS) as unknown as { scene: THREE.Object3D }[];
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Light body + soft self-emissive so they clearly read against the dark
        // shop ground no matter how scene lights reach the back, but stay under
        // the Bloom threshold (1.0) so they don't glow/compete with the dragon.
        color: new THREE.Color("#d4cde0"),
        emissive: new THREE.Color("#514a60"),
        emissiveIntensity: 0.45,
        roughness: 0.7,
        metalness: 0.05,
      }),
    [],
  );

  const geos = useMemo(
    () =>
      gltfs.map((g, i) => {
        const geo = g?.scene ? mergedGeo(g.scene) : null;
        if (!geo) console.warn("[FloatingModels] merge produced nothing, skipping", URLS[i]);
        return geo;
      }),
    [gltfs],
  );

  // Distribute ~16 (narrow) or ~26 (wide) copies across the models.
  const insts = useMemo(() => {
    const wide = typeof window !== "undefined" && window.innerWidth >= 1024;
    const total = wide ? 26 : 16;
    const buckets: Inst[][] = URLS.map(() => []);
    for (let i = 0; i < total; i++) {
      if (geos[i % geos.length]) buckets[i % geos.length].push(makeInst());
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geos]);

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

  // Place once on mount (and whenever frozen) so the first frame isn't at origin.
  useEffect(() => {
    const now = performance.now() / 1000;
    for (let i = 0; i < insts.length; i++) write(i, now);
    const n = insts.reduce((a, b) => a + b.length, 0);
    console.info(
      `[FloatingModels] ${n} instances across ${geos.filter(Boolean).length}/${URLS.length} models`,
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

  // Dispose merged geometries + the shared material on unmount.
  useEffect(() => {
    return () => {
      geos.forEach((g) => g?.dispose());
      material.dispose();
    };
  }, [geos, material]);

  return (
    <group>
      {geos.map((geo, i) =>
        geo && insts[i]?.length ? (
          <instancedMesh
            key={URLS[i]}
            ref={(el) => {
              meshes.current[i] = el;
            }}
            args={[geo, material, insts[i].length]}
            frustumCulled={false}
          />
        ) : null,
      )}
    </group>
  );
}

URLS.forEach((u) => useGLTF.preload(u));
