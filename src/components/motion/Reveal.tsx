import { motion } from "framer-motion";
import type { ReactNode } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer";
};

/**
 * Wraps content with a scroll-triggered slide-up animation.
 * Fires once when the element enters the viewport.
 *
 * Respects `prefers-reduced-motion`: skips the animation entirely and renders
 * the children in their final position immediately.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: Props) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (reduced) {
    // No animation — just render the wrapper at final state so the DOM tree
    // shape stays identical (avoids re-paints if motion preference changes mid-session).
    const Tag = as as any;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
