import { useRef, type Dispatch, type SetStateAction } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural building. Each hoverable mesh sets the active part state,
 * which the parent uses to render an HTML tooltip over the canvas.
 */
export type BuildingPart = "foundation" | "walls" | "roof" | null;

type Props = {
  active: BuildingPart;
  setActive: Dispatch<SetStateAction<BuildingPart>>;
};

const HIGHLIGHT = "#F97316";

export default function Building({ active, setActive }: Props) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.08;
  });

  const onOver =
    (part: Exclude<BuildingPart, null>) =>
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setActive(part);
      document.body.style.cursor = "pointer";
    };

  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setActive(null);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef}>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>

      {/* === FOUNDATION (Honest) === */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.25, 0]}
        onPointerOver={onOver("foundation")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[4.4, 0.5, 3.4]} />
        <meshStandardMaterial
          color="#1f2937"
          emissive={active === "foundation" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "foundation" ? 0.55 : 0}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* === WALLS (Fast) === */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 1.5, 0]}
        onPointerOver={onOver("walls")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[3.8, 2.0, 2.8]} />
        <meshStandardMaterial
          color="#262626"
          emissive={active === "walls" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "walls" ? 0.55 : 0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Glowing windows (decorative) */}
      {[-1, 0, 1].map((x) => (
        <mesh key={`w-front-${x}`} position={[x, 1.5, 1.41]}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}
      {[-0.5, 0.5].map((z) => (
        <mesh
          key={`w-side-${z}`}
          position={[1.91, 1.5, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.5, 0.7]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}

      {/* === ROOF (Detail-oriented) — pyramid === */}
      <mesh
        castShadow
        position={[0, 3.0, 0]}
        rotation={[0, Math.PI / 4, 0]}
        onPointerOver={onOver("roof")}
        onPointerOut={onOut}
      >
        <coneGeometry args={[2.7, 1.4, 4]} />
        <meshStandardMaterial
          color="#3f3f46"
          emissive={active === "roof" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "roof" ? 0.55 : 0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Chimney */}
      <mesh castShadow position={[1.2, 3.6, 0.5]}>
        <boxGeometry args={[0.35, 0.7, 0.35]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
    </group>
  );
}
