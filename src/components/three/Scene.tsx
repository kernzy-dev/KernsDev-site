import { Canvas } from "@react-three/fiber";
import { useState, type Dispatch, type SetStateAction } from "react";
import Building, { type BuildingPart } from "./Building";
import CameraRig from "./CameraRig";

type Props = {
  active: BuildingPart;
  setActive: Dispatch<SetStateAction<BuildingPart>>;
};

/**
 * Encapsulates the R3F Canvas + scene. Imported lazily so the parent can
 * decide (based on WebGL availability) whether to load this code at all.
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
      camera={{ fov: 35, near: 0.1, far: 100, position: [7, 5.5, 9] }}
      gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
      onError={() => setReady(false)}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-6, 4, -3]} intensity={0.6} color="#F97316" />
      <pointLight position={[6, 2, 5]} intensity={0.4} color="#8b5cf6" />

      <Building active={active} setActive={setActive} />
      <CameraRig />
    </Canvas>
  );
}
