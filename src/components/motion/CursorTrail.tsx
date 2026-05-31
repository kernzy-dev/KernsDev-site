import { useEffect, useRef } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Violet cursor trail rendered to a fullscreen canvas. Points decay over ~450ms
 * with eased alpha + slight width tapering. Layered above the page but below
 * the boot sequence and modal overlays.
 *
 * Hidden on touch devices (no cursor) and when prefers-reduced-motion is set.
 *
 * Why canvas: drawing the trail with DOM nodes pegs the main thread. Canvas
 * with requestAnimationFrame stays at 60fps even with dense trails.
 */

type Point = { x: number; y: number; t: number };

const COLOR = "168, 85, 247"; // accent violet rgb
const TRAIL_MS = 450;

export default function CursorTrail() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<Point[]>([]);
  const lastDraw = useRef(0);
  const enabled = useRef(true);

  useEffect(() => {
    if (reduced) return;

    // Skip on touch-primary devices — no cursor to trail.
    const isTouchPrimary = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchPrimary) {
      enabled.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      // Throttle insertion to ~120Hz max; anything denser is wasted.
      if (now - lastDraw.current < 8) return;
      lastDraw.current = now;
      points.current.push({ x: e.clientX, y: e.clientY, t: now });
      // Cap memory: never hold more than ~80 points (well above what 450ms can fit at 120Hz).
      if (points.current.length > 80) points.current.shift();
    };

    const render = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = points.current;
      // Drop expired points from the head.
      while (pts.length && now - pts[0].t > TRAIL_MS) pts.shift();
      if (pts.length >= 2) {
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const age = now - b.t;
          const alpha = Math.max(0, 1 - age / TRAIL_MS);
          ctx.strokeStyle = `rgba(${COLOR}, ${alpha * 0.55})`;
          ctx.lineWidth = 2 * alpha + 0.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[40] mix-blend-screen"
    />
  );
}
