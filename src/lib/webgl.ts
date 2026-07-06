/**
 * Feature detection for WebGL — returns true if the browser can create
 * any of webgl2 / webgl / experimental-webgl on a fresh canvas.
 *
 * Callers (BuildingShowcase, WorldExperience) use this to decide between
 * mounting an R3F Canvas or falling back to a 2D static UI. Runs
 * client-side only (touches `document`).
 */
export function hasWebGL(): boolean {
  // Each getContext attempt needs a FRESH canvas — once a canvas has had a
  // context requested (even unsuccessfully), subsequent getContext calls of
  // a different type on the same canvas return null.
  const tryType = (type: "webgl2" | "webgl" | "experimental-webgl"): boolean => {
    try {
      const canvas = document.createElement("canvas");
      // The union type isn't in getContext's overload table for anything but
      // "webgl2" / "webgl", so we widen to string for the call and coerce the
      // return type back to a truthiness check.
      return !!canvas.getContext(type as "webgl2");
    } catch {
      return false;
    }
  };
  return tryType("webgl2") || tryType("webgl") || tryType("experimental-webgl");
}
