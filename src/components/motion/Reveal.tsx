import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer";
};

/**
 * Wraps content with a scroll-triggered fade-up animation.
 * Fires once when the element enters the viewport.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: Props) {
  const MotionTag = motion[as] as typeof motion.div;
  // Progressive-enhancement reveal: content is ALWAYS visible (good for SEO + no-JS
   // + screenshots), animation just slides + softly scales for entrance polish on scroll.
   return (
    <MotionTag
      initial={{ y, scale: 0.985 }}
      whileInView={{ y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
