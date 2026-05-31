import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useReducedMotion from "../hooks/useReducedMotion";

/**
 * Terminal-style boot sequence. Plays once per browser session, then a flag in
 * sessionStorage skips it on subsequent loads (back/forward, soft navs).
 *
 * The whole thing is bypassable: click "[skip]" or hit any key.
 * Respects prefers-reduced-motion (renders nothing and resolves immediately).
 *
 * Intentionally NOT a marketing animation — it's the literal aesthetic of how
 * Grant works. Builds the brand by exposing the workflow, not abstracting it.
 */

type BootLine =
  | { kind: "prompt"; text: string; type?: number }
  | { kind: "out"; text: string; delay?: number }
  | { kind: "service"; name: string; status: string; meta: string; delay?: number }
  | { kind: "blank"; delay?: number };

const LINES: BootLine[] = [
  { kind: "prompt", text: "ssh grant@kernsdev.com", type: 22 },
  { kind: "out", text: "→ authenticating ... ok", delay: 220 },
  { kind: "out", text: "→ identity:  grant kerns", delay: 110 },
  { kind: "out", text: "→ spinning up services ...", delay: 180 },
  { kind: "service", name: "polymarket-bot",   status: "online", meta: "last trade 12s ago",  delay: 160 },
  { kind: "service", name: "fidel-daytrader",  status: "online", meta: "watching 6 tickers",  delay: 140 },
  { kind: "service", name: "factvault",        status: "online", meta: "14 shorts queued",    delay: 150 },
  { kind: "service", name: "fire-control",     status: "online", meta: "3 devices linked",    delay: 130 },
  { kind: "blank", delay: 140 },
  { kind: "out", text: "→ ready in 1.7s", delay: 90 },
  { kind: "out", text: "→ rendering ui ...", delay: 220 },
];

const SESSION_FLAG = "kdv_booted_v1";

type Props = {
  onDone: () => void;
};

export default function BootSequence({ onDone }: Props) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [linesShown, setLinesShown] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const skippedRef = useRef(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch { /* private mode */ }
    setVisible(false);
    // Match the exit-anim duration before unmounting/handoff.
    setTimeout(onDone, 380);
  };

  // Already booted in this session? Skip immediately.
  useEffect(() => {
    let already = false;
    try { already = sessionStorage.getItem(SESSION_FLAG) === "1"; } catch { /* */ }
    if (already || reduced) {
      doneRef.current = true;
      setVisible(false);
      // Use a microtask so React can render the parent's "not visible" branch first.
      Promise.resolve().then(onDone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip on any key or click anywhere.
  useEffect(() => {
    if (!visible) return;
    const skip = () => {
      if (skippedRef.current) return;
      skippedRef.current = true;
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Drive the sequence: type the first prompt char-by-char, then reveal each
  // following line on its own delay.
  useEffect(() => {
    if (!visible || doneRef.current) return;

    if (linesShown === 0) {
      const promptLine = LINES[0] as Extract<BootLine, { kind: "prompt" }>;
      if (typedChars < promptLine.text.length) {
        const t = setTimeout(() => setTypedChars((c) => c + 1), promptLine.type ?? 22);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setLinesShown(1), 220);
      return () => clearTimeout(t);
    }

    if (linesShown < LINES.length) {
      const next = LINES[linesShown];
      const delay =
        (next.kind === "out" && next.delay) ||
        (next.kind === "service" && next.delay) ||
        (next.kind === "blank" && next.delay) ||
        140;
      const t = setTimeout(() => setLinesShown((n) => n + 1), delay);
      return () => clearTimeout(t);
    }

    // All lines rendered — short held beat, then finish.
    const t = setTimeout(finish, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, linesShown, typedChars]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="fixed inset-0 z-[100] bg-neutral-950 text-neutral-200 font-mono text-[13px] md:text-sm leading-relaxed"
          aria-hidden
        >
          <div className="absolute inset-0 overflow-hidden">
            {/* CRT-ish vignette to subtly age the look — no scanlines (looks costumey) */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            <div className="container-tight pt-20 md:pt-32">
              <div className="text-neutral-500 text-xs mb-4">
                kernsdev.com — terminal handshake
              </div>

              {/* Prompt (typewritten) */}
              <Line>
                <span className="text-accent">grant@kernsdev</span>
                <span className="text-neutral-500"> ~ $ </span>
                <span>
                  {(LINES[0] as Extract<BootLine, { kind: "prompt" }>).text.slice(0, typedChars)}
                </span>
                {linesShown === 0 && <Caret />}
              </Line>

              {/* Output lines */}
              {LINES.slice(1, linesShown).map((line, i) => (
                <RenderLine key={i} line={line} />
              ))}

              {/* Final blinking cursor while we hold before fadeout */}
              {linesShown >= LINES.length && (
                <Line>
                  <span className="text-accent">grant@kernsdev</span>
                  <span className="text-neutral-500"> ~ $ </span>
                  <Caret />
                </Line>
              )}
            </div>
          </div>

          {/* Skip affordance */}
          <button
            type="button"
            onClick={finish}
            className="absolute bottom-6 right-6 text-xs text-neutral-500 hover:text-neutral-200 transition-colors font-mono"
            aria-label="Skip boot sequence"
          >
            [skip ⏎]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="whitespace-pre"
    >
      {children}
    </motion.div>
  );
}

function RenderLine({ line }: { line: BootLine }) {
  if (line.kind === "out") return <Line><span className="text-neutral-300">{line.text}</span></Line>;
  if (line.kind === "blank") return <div className="h-3" />;
  if (line.kind === "service") {
    return (
      <Line>
        <span className="text-neutral-500">   ▸ </span>
        <span className="text-neutral-100">{line.name.padEnd(20, " ")}</span>
        <span className="text-emerald-400">[{line.status}]</span>
        <span className="text-neutral-500">  {line.meta}</span>
      </Line>
    );
  }
  return null;
}

function Caret() {
  return (
    <motion.span
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }}
      className="inline-block bg-neutral-100 ml-0.5"
      style={{ width: "0.55em", height: "1.05em", verticalAlign: "-2px" }}
    />
  );
}
