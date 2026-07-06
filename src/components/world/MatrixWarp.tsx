import { useEffect, useRef } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * MatrixWarp — R29 boot→cave transition.
 *
 * Pure 2D canvas (no Three.js, no post-processing) so it costs nothing
 * against the LIGHT / 60fps budget for the cave scene underneath.
 * Timeline (~2.6s total):
 *   0.0-1.0s   Matrix glyph rain (falling katakana/ASCII, cyan) at full weight
 *   1.0-1.8s   Rain accelerates + fades; radial star trails ramp in from center
 *   1.8-2.4s   Hyperspace-style star acceleration
 *   2.4-2.6s   Fade-to-black tail so the hard-cut into the cave is invisible
 * Reduced-motion: fires onDone via microtask, renders nothing visual.
 * onDone is held in a ref so parent re-renders during the warp (e.g. from
 * scrollProgress state updates) don't restart the draw loop.
 */

type Props = {
  onDone: () => void;
};

const DURATION_MS = 2600;
const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHJKLMNPQRSTUVWXYZ0123456789$#@%<>*+=".split(
    "",
  );

export default function MatrixWarp({ onDone }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref-wrap onDone so effect doesn't restart when parent re-renders with a
  // new inline callback identity.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      const p = Promise.resolve().then(() => onDoneRef.current());
      return () => {
        void p;
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const fontSize = 16;
    let cols = 0;
    let drops: number[] = [];
    const starCount = 100;
    const starAngles: number[] = Array.from(
      { length: starCount },
      () => Math.random() * Math.PI * 2,
    );
    const starDists: number[] = Array.from(
      { length: starCount },
      () => Math.random() * 24,
    );

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      cols = Math.ceil(w / fontSize);
      const rowsInView = Math.ceil(h / fontSize);
      // Spread starting positions across the full viewport range so the
      // rain reads dense from frame one instead of trickling in from above.
      drops = new Array(cols)
        .fill(0)
        .map(() => Math.random() * rowsInView * 1.4 - rowsInView * 0.2);
      // Prime with a solid black background — trail-fade compounds this.
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
    };
    setup();

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    const t0 = performance.now();
    let lastT = t0;
    let raf = 0;
    let finished = false;

    const loop = (t: number) => {
      const dt = Math.min(64, t - lastT); // cap dt so a paused tab doesn't jump
      lastT = t;
      const elapsed = t - t0;
      const p = Math.min(1, elapsed / DURATION_MS);
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Rain: full weight 0-0.4, decays to 0 by ~0.85
      const rainAlpha =
        p < 0.4 ? 1 : p > 0.85 ? 0 : 1 - (p - 0.4) / 0.45;
      // Stars: ramp in from 0.35, full weight 0.7+
      const starAlpha =
        p < 0.35 ? 0 : p > 0.7 ? 1 : (p - 0.35) / 0.35;
      // Fade-to-black tail: last 15%
      const fadeAlpha = p > 0.85 ? (p - 0.85) / 0.15 : 0;

      // Motion-trail fade — leaves a residue so glyphs don't just disappear
      ctx.fillStyle = "rgba(0, 0, 0, 0.09)";
      ctx.fillRect(0, 0, w, h);

      // Matrix rain
      if (rainAlpha > 0) {
        ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
        // Rows per millisecond — decoupled from framerate so headless
        // swiftshader (30fps) and native (60fps) show the same motion.
        const rowsPerMs = 0.05 + p * 0.22;
        const advance = rowsPerMs * dt;
        for (let i = 0; i < cols; i++) {
          const y = drops[i] * fontSize;
          if (y > 0 && y < h) {
            const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            // Head — bright cyan
            ctx.fillStyle = `rgba(53, 231, 224, ${0.82 * rainAlpha})`;
            ctx.fillText(glyph, i * fontSize, y);
            // Occasional head-halo for texture
            if (Math.random() < 0.018) {
              ctx.fillStyle = `rgba(224, 255, 250, ${0.9 * rainAlpha})`;
              ctx.fillText(glyph, i * fontSize, y);
            }
          }
          drops[i] += advance;
          if (y > h && Math.random() > 0.975) drops[i] = 0;
        }
      }

      // Radial hyperspace star trails from viewport center
      if (starAlpha > 0) {
        const cx = w / 2;
        const cy = h / 2;
        // Time-based acceleration — pixels per ms rather than per frame.
        const pxPerMs = 0.12 + p * 0.7;
        const accel = pxPerMs * dt;
        ctx.strokeStyle = `rgba(180, 240, 255, ${0.85 * starAlpha})`;
        ctx.lineWidth = 1.2;
        const maxDim = Math.max(w, h) * 0.75;
        for (let i = 0; i < starCount; i++) {
          starDists[i] += accel;
          const dist = starDists[i];
          const ang = starAngles[i];
          const cos = Math.cos(ang);
          const sin = Math.sin(ang);
          const x1 = cx + cos * dist;
          const y1 = cy + sin * dist;
          const trailLen = accel * 3.5;
          const x2 = cx + cos * (dist + trailLen);
          const y2 = cy + sin * (dist + trailLen);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          if (dist > maxDim) {
            starDists[i] = 0;
            starAngles[i] = Math.random() * Math.PI * 2;
          }
        }
      }

      // Fade-to-black overlay in the tail — hides the hard cut to cave
      if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }

      if (p < 1 && !finished) {
        raf = requestAnimationFrame(loop);
      } else if (!finished) {
        finished = true;
        onDoneRef.current();
      }
    };

    raf = requestAnimationFrame(loop);

    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black pointer-events-none"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
