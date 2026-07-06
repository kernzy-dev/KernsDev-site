import { CHAPTERS, PALETTE } from "./worldData";

/**
 * NOCTURNE flat fallback — shown when the browser can't do WebGL or the scene
 * error boundary trips. Communicates the same chapter structure as flat cards,
 * so the visitor still gets the through-line without the flourish.
 */
export default function Fallback2D() {
  return (
    <div
      className="min-h-screen text-neutral-100 p-6"
      style={{ background: PALETTE.void }}
    >
      <div className="max-w-3xl mx-auto py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-neutral-100 hover:text-cyan-300 transition-colors mb-8"
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.28em]">
            ← kernsdev.com
          </span>
        </a>

        <p
          className="text-[10px] font-mono uppercase tracking-[0.28em] mb-3"
          style={{ color: PALETTE.cyan }}
        >
          // nocturne · flat fallback
        </p>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Your browser can't run the 3D flow — here's the through-line.
        </h1>
        <p className="text-neutral-400 leading-relaxed mb-12 max-w-xl">
          NOCTURNE is a scroll-choreographed 3D world where each chapter arrives
          as you flow through the scene. Without WebGL, the same story lives
          here as chapters — plain text, honest.
        </p>

        <ol className="space-y-6">
          {CHAPTERS.map((c, i) => (
            <li
              key={c.id}
              className="border-l pl-6 py-2"
              style={{ borderColor: i === 0 ? PALETTE.cyan : "#2a2f3c" }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-[0.28em] mb-1"
                style={{ color: i === 0 ? PALETTE.cyan : "#5c6472" }}
              >
                {c.eyebrow}
              </p>
              <h2 className="text-2xl font-display font-semibold">{c.label}</h2>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
