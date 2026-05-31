import { useEffect, useState } from "react";

/**
 * Returns true when the user has set "Reduce motion" at the OS level.
 * Components should branch on this to skip parallax, autoplay animations,
 * camera-fly-ins, and idle rotations.
 */
export default function useReducedMotion(): boolean {
  // SSR-safe default: false (assume animations OK). Real value resolves on mount.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Modern + Safari < 14 fallback
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  return reduced;
}
