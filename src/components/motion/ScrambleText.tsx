import { useEffect, useState } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Scrambles a string from random glyphs into the target on mount (or whenever
 * the target changes). The scramble propagates left-to-right — each character
 * settles, the next one is still rolling.
 *
 * Effective for stat numbers, names, identifiers — anything where you want the
 * read of "this is real data settling in" rather than "this is a fade." Linear's
 * stats use the same idiom.
 *
 * Reduced-motion: skips entirely and renders the target text directly.
 */

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+-=<>?";

type Props = {
  text: string;
  /** ms per character settling beat — lower = faster scramble. */
  speed?: number;
  /** ms delay before scramble begins. */
  delay?: number;
  className?: string;
};

export default function ScrambleText({ text, speed = 26, delay = 0, className }: Props) {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(() => (reduced ? text : ""));

  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    setOut("");
    let settled = 0;
    let rolling = 0;
    let raf = 0;
    let last = performance.now();

    const begin = window.setTimeout(() => {
      const step = (now: number) => {
        if (now - last >= speed) {
          last = now;
          if (rolling < text.length) rolling++;
          if (rolling - settled > 3 || rolling === text.length) settled++;
          let s = "";
          for (let i = 0; i < text.length; i++) {
            if (i < settled) s += text[i];
            else if (i < rolling) s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          setOut(s);
          if (settled >= text.length) {
            setOut(text);
            return;
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(begin);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [text, speed, delay, reduced]);

  return <span className={className}>{out || " "}</span>;
}
