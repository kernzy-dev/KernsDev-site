/**
 * Suspense fallback shown while the 3D scene's code + HDR + PBR textures load.
 * Pure CSS — intentionally imports NOTHING from @react-three/* so it doesn't pull
 * drei or three into the main bundle. (drei's useProgress would do exactly that
 * and inflate the initial bundle by ~180 KB gzipped — measured.)
 *
 * UX: spinner + mansion silhouette + indeterminate progress bar. Communicates
 * "loading is happening" without lying about a specific percentage we can't measure
 * without paying the bundle cost.
 */
export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {/* Stylized mansion silhouette + rotating ring */}
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full opacity-40">
            <path d="M10 60 L40 25 L70 60 Z" fill="none" stroke="#a855f7" strokeWidth="2" />
            <rect x="22" y="42" width="36" height="22" fill="none" stroke="#a855f7" strokeWidth="2" />
            <rect x="35" y="50" width="10" height="14" fill="#a855f7" opacity="0.5" />
          </svg>
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        </div>

        <div>
          <p className="text-sm text-neutral-200 font-medium">Loading scene…</p>
          <p className="text-xs text-neutral-500 mt-1">~10 MB of real PBR textures on first visit</p>
        </div>

        {/* Indeterminate progress bar — pulses across because we don't know real % */}
        <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-loading-sweep" />
        </div>
      </div>
    </div>
  );
}
