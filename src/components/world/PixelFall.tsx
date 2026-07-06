import { useEffect, useRef } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * PixelFall — R32 opening act of Grant's vertical tunnel descent.
 *
 * Replaces R28-R30's bash-boot + Matrix warp. Renders Grant's four
 * autonomous systems as PIXEL-ART TILES that FALL IN from above the
 * viewport, tumbling as they descend past the visitor. As the user
 * scrolls, the whole layer opacity-fades: by scroll ~0.35 the pixel
 * art has crossfaded away and the 3D cavern underneath (CaveScene)
 * takes over.
 *
 * Cheap: pure 2D canvas, no R3F, no post-processing composer, no
 * sprite sheets. Sprites drawn as chunky filled rects with a
 * palette-limited pixel-art aesthetic. Framerate-independent via dt.
 *
 * LIGHT constraint: keeps to a single 2D canvas + rAF loop so the
 * cave scene renderer can budget all its GPU time for its own
 * work — no shared allocation with this overlay.
 */

type Props = {
  /** [0,1] shared scroll progress from WorldExperience. */
  scrollProgress: number;
};

// Pixel-art palette — limited, saturated, 8-16 colours max.
const PALETTE = {
  bg: "#03050a",
  ink: "#e8ecf4",
  shadow: "#0a0f18",
  green: "#4ade80",
  greenDark: "#166534",
  red: "#f87171",
  redDark: "#7f1d1d",
  blue: "#60a5fa",
  blueDark: "#1e3a8a",
  amber: "#fbbf24",
  amberDark: "#78350f",
  cyan: "#35E7E0",
};

type Project = {
  name: string;
  icon: string; // one-glyph icon drawn in pixel style
  fg: string;
  bg: string;
  edge: string;
};

const PROJECTS: Project[] = [
  { name: "polymarket-bot",   icon: "$",  fg: PALETTE.green, bg: PALETTE.greenDark, edge: PALETTE.ink },
  { name: "fidel-daytrader",  icon: "▲",  fg: PALETTE.red,   bg: PALETTE.redDark,   edge: PALETTE.ink },
  { name: "factvault",        icon: "◈",  fg: PALETTE.blue,  bg: PALETTE.blueDark,  edge: PALETTE.ink },
  { name: "fire-control",     icon: "▲",  fg: PALETTE.amber, bg: PALETTE.amberDark, edge: PALETTE.ink },
];

type Sprite = {
  projectIdx: number;
  x: number;      // horizontal center, viewport px
  y: number;      // vertical center, viewport px (can be negative for above-viewport)
  vy: number;     // vertical velocity, px/ms
  rot: number;    // rotation, radians
  vrot: number;   // rotation velocity, rad/ms
  size: number;   // tile side length, viewport px
  hue: number;    // per-sprite palette offset (0-3)
};

const SPRITE_COUNT = 14;

function makeSprite(vpW: number, vpH: number, startAbove = true): Sprite {
  const size = 48 + Math.floor(Math.random() * 40); // 48-88px
  return {
    projectIdx: Math.floor(Math.random() * PROJECTS.length),
    x: 40 + Math.random() * (vpW - 80),
    // Distribute initial y across a range above viewport so first frame reads populated.
    y: startAbove ? -(size + Math.random() * vpH * 1.2) : Math.random() * vpH,
    vy: 0.10 + Math.random() * 0.22, // 100-320 px/sec
    rot: (Math.random() - 0.5) * 0.4,
    vrot: (Math.random() - 0.5) * 0.0018, // rad/ms
    size,
    hue: Math.floor(Math.random() * PROJECTS.length),
  };
}

export default function PixelFall({ scrollProgress }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(scrollProgress);
  scrollRef.current = scrollProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Signal the pre-boot overlay to hide the moment we're ready to paint.
    try {
      const w = window as unknown as { __preBootHide?: () => void };
      w.__preBootHide?.();
    } catch {
      /* ignore */
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let sprites: Sprite[] = [];

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false; // pixel-art crispness
      // Distribute initial sprites: 60% already IN viewport (spread across
      // the vertical range), 40% still above so they fall in over time.
      // Otherwise first paint is blank until sprites fall down.
      sprites = Array.from({ length: SPRITE_COUNT }, (_, i) => {
        const sp = makeSprite(w, h, i >= Math.floor(SPRITE_COUNT * 0.6));
        return sp;
      });
    };
    setup();

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    let raf = 0;
    let lastT = performance.now();
    let finished = false;

    const drawSprite = (s: Sprite) => {
      const p = PROJECTS[s.projectIdx];
      const half = s.size / 2;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      // Drop shadow — solid offset block
      ctx.fillStyle = PALETTE.shadow;
      ctx.fillRect(-half + 4, -half + 4, s.size, s.size);
      // Tile background
      ctx.fillStyle = p.bg;
      ctx.fillRect(-half, -half, s.size, s.size);
      // Chunky pixel border (2px)
      ctx.strokeStyle = p.edge;
      ctx.lineWidth = 2;
      ctx.strokeRect(-half + 1, -half + 1, s.size - 2, s.size - 2);
      // Center glyph — sized to tile
      ctx.fillStyle = p.fg;
      ctx.font = `bold ${Math.floor(s.size * 0.5)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.icon, 0, s.size * 0.03);
      ctx.restore();
    };

    const loop = (t: number) => {
      if (finished) return;
      const dt = Math.min(64, t - lastT);
      lastT = t;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Fade the entire layer based on scroll progress — visible early,
      // gone by ~0.35 so the cavern underneath takes over. Linear then
      // ease-out for a smoother tail.
      const s = scrollRef.current;
      const layerAlpha =
        s < 0.15 ? 1 : s > 0.35 ? 0 : 1 - Math.pow((s - 0.15) / 0.20, 1.4);

      // Always start with a fully-cleared transparent canvas so the 3D
      // cave underneath (DOM sibling with lower z-index) shows through
      // as layerAlpha decays. NO motion-trail alpha wash — that accumulates
      // and eventually opaque-blackens the canvas, blocking the cave.
      ctx.clearRect(0, 0, w, h);

      if (layerAlpha > 0.02) {
        ctx.globalAlpha = layerAlpha;
        // Solid opaque backdrop for the pixel-art aesthetic; the entire
        // layer is scaled by globalAlpha so it cross-fades cleanly.
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, w, h);

        for (const sp of sprites) {
          // Gravity — vy accelerates while visible (before scroll fade).
          sp.vy += 0.00012 * dt;
          sp.y += sp.vy * dt;
          sp.rot += sp.vrot * dt;
          if (sp.y - sp.size / 2 > h) {
            // Recycle above the top
            const s2 = makeSprite(w, h, true);
            Object.assign(sp, s2);
          }
          drawSprite(sp);
        }
        ctx.globalAlpha = 1;
      }

      // If fully faded, we can stop the raf loop — parent still owns the
      // component and any scroll-back will re-enter (React re-mount not
      // required; ref still points to canvas). Save the branch though —
      // simplest is to keep looping so scroll-back works.
      raf = requestAnimationFrame(loop);
    };

    if (!reduced) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  // Reduced-motion: render nothing (respects OS preference).
  if (reduced) return null;

  return (
    <div
      className="fixed inset-0 z-[80] pointer-events-none"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
