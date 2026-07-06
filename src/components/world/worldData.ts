import * as THREE from "three";

/**
 * NOCTURNE — data spine for the scroll-choreographed 3D dev-world.
 * Authoritative brief: `ART_DIRECTION.md`. Palette + chapters live here so
 * the scene, camera-path, and emergent-nav share one source of truth.
 *
 * R25 update: chapters now map to Grant's real portfolio sections
 * (intro → about → work → services → contact) and the WORK chapter hosts
 * his real projects (polymarket-bot / fidel-daytrader / factvault /
 * fire-control) as explorable nodes.
 */

// ── Palette ─────────────────────────────────────────────────────────────────
export const PALETTE = {
  void:      "#07080D",
  slate:     "#12141C",
  ambient:   "#2A3346",
  cyan:      "#35E7E0",
  amber:     "#F5A623",
  text:      "#E8ECF4",
} as const;

// ── Curated CC0 assets (Poly Haven) ─────────────────────────────────────────
export const ASSETS = {
  hdri: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr",
  lantern: "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/Lantern_01/Lantern_01_1k.gltf",
} as const;

// ── Chapters — mapped to real portfolio sections ────────────────────────────

export type ChapterId = "intro" | "about" | "work" | "services" | "contact";

export type HeroKind = "slab" | "icosahedron" | "torusKnot" | "octahedron";

export type HeroConfig = {
  kind: HeroKind;
  position: [number, number, number];
  color: string;
  /** Target height in world meters (AutoFitGltf normalises to this). */
  size: number;
  gltfPath?: string;
};

export type Chapter = {
  id: ChapterId;
  progress: number;
  label: string;
  eyebrow: string;
  /** One-line description shown in HUD detail on approach. */
  blurb: string;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  hero: HeroConfig;
  /** Anchor URL in the site's flat rendering — used by clickable nav. */
  siteAnchor: string;
};

// Camera framing note: cameraPos values are PULLED BACK from the R24 hero
// close-ups per Grant's R25 review — less zoomed, more of the scene visible,
// keeps the hero framed but not filling the viewport.
export const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    progress: 0.0,
    label: "Enter",
    eyebrow: "// 00 · intro",
    blurb: "Software, honestly.",
    cameraPos: [-6.6, 3.4, 9.4],
    lookAt: [0, 1.9, 0],
    siteAnchor: "#top",
    hero: {
      kind: "icosahedron",
      position: [0, 0, 0],
      color: "#35E7E0",
      size: 3.6,
      gltfPath: "/assets/models/large_iron_gate/large_iron_gate_1k.gltf",
    },
  },
  {
    id: "about",
    progress: 0.22,
    label: "About",
    eyebrow: "// 01 · who",
    blurb: "Grant builds the specific software off-the-shelf can't touch.",
    cameraPos: [-5.4, 3.6, 6.6],
    lookAt: [10, 2.6, 5],
    siteAnchor: "#top",
    hero: {
      kind: "slab",
      position: [10, 0, 5],
      color: "#35E7E0",
      size: 4.6,
      gltfPath: "/assets/models/bench_vice_01/bench_vice_01_1k.gltf",
    },
  },
  {
    id: "work",
    progress: 0.5,
    label: "Work",
    eyebrow: "// 02 · shipping",
    blurb: "Four autonomous systems Grant runs on his own infra.",
    // Generator sits in the center of the flock of four real project
    // nodes (see PROJECTS below), camera pulls back to include them all
    cameraPos: [7.2, 4.4, -1.2],
    lookAt: [-2.0, 1.6, -8.0],
    siteAnchor: "#work",
    hero: {
      kind: "torusKnot",
      position: [-2.0, 0, -8.0],
      color: "#35E7E0",
      size: 2.8,
      gltfPath:
        "/assets/models/portable_generator/portable_generator_1k.gltf",
    },
  },
  {
    id: "services",
    progress: 0.75,
    label: "Services",
    eyebrow: "// 03 · hire",
    blurb: "Custom web apps, automation, AI integration.",
    cameraPos: [-6.0, 4.2, -8.4],
    lookAt: [-1, 2.4, -14],
    siteAnchor: "#services",
    hero: {
      kind: "octahedron",
      position: [-1, 0, -14],
      color: "#35E7E0",
      size: 3.8,
      // Reuses the iron gate — it doubles well as the "services / gateway to hire"
      // silhouette. If Grant drops a dedicated services model later, swap here.
      gltfPath: "/assets/models/large_iron_gate/large_iron_gate_1k.gltf",
    },
  },
  {
    id: "contact",
    progress: 1.0,
    label: "Contact",
    eyebrow: "// 04 · signal",
    blurb: "First call is free. If it won't work, I'll tell you.",
    cameraPos: [-5.6, 4.6, 4.4],
    lookAt: [0, 1.9, -2.0],
    siteAnchor: "#contact",
    hero: {
      kind: "octahedron",
      position: [0, 0, -2.0],
      color: "#35E7E0",
      size: 3.2,
      gltfPath:
        "/assets/models/portable_searchlight/portable_searchlight_1k.gltf",
    },
  },
];

// ── Real projects (the WORK chapter's explorable nodes) ─────────────────────
// Sourced from src/lib/status.ts's SEED — Grant's actual autonomous
// systems. Each node is a small emissive marker in the WORK chapter scene;
// hovering / clicking shows its blurb + status.

export type ProjectStatus = "online" | "idle" | "scheduled" | "offline";

export type ProjectMarker = {
  key: string;
  name: string;
  blurb: string;
  stat: string;
  status: ProjectStatus;
  /** World position — arranged around the WORK chapter's hero. */
  position: [number, number, number];
  color: string;
};

export const PROJECTS: ProjectMarker[] = [
  {
    key: "polymarket-bot",
    name: "polymarket-bot",
    blurb: "Algorithmic trading on Polymarket prediction markets.",
    stat: "14 trades / 24h · 61% win rate",
    status: "online",
    position: [-4.4, 1.4, -6.2],
    color: "#35E7E0",
  },
  {
    key: "fidel-daytrader",
    name: "fidel-daytrader",
    blurb: "Day-trading on Alpaca — tech signal + news sentiment hybrid.",
    stat: "P&L +$1.20 today · signal Q 0.78",
    status: "online",
    position: [-4.4, 1.4, -10.0],
    color: "#35E7E0",
  },
  {
    key: "factvault",
    name: "factvault",
    blurb: "Automated YouTube Shorts pipeline: script → TTS → render → upload.",
    stat: "14 queued · 9 uploaded / 7d",
    status: "online",
    position: [0.4, 1.4, -6.2],
    color: "#F5A623",
  },
  {
    key: "fire-control",
    name: "fire-control",
    blurb: "Fire TV fleet manager — sideload, mirror, snapshots.",
    stat: "3 devices · 11 snapshots",
    status: "online",
    position: [0.4, 1.4, -10.0],
    color: "#F5A623",
  },
];

// ── Camera curves ───────────────────────────────────────────────────────────

export function buildCameraCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    CHAPTERS.map((c) => new THREE.Vector3(...c.cameraPos)),
    false,
    "catmullrom",
    0.35,
  );
}

export function buildLookAtCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    CHAPTERS.map((c) => new THREE.Vector3(...c.lookAt)),
    false,
    "catmullrom",
    0.35,
  );
}

// ── Secondary monoliths (parallax depth) ────────────────────────────────────
export type SecondaryMonolith = {
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  color: string;
  intensity: number;
  rotation: number;
};

export const SECONDARY_MONOLITHS: SecondaryMonolith[] = [
  { position: [ -7.2, 0, -14],  height: 3.0, width: 0.55, depth: 0.35, color: PALETTE.cyan,  intensity: 0.35, rotation:  0.3 },
  { position: [  8.4, 0, -16],  height: 2.2, width: 0.50, depth: 0.35, color: PALETTE.amber, intensity: 0.28, rotation: -0.4 },
  { position: [ -3.1, 0, -22],  height: 3.8, width: 0.55, depth: 0.35, color: PALETTE.cyan,  intensity: 0.30, rotation:  0.1 },
  { position: [ 10.6, 0, -25],  height: 1.8, width: 0.45, depth: 0.30, color: PALETTE.amber, intensity: 0.22, rotation:  0.7 },
  { position: [ -9.4, 0, -30],  height: 2.8, width: 0.55, depth: 0.35, color: PALETTE.cyan,  intensity: 0.20, rotation: -0.2 },
];
