import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { gsap } from "gsap";
import * as THREE from "three";
import FloatingModels from "./FloatingModels";
import ThreeErrorBoundary from "../three/ThreeErrorBoundary";

/**
 * "It prints itself in" — the shop's signature 3D hero.
 *
 * A featured model (the articulated dragon) materializes bottom-to-top as if
 * it's printing on a bed: a glowing print-line sweeps up its height while a
 * dissolve shader discards everything above the current layer. When the print
 * finishes it settles into a slow turntable with gentle pointer parallax.
 *
 * Self-contained lighting (no network HDRI), transparent canvas so the shop's
 * dark ground reads through, and a single Bloom pass to make the print-line
 * glow. Mounts only behind the shop header (SEO text stays real DOM); the
 * caller gates on WebGL / reduced-motion / viewport before importing this.
 */

const DRAGON_URL = "/models/shop/articulated-dragon.glb";
const ACCENT = "#ff7a3c"; // brand print-line / filament glow
const PRINT_SECONDS = 3.2;
const MODEL_HEIGHT = 3.1; // world units the model is scaled to fit

/** Shared dissolve uniforms — one object, assigned into every material's
 *  compiled shader so a single `reveal.value` update drives the whole mesh. */
type Dissolve = {
  reveal: { value: number };
  band: { value: number };
  bandColor: { value: THREE.Color };
  glow: { value: number };
};

function makeDissolve(): Dissolve {
  return {
    reveal: { value: -999 }, // below the model → nothing shown until the print starts
    band: { value: 0.14 }, // world-height of the glowing print-line band
    bandColor: { value: new THREE.Color(ACCENT) },
    glow: { value: 3.2 },
  };
}

/** Inject the height-threshold dissolve + emissive print-line into a standard
 *  material via onBeforeCompile (works on the GLB's own MeshStandardMaterials). */
function applyDissolve(mat: THREE.Material, U: Dissolve) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = U.reveal;
    shader.uniforms.uBand = U.band;
    shader.uniforms.uBandColor = U.bandColor;
    shader.uniforms.uGlow = U.glow;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vPrintY;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vec4 _wp = modelMatrix * vec4(transformed, 1.0);\n  vPrintY = _wp.y;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vPrintY;\nuniform float uReveal;\nuniform float uBand;\nuniform vec3 uBandColor;\nuniform float uGlow;",
      )
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n  if (vPrintY > uReveal) discard;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n  float _d = uReveal - vPrintY;\n  if (_d >= 0.0 && _d < uBand) {\n    float _g = 1.0 - _d / uBand;\n    totalEmissiveRadiance += uBandColor * (_g * _g) * uGlow;\n  }",
      );
  };
  // Backfaces keep the dissolving cross-section reading as solid, not hollow.
  (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  mat.needsUpdate = true;
}

function Dragon({ animate }: { animate: boolean }) {
  const { scene } = useGLTF(DRAGON_URL);
  const group = useRef<THREE.Group>(null);
  const printed = useRef(false);
  const U = useMemo(makeDissolve, []);

  // Clone + center + scale the model, wire the dissolve into every material,
  // and record the world Y range the print-line sweeps through.
  const { model, maxY } = useMemo(() => {
    const clone = scene.clone(true);
    const seen = new Set<THREE.Material>();
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (!m.geometry.getAttribute("normal")) m.geometry.computeVertexNormals();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        if (mat && !seen.has(mat)) {
          seen.add(mat);
          applyDissolve(mat, U);
        }
      });
    });
    // Fit to MODEL_HEIGHT and seat the base at y = 0 so reveal runs 0 → height.
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = MODEL_HEIGHT / (size.y || 1);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    return { model: clone, maxY: size.y * scale };
  }, [scene, U]);

  // Drive the print-in sweep (or jump to finished when motion is reduced).
  useEffect(() => {
    if (!animate) {
      U.reveal.value = maxY + 1;
      printed.current = true;
      return;
    }
    U.reveal.value = -0.02;
    printed.current = false;
    const tween = gsap.to(U.reveal, {
      value: maxY + 0.05,
      duration: PRINT_SECONDS,
      ease: "power2.out",
      onComplete: () => {
        printed.current = true;
      },
    });
    return () => {
      tween.kill();
    };
  }, [animate, maxY, U]);

  // Slow turntable once printed.
  useFrame((_, dt) => {
    if (group.current && printed.current && animate) {
      group.current.rotation.y += dt * 0.28;
    }
  });

  // Dispose cloned geometry/materials on unmount.
  useEffect(() => {
    return () => {
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => mat?.dispose());
      });
    };
  }, [model]);

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

/** Camera eases toward the pointer for a subtle parallax. Listens on window so
 *  it works even though the canvas is pointer-events-none (links stay clickable). */
function ParallaxRig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const base = useMemo(() => camera.position.clone(), [camera]);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  useFrame(() => {
    camera.position.x += (base.x + target.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (base.y - target.current.y * 0.35 - camera.position.y) * 0.05;
    camera.lookAt(0, 1.45, 0);
  });
  return null;
}

export default function PrintInHero({
  animate = true,
  mobile = false,
}: {
  animate?: boolean;
  mobile?: boolean;
}) {
  return (
    <Canvas
      // Mobile tier-down: no shadow maps, lower dpr, lighter AA.
      shadows={!mobile}
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      gl={{ alpha: true, antialias: !mobile, powerPreference: "high-performance" }}
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 1.7, 6.2] }}
    >
      {/* Gentle depth cue only — starts past the floating field (dist ~8.7–15)
          so it adds recession without swallowing the models into the dark. */}
      <fog attach="fog" args={["#0b0b14", 8, 40]} />
      <hemisphereLight args={["#ffe3cc", "#0a0a12", 0.55]} />
      <ambientLight intensity={0.35} color="#fff0e2" />
      <directionalLight
        position={[5, 9, 5]}
        intensity={2.2}
        color="#ffe6c0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 4, -3]} intensity={0.5} color="#a0c8ff" />
      <pointLight position={[4, 1.6, 4]} intensity={1.4} distance={16} color={ACCENT} decay={1.6} />

      {/* Ambient field of the store's real models, tumbling behind the dragon.
          Isolated in its own error boundary so a bad/missing model can never
          take the dragon (or the whole hero) down with it. */}
      <ThreeErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FloatingModels animate={animate} mobile={mobile} />
        </Suspense>
      </ThreeErrorBoundary>

      <Suspense fallback={null}>
        <Dragon animate={animate} />
      </Suspense>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={14}
        blur={2.6}
        far={4}
        resolution={mobile ? 384 : 1024}
        color="#000000"
      />

      <ParallaxRig />

      {/* Post-processing is desktop-only — the emissive print-line still reads
          bright without Bloom, so phones skip the extra fullscreen passes. */}
      {!mobile && (
        <EffectComposer>
          <Bloom luminanceThreshold={1.0} intensity={0.9} mipmapBlur radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

useGLTF.preload(DRAGON_URL);
