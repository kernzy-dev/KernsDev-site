import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import useReducedMotion from "../../hooks/useReducedMotion";
import { BOOT_LINES, BOOT_SESSION_FLAG } from "./bootData";
import type { BootLine } from "./bootData";

/**
 * BootScene — R30 replaces R26's 2D DOM BootSequence overlay with a 3D
 * bash/terminal loader that lives INSIDE an R3F Canvas.
 *
 * Layout:
 *   - Dark ambient scene (void-black background, cool cyan uplight, subtle
 *     drifting Sparkles for texture)
 *   - Floating rounded panel = CRT-style screen, cyan emissive under-glow
 *   - Terminal text rendered via drei's <Html transform> so the DOM text is
 *     positioned on the screen quad in 3D space and inherits its camera
 *     movement (dolly + subtle rotation) — DOM composition benefits, 3D
 *     placement benefits.
 *   - Slow forward dolly during the boot (the world "moves toward you" as
 *     services come online).
 *
 * State machine reuses the R26 pattern: linesShown + typedChars for the
 * first prompt's typewriter, then per-line delays. Reduced-motion / repeat-
 * session flag (kdv_booted_v1) both short-circuit to onDone.
 *
 * LIGHT budget: no post-processing composer, one Canvas, ~5 lights + 2 planes
 * + Sparkles. AdaptiveDpr on. Cost is meant to be dwarfed by CaveScene later.
 */

type Props = { onDone: () => void };

export default function BootScene({ onDone }: Props) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [linesShown, setLinesShown] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const skippedRef = useRef(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(BOOT_SESSION_FLAG, "1");
    } catch {
      /* private mode — ignore */
    }
    // Kill the pre-boot overlay on any skip path — if BootScene was
    // skipped before its Canvas mounted, onCreated never fired.
    try {
      const w = window as unknown as { __preBootHide?: () => void };
      w.__preBootHide?.();
    } catch {
      /* ignore */
    }
    setVisible(false);
    setTimeout(onDone, 360);
  };

  // Already booted this session, or reduced-motion → skip.
  useEffect(() => {
    let already = false;
    // `?forceboot=1` (or ?forceboot) bypasses the sessionStorage-skip so
    // Grant / anyone reviewing can replay the boot without opening a new
    // incognito tab. Matches the ?skipintro=1 / ?debug=1 URL-flag pattern.
    let forced = false;
    try {
      const p = new URLSearchParams(window.location.search);
      forced = p.get("forceboot") === "1" || p.has("forceboot");
    } catch {
      /* ignore */
    }
    if (!forced) {
      try {
        already = sessionStorage.getItem(BOOT_SESSION_FLAG) === "1";
      } catch {
        /* ignore */
      }
    }
    if (already || reduced) {
      doneRef.current = true;
      setVisible(false);
      // Kill the pre-boot overlay too — Canvas won't mount to trigger
      // onCreated on the skip path.
      try {
        const w = window as unknown as { __preBootHide?: () => void };
        w.__preBootHide?.();
      } catch {
        /* ignore */
      }
      Promise.resolve().then(onDone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any key or click skips.
  useEffect(() => {
    if (!visible) return;
    const skip = () => {
      if (skippedRef.current) return;
      skippedRef.current = true;
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Drive the sequence — typewriter for the first prompt then per-line delays.
  useEffect(() => {
    if (!visible || doneRef.current) return;

    if (linesShown === 0) {
      const promptLine = BOOT_LINES[0] as Extract<BootLine, { kind: "prompt" }>;
      if (typedChars < promptLine.text.length) {
        const t = setTimeout(() => setTypedChars((c) => c + 1), promptLine.type ?? 22);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setLinesShown(1), 220);
      return () => clearTimeout(t);
    }

    if (linesShown < BOOT_LINES.length) {
      const next = BOOT_LINES[linesShown];
      const delay =
        (next.kind === "out" && next.delay) ||
        (next.kind === "service" && next.delay) ||
        (next.kind === "blank" && next.delay) ||
        140;
      const t = setTimeout(() => setLinesShown((n) => n + 1), delay);
      return () => clearTimeout(t);
    }

    // All lines done — short held beat, then finish.
    const t = setTimeout(finish, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, linesShown, typedChars]);

  if (!visible) return null;

  const promptLine = BOOT_LINES[0] as Extract<BootLine, { kind: "prompt" }>;
  const promptTyped = promptLine.text.slice(0, typedChars);
  const shownLines = BOOT_LINES.slice(1, linesShown);
  const holding = linesShown >= BOOT_LINES.length;

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{ background: "#03050a" }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.6], fov: 42, near: 0.1, far: 20 }}
        // R31 fix for "opens black": signal the index.html pre-boot stub
        // to fade out only once the R3F context is set up + first frame
        // is about to paint. Guarded — the global is only defined on /world.
        onCreated={() => {
          try {
            const w = window as unknown as { __preBootHide?: () => void };
            w.__preBootHide?.();
          } catch {
            /* ignore */
          }
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <AdaptiveDpr pixelated />
        <color attach="background" args={["#03050a"]} />
        <fog attach="fog" args={["#03050a", 4, 12]} />

        <ambientLight intensity={0.22} color="#2a3346" />
        <pointLight
          position={[0, -1.2, 1.6]}
          intensity={2.4}
          color="#35E7E0"
          distance={6}
          decay={1.6}
        />
        <pointLight
          position={[-2.4, 1.6, -1.4]}
          intensity={0.9}
          color="#a4bce8"
          distance={10}
          decay={2}
        />

        <Suspense fallback={null}>
          <CameraDrift reduced={reduced} />
          <CrtPanel>
            <TerminalHtml
              promptTyped={promptTyped}
              shownLines={shownLines}
              caretVisible={linesShown === 0 || holding}
            />
          </CrtPanel>

          <Sparkles
            count={40}
            speed={0.15}
            opacity={0.35}
            size={2.4}
            color="#35E7E0"
            scale={[10, 5, 6]}
            position={[0, 0, -1]}
          />
        </Suspense>
      </Canvas>

      {/* Skip affordance — 2D overlay, above the Canvas. */}
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-6 right-6 text-xs text-neutral-500 hover:text-neutral-200 transition-colors font-mono"
        aria-label="Skip boot sequence"
      >
        [skip ⏎]
      </button>
    </div>
  );
}

/** Slow forward dolly + tiny sway. Reduced-motion: no camera movement. */
function CameraDrift({ reduced }: { reduced: boolean }) {
  const { camera } = useThree();
  const startZ = useRef(camera.position.z);
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    // Dolly from z=startZ → z=startZ-0.35 over ~2.5s ease-out
    const progress = Math.min(1, t / 2.5);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.z = startZ.current - 0.35 * eased;
    camera.position.x = Math.sin(t * 0.16) * 0.05;
    camera.position.y = Math.cos(t * 0.12) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * CRT-style floating panel. Dark screen face + bezel behind it + emissive
 * glow rim below. Subtle idle rotation so the screen doesn't feel dead.
 */
function CrtPanel({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.045;
    groupRef.current.rotation.x = Math.cos(t * 0.09) * 0.02;
  });
  return (
    <group ref={groupRef}>
      {/* Bezel plate */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[3.6, 2.4]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Screen face — near-black, subtle emissive so DOM text has a glow bed */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2, 2.0]} />
        <meshStandardMaterial
          color="#040910"
          emissive="#0a2028"
          emissiveIntensity={0.6}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      {/* Under-glow rim — thin plane just below the screen */}
      <mesh position={[0, -1.08, -0.01]}>
        <planeGeometry args={[3.2, 0.06]} />
        <meshBasicMaterial color="#35E7E0" toneMapped={false} />
      </mesh>
      {/* Terminal DOM lives on the screen face */}
      {children}
    </group>
  );
}

const TERMINAL_HTML_STYLE: CSSProperties = {
  width: 620,
  height: 400,
  padding: "24px 28px",
  color: "#e8ecf4",
  fontFamily: "JetBrains Mono, ui-monospace, monospace",
  fontSize: 13,
  lineHeight: 1.55,
  whiteSpace: "pre",
  overflow: "hidden",
  userSelect: "none",
  pointerEvents: "none",
  background:
    "radial-gradient(ellipse at 50% 50%, rgba(10,32,40,0.28) 0%, rgba(3,5,10,0.0) 70%)",
};

function TerminalHtml({
  promptTyped,
  shownLines,
  caretVisible,
}: {
  promptTyped: string;
  shownLines: BootLine[];
  caretVisible: boolean;
}) {
  return (
    <Html
      transform
      distanceFactor={2.5}
      position={[0, 0, 0.01]}
      occlude={false}
      style={TERMINAL_HTML_STYLE}
      wrapperClass="boot-scene-html"
    >
      <div className="opacity-95">
        <div className="text-neutral-500 text-[11px] mb-3">
          kernsdev.com — terminal handshake
        </div>
        <div>
          <span style={{ color: "#35E7E0" }}>grant@kernsdev</span>
          <span style={{ color: "#6b7280" }}> ~ $ </span>
          <span>{promptTyped}</span>
          {caretVisible && promptTyped.length >= 0 && shownLines.length === 0 && <Caret />}
        </div>
        {shownLines.map((line, i) => (
          <LineRow key={i} line={line} />
        ))}
        {caretVisible && shownLines.length > 0 && (
          <div>
            <span style={{ color: "#35E7E0" }}>grant@kernsdev</span>
            <span style={{ color: "#6b7280" }}> ~ $ </span>
            <Caret />
          </div>
        )}
      </div>
    </Html>
  );
}

function LineRow({ line }: { line: BootLine }) {
  if (line.kind === "out") return <div style={{ color: "#d1d5db" }}>{line.text}</div>;
  if (line.kind === "blank") return <div style={{ height: 10 }} />;
  if (line.kind === "service") {
    return (
      <div>
        <span style={{ color: "#6b7280" }}>   ▸ </span>
        <span style={{ color: "#f5f5f5" }}>{line.name.padEnd(20, " ")}</span>
        <span style={{ color: "#34d399" }}>[{line.status}]</span>
        <span style={{ color: "#6b7280" }}> {"  "}{line.meta}</span>
      </div>
    );
  }
  return null;
}

function Caret() {
  return (
    <span
      className="inline-block align-baseline ml-0.5"
      style={{
        width: "0.55em",
        height: "1.05em",
        background: "#e8ecf4",
        verticalAlign: "-2px",
        animation: "boot-caret-blink 1s steps(2, start) infinite",
      }}
    />
  );
}
