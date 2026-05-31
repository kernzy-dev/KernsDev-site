import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Weighted hover — a card that tilts toward the cursor with mass. The springs
 * are tuned so it feels like nudging a heavy object: lags slightly, overshoots
 * minimally, settles slowly. Combined with a subtle parallax-z lift on its
 * children, the card reads as physical.
 *
 * Wraps any card-like block. Pure CSS transform — no layout impact.
 *
 * Reduced-motion: renders children flat with zero transforms.
 */

type Props = {
  children: ReactNode;
  /** Max tilt in degrees. */
  tilt?: number;
  /** Z-lift on hover, in px. */
  lift?: number;
  className?: string;
};

export default function Weighted({ children, tilt = 6, lift = 12, className }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 110, damping: 16, mass: 0.9 });
  const sy = useSpring(my, { stiffness: 110, damping: 16, mass: 0.9 });
  const rotX = useTransform(sy, [0, 1], [tilt, -tilt]);
  const rotY = useTransform(sx, [0, 1], [-tilt, tilt]);
  const z = useMotionValue(0);
  const zSpring = useSpring(z, { stiffness: 140, damping: 20, mass: 0.8 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  const onEnter = () => { if (!reduced) z.set(lift); };
  const onLeave = () => {
    if (reduced) return;
    mx.set(0.5);
    my.set(0.5);
    z.set(0);
  };

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        translateZ: zSpring,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
