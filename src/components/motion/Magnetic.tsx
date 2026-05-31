import { useRef, useState, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Magnetic hover — children lean toward the cursor when it's within `radius`
 * pixels, snap back when it leaves. The pull is spring-damped so the element
 * has weight, not snap-to-pointer.
 *
 * Use as a wrapper on individual links/buttons, NOT large blocks (the pull
 * is computed against the wrapper's center).
 *
 * Reduced-motion: renders children with zero motion, identical interaction
 * model otherwise.
 */

type Props = {
  children: ReactNode;
  /** Px from element center within which the magnetic pull engages. */
  radius?: number;
  /** How far the element follows the cursor at max pull. */
  strength?: number;
  className?: string;
};

export default function Magnetic({ children, radius = 70, strength = 0.35, className }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      // Falloff: full strength at center, zero at radius
      const k = (1 - dist / radius) * strength;
      x.set(dx * k);
      y.set(dy * k);
      if (!active) setActive(true);
    } else {
      x.set(0);
      y.set(0);
      if (active) setActive(false);
    }
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
    setActive(false);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y, display: "inline-block" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
