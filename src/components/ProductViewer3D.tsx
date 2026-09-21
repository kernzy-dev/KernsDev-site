import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, Html, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/** Drag-to-rotate 360° product viewer, shown in a modal over the shop.
 *  Loaded lazily (three.js + the GLB only download when a customer opens it). */

function Model({ url, color }: { url: string; color?: string }) {
  const { scene } = useGLTF(url);
  // Clone so we can repaint without mutating the cached GLTF, and give every
  // mesh the product's filament color + soft matte finish.
  const model = useMemo(() => {
    const c = scene.clone(true);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`#${color || "b8b8c2"}`),
      roughness: 0.55,
      metalness: 0.04,
    });
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = mat;
        // Decimation/export can drop normals — without them the mesh renders
        // unlit (black). Recompute so the lighting reads.
        if (!m.geometry.getAttribute("normal")) m.geometry.computeVertexNormals();
      }
    });
    return c;
  }, [scene, color]);
  return <primitive object={model} />;
}

function Loader() {
  return (
    <Html center>
      <div className="text-neutral-400 text-sm animate-pulse">Loading 3D…</div>
    </Html>
  );
}

export default function ProductViewer3D({
  url,
  color,
  name,
  onClose,
}: {
  url: string;
  color?: string;
  name: string;
  onClose: () => void;
}) {
  // Esc to close + lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`3D preview of ${name}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-[4/3] bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <span className="text-sm font-display font-semibold text-neutral-100">{name}</span>
          <button
            onClick={onClose}
            aria-label="Close 3D preview"
            className="pointer-events-auto grid place-items-center h-8 w-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <Canvas shadows dpr={[1, 2]} camera={{ position: [2.6, 1.9, 3.6], fov: 35 }}>
          <hemisphereLight args={["#ffffff", "#3a3a46", 0.65]} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-6, 4, -5]} intensity={0.85} color="#a855f7" />
          <directionalLight position={[4, 2, 6]} intensity={0.5} />
          <Suspense fallback={<Loader />}>
            <Center>
              <Model url={url} color={color} />
            </Center>
            <ContactShadows
              position={[0, -1.05, 0]}
              opacity={0.35}
              scale={6}
              blur={2.4}
              far={3}
            />
          </Suspense>
          <OrbitControls
            autoRotate
            autoRotateSpeed={1.1}
            enablePan={false}
            enableZoom
            minDistance={2.2}
            maxDistance={8}
            minPolarAngle={Math.PI * 0.12}
            maxPolarAngle={Math.PI * 0.86}
          />
        </Canvas>

        <div className="absolute bottom-0 inset-x-0 text-center py-2.5 text-xs text-neutral-400 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          Drag to rotate · scroll to zoom
        </div>
      </div>
    </div>
  );
}
