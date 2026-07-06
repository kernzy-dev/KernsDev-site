import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useStonePBR, useRoofPBR } from "./PBRMaterials";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Georgian / Colonial-style mansion.
 *
 * Footprint (top-down looking from above):
 *   ┌──────┐ ┌────────────┐ ┌──────┐
 *   │ WING │ │ MAIN BLOCK │ │ WING │
 *   │      │ │ (3 stories)│ │      │
 *   └──────┘ │ + Portico  │ └──────┘
 *            └────────────┘
 *
 * Three hover zones (unchanged value mapping):
 *   - Foundation  → Honest
 *   - Walls (main + wings combined) → Fast
 *   - Roof (main hip + wing roofs + dormers) → Detail-oriented
 *
 * Decorative elements (porch, columns, pediment, chimneys, windows, doors,
 * cornice trim, dormer windows) don't fire hover events — keeps the hover
 * intent simple.
 */
export type BuildingPart = "foundation" | "walls" | "roof" | null;

type Props = {
  active: BuildingPart;
  setActive: Dispatch<SetStateAction<BuildingPart>>;
};

const HIGHLIGHT = "#a855f7";
const WARM_GLOW = "#fbbf24";

// --- Dimensions (kept tunable up here so it's easy to reshape) ---
const MAIN_W = 5.2;
const MAIN_H = 3.6;     // taller — 3 floors
const MAIN_D = 3.4;
const WING_W = 2.6;
const WING_H = 2.6;     // 2 floors
const WING_D = 2.8;
const WING_OFFSET_X = (MAIN_W / 2) + (WING_W / 2);

// Floor heights for window placement
const FLOOR_Y = [0.95, 2.05, 3.05] as const;
const WING_FLOOR_Y = [0.95, 2.05] as const;

export default function Building({ active, setActive }: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const stonePBR = useStonePBR();
  const roofPBR = useRoofPBR();
  const reduced = useReducedMotion();

  useFrame((state) => {
    if (!groupRef.current || reduced) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.05;
  });

  // Reset the body cursor if we unmount while a part was still hovered — otherwise
  // pointerOut never fires (WebGL crash → error boundary swap, canvas scrolled
  // off-screen without a mousemove, etc.) and the "pointer" cursor sticks
  // globally for the rest of the page.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

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

  // --- Reusable bits ---
  const Window = ({
    position,
    width = 0.55,
    height = 0.75,
    rotation = [0, 0, 0] as [number, number, number],
    glowMul = 1,
  }: {
    position: [number, number, number];
    width?: number;
    height?: number;
    rotation?: [number, number, number];
    glowMul?: number;
  }) => (
    // The whole window protrudes from the wall as a small box (no coplanar
    // planes => no z-fighting). Layered z-positions are spaced 1-2cm apart,
    // well outside floating-point precision range.
    <group position={position} rotation={rotation}>
      {/* Inset frame — small box that sticks out from the wall */}
      <mesh castShadow>
        <boxGeometry args={[width + 0.12, height + 0.12, 0.05]} />
        <meshStandardMaterial color="#1a0f06" roughness={0.55} />
      </mesh>
      {/* Glow pane — low roughness so the HDR environment reflects subtly off it,
          giving a glass-like sheen on top of the warm interior glow. */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={WARM_GLOW}
          emissive={WARM_GLOW}
          emissiveIntensity={0.55 * glowMul}
          roughness={0.15}
          metalness={0.0}
          envMapIntensity={1.8}
        />
      </mesh>
      {/* Cross mullions, 1 cm in front of the glow pane */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width, 0.025, 0.012]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.025, height, 0.012]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} />
      </mesh>
    </group>
  );

  const Column = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      {/* Base */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.36, 0.2, 0.36]} />
        <meshStandardMaterial color="#e8dcc1" roughness={0.7} />
      </mesh>
      {/* Shaft (fluted via cylinderGeometry approximation) */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 2.5, 16]} />
        <meshStandardMaterial color="#f0e4cc" roughness={0.65} />
      </mesh>
      {/* Capital */}
      <mesh castShadow position={[0, 2.75, 0]}>
        <boxGeometry args={[0.32, 0.15, 0.32]} />
        <meshStandardMaterial color="#e8dcc1" roughness={0.7} />
      </mesh>
    </group>
  );

  return (
    <group ref={groupRef}>
      {/* === FOUNDATION (Honest) — wide stone base + non-overlapping wider footer === */}
      {/* Wider stepped footer at ground level (range y: 0 → 0.08) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.04, 0]}
        onPointerOver={onOver("foundation")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[MAIN_W + WING_W * 2 + 0.6, 0.08, MAIN_D + 0.6]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      {/* Main foundation sits on top of the footer (range y: 0.08 → 0.40) — no overlap */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.24, 0]}
        onPointerOver={onOver("foundation")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[MAIN_W + WING_W * 2 + 0.4, 0.32, MAIN_D + 0.4]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.85} />
      </mesh>

      {/* === WALLS (Fast) — MAIN BLOCK, 3 stories, limestone === */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.40 + MAIN_H / 2, 0]}
        onPointerOver={onOver("walls")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[MAIN_W, MAIN_H, MAIN_D]} />
        <meshStandardMaterial
          {...stonePBR}
          emissive={active === "walls" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "walls" ? 0.4 : 0}
          metalness={0.0}
        />
      </mesh>

      {/* === WALLS — LEFT WING === */}
      <mesh
        castShadow
        receiveShadow
        position={[-WING_OFFSET_X, 0.40 + WING_H / 2, 0]}
        onPointerOver={onOver("walls")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[WING_W, WING_H, WING_D]} />
        <meshStandardMaterial
          {...stonePBR}
          emissive={active === "walls" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "walls" ? 0.4 : 0}
          metalness={0.0}
        />
      </mesh>

      {/* === WALLS — RIGHT WING === */}
      <mesh
        castShadow
        receiveShadow
        position={[WING_OFFSET_X, 0.40 + WING_H / 2, 0]}
        onPointerOver={onOver("walls")}
        onPointerOut={onOut}
      >
        <boxGeometry args={[WING_W, WING_H, WING_D]} />
        <meshStandardMaterial
          {...stonePBR}
          emissive={active === "walls" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "walls" ? 0.4 : 0}
          metalness={0.0}
        />
      </mesh>

      {/* Cornice trim between main floors */}
      {[1.45, 2.55].map((y) => (
        <mesh key={`cornice-${y}`} castShadow position={[0, 0.40 + y, 0]}>
          <boxGeometry args={[MAIN_W + 0.15, 0.08, MAIN_D + 0.15]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.7} />
        </mesh>
      ))}

      {/* Top cornice / roofline trim on main */}
      <mesh castShadow position={[0, 0.40 + MAIN_H + 0.06, 0]}>
        <boxGeometry args={[MAIN_W + 0.25, 0.16, MAIN_D + 0.25]} />
        <meshStandardMaterial color="#d4c4a0" roughness={0.7} />
      </mesh>

      {/* Cornice on wings */}
      {[-1, 1].map((side) => (
        <mesh key={`wing-cornice-${side}`} castShadow position={[side * WING_OFFSET_X, 0.40 + WING_H + 0.04, 0]}>
          <boxGeometry args={[WING_W + 0.2, 0.12, WING_D + 0.2]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.7} />
        </mesh>
      ))}

      {/* === FRONT WINDOWS — main block, 3 floors × 5 windows (symmetric) === */}
      {FLOOR_Y.map((y) =>
        [-1.85, -0.95, 0, 0.95, 1.85].map((x) => {
          // Skip the center ground-floor slot — that's the entrance door
          if (y === FLOOR_Y[0] && x === 0) return null;
          return (
            <Window
              key={`fw-${y}-${x}`}
              position={[x, y, MAIN_D / 2 + 0.025]}
              width={0.55}
              height={0.75}
            />
          );
        }),
      )}

      {/* === FRONT WINDOWS — wings === */}
      {WING_FLOOR_Y.map((y) =>
        [-1, 1].map((side) =>
          [-0.55, 0.55].map((dx) => (
            <Window
              key={`ww-${y}-${side}-${dx}`}
              position={[side * WING_OFFSET_X + dx, y, WING_D / 2 + 0.025]}
              width={0.45}
              height={0.65}
            />
          )),
        ),
      )}

      {/* === SIDE WINDOWS — main block, 2 per side per floor (just front 2 floors) === */}
      {[FLOOR_Y[0], FLOOR_Y[1]].map((y) =>
        [-1, 1].map((side) =>
          [0.7, -0.7].map((z) => (
            <Window
              key={`side-main-${y}-${side}-${z}`}
              position={[side * (MAIN_W / 2 + 0.025), y, z]}
              rotation={[0, side * (Math.PI / 2), 0]}
              width={0.45}
              height={0.6}
              glowMul={0.7}
            />
          )),
        ),
      )}

      {/* === GRAND ENTRANCE — Double door as a single box protruding from wall === */}
      {/* Outer door frame */}
      <mesh castShadow position={[0, 1.0, MAIN_D / 2 + 0.04]}>
        <boxGeometry args={[1.18, 1.88, 0.04]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} />
      </mesh>
      {/* Door slabs themselves — slightly inset */}
      <mesh castShadow position={[0, 1.0, MAIN_D / 2 + 0.07]}>
        <boxGeometry args={[1.0, 1.7, 0.04]} />
        <meshStandardMaterial color="#1a0f06" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Door split line (centered, 1 cm in front of doors) */}
      <mesh position={[0, 1.0, MAIN_D / 2 + 0.095]}>
        <boxGeometry args={[0.02, 1.65, 0.01]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.5} />
      </mesh>
      {/* Door knockers */}
      {[-0.2, 0.2].map((x) => (
        <mesh key={`knocker-${x}`} castShadow position={[x, 1.0, MAIN_D / 2 + 0.105]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshStandardMaterial color={HIGHLIGHT} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Transom window above door */}
      <Window
        position={[0, 2.0, MAIN_D / 2 + 0.025]}
        width={0.95}
        height={0.35}
        glowMul={0.9}
      />

      {/* === GRAND PORTICO (covered entrance with columns + pediment) === */}
      {/* Floor of portico — steps */}
      <mesh castShadow receiveShadow position={[0, 0.4, MAIN_D / 2 + 0.8]}>
        <boxGeometry args={[2.4, 0.12, 1.5]} />
        <meshStandardMaterial color="#c0b298" roughness={0.85} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.28, MAIN_D / 2 + 1.4]}>
        <boxGeometry args={[2.6, 0.12, 0.35]} />
        <meshStandardMaterial color="#b0a288" roughness={0.85} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.16, MAIN_D / 2 + 1.55]}>
        <boxGeometry args={[2.8, 0.12, 0.25]} />
        <meshStandardMaterial color="#a09278" roughness={0.85} />
      </mesh>

      {/* 4 columns */}
      <Column position={[-1.0, 0.46, MAIN_D / 2 + 1.4]} />
      <Column position={[-0.4, 0.46, MAIN_D / 2 + 1.4]} />
      <Column position={[0.4, 0.46, MAIN_D / 2 + 1.4]} />
      <Column position={[1.0, 0.46, MAIN_D / 2 + 1.4]} />

      {/* Architrave (horizontal beam on top of columns) */}
      <mesh castShadow position={[0, 3.3, MAIN_D / 2 + 1.4]}>
        <boxGeometry args={[2.4, 0.25, 0.4]} />
        <meshStandardMaterial color="#e8dcc1" roughness={0.7} />
      </mesh>

      {/* Triangular pediment (front-facing triangle) */}
      <mesh castShadow position={[0, 3.85, MAIN_D / 2 + 1.4]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.35, 3]} />
        <meshStandardMaterial color="#e8dcc1" roughness={0.7} />
      </mesh>
      {/* Tint the pediment to the right scale visually — wrap in scale */}

      {/* === ROOF (Detail-oriented) — Hip roof on main, side roofs on wings === */}
      {/* Main hip roof — extruded box shape, but use cone-quad for simplicity */}
      <mesh
        castShadow
        position={[0, 0.40 + MAIN_H + 0.7, 0]}
        rotation={[0, Math.PI / 4, 0]}
        onPointerOver={onOver("roof")}
        onPointerOut={onOut}
      >
        <coneGeometry args={[MAIN_W * 0.78, 1.4, 4]} />
        <meshStandardMaterial
          {...roofPBR}
          emissive={active === "roof" ? HIGHLIGHT : "#000000"}
          emissiveIntensity={active === "roof" ? 0.4 : 0}
          metalness={0.0}
        />
      </mesh>

      {/* Ridge accent ball */}
      <mesh castShadow position={[0, 0.40 + MAIN_H + 1.45, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={HIGHLIGHT} emissive={HIGHLIGHT} emissiveIntensity={0.6} />
      </mesh>

      {/* Wing roofs — flat-top hip-style */}
      {[-1, 1].map((side) => (
        <mesh
          key={`wing-roof-${side}`}
          castShadow
          position={[side * WING_OFFSET_X, 0.40 + WING_H + 0.4, 0]}
          rotation={[0, Math.PI / 4, 0]}
          onPointerOver={onOver("roof")}
          onPointerOut={onOut}
        >
          <coneGeometry args={[WING_W * 0.85, 0.8, 4]} />
          <meshStandardMaterial
            {...roofPBR}
            emissive={active === "roof" ? HIGHLIGHT : "#000000"}
            emissiveIntensity={active === "roof" ? 0.4 : 0}
          />
        </mesh>
      ))}

      {/* === DORMERS — 3 across the front of the main roof === */}
      {[-1.5, 0, 1.5].map((x) => (
        <group key={`dormer-${x}`} position={[x, 0.40 + MAIN_H + 0.5, MAIN_D / 2 - 0.2]}>
          {/* Dormer box */}
          <mesh
            castShadow
            onPointerOver={onOver("roof")}
            onPointerOut={onOut}
          >
            <boxGeometry args={[0.9, 0.65, 0.6]} />
            <meshStandardMaterial {...stonePBR} />
          </mesh>
          {/* Dormer roof — small pyramid */}
          <mesh
            castShadow
            position={[0, 0.45, 0]}
            rotation={[0, Math.PI / 4, 0]}
            onPointerOver={onOver("roof")}
            onPointerOut={onOut}
          >
            <coneGeometry args={[0.7, 0.35, 4]} />
            <meshStandardMaterial {...roofPBR} />
          </mesh>
          {/* Dormer window */}
          <mesh position={[0, 0, 0.31]}>
            <planeGeometry args={[0.45, 0.45]} />
            <meshStandardMaterial color={WARM_GLOW} emissive={WARM_GLOW} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* === CHIMNEYS === */}
      {[-WING_OFFSET_X, WING_OFFSET_X].map((x) => (
        <group key={`chim-${x}`} position={[x, 0.40 + WING_H + 0.9, -0.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 1.0, 0.5]} />
            <meshStandardMaterial color="#6b3a25" roughness={0.85} />
          </mesh>
          {/* Cap */}
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[0.6, 0.08, 0.6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* === INTERIOR LIGHTS — softly bleed out through every window === */}
      <pointLight position={[0, 1.5, 0]} intensity={1.4} distance={4} color="#fbbf24" />
      <pointLight position={[0, 2.5, 0]} intensity={1.0} distance={3.5} color="#fbbf24" />
      {[-1, 1].map((side) => (
        <pointLight
          key={`int-${side}`}
          position={[side * WING_OFFSET_X, 1.5, 0]}
          intensity={0.9}
          distance={3}
          color="#fbbf24"
        />
      ))}
    </group>
  );
}
