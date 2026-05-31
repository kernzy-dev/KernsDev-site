import { useEffect, useMemo, useRef, useState } from "react";
import Reveal from "./motion/Reveal";
import ScrambleText from "./motion/ScrambleText";
import Weighted from "./motion/Weighted";
import { type BotStatus, TICK_EVENTS, loadStatus, seedBots } from "../lib/status";

/**
 * "Currently running" — the live status block that replaces the 3D mansion.
 *
 * The honest version of a values section: instead of an abstract metaphor it
 * exposes the actual automations Grant has running. Data is a build-time
 * snapshot (`public/status.json`, produced by scripts/build-status.mjs) merged
 * over a local seed — see src/lib/status.ts. Bots with real data render as
 * "live"; the rest stay simulated and say so. No pretending.
 */

type Status = BotStatus["status"];

const STATUS_COLOR: Record<Status, string> = {
  online: "bg-emerald-400",
  idle: "bg-amber-400",
  scheduled: "bg-sky-400",
  offline: "bg-neutral-500",
};

function rel(deltaMs: number): string {
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function StatusBlock() {
  const mountedAt = useRef(Date.now());
  const [bots, setBots] = useState<BotStatus[]>(() => seedBots(mountedAt.current));
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [, force] = useState(0);

  // Replace the seed with the build-time snapshot once it loads. Live bots
  // override their seed entry by key; missing ones stay simulated.
  useEffect(() => {
    const ctrl = new AbortController();
    loadStatus(Date.now(), ctrl.signal).then(({ bots, generatedAt }) => {
      setBots(bots);
      setGeneratedAt(generatedAt);
    });
    return () => ctrl.abort();
  }, []);

  // Re-render every 15s so the "12s ago" labels stay accurate.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Activity tick — every 6–10s prepend a synthetic event, but ONLY to seed
  // bots. Live bots show their real log untouched; faking their activity would
  // defeat the entire honest-status premise.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setBots((prev) => {
        const seedIdx = prev
          .map((b, i) => (b.source === "seed" ? i : -1))
          .filter((i) => i >= 0);
        if (seedIdx.length === 0) return prev;
        const idx = seedIdx[Math.floor(Math.random() * seedIdx.length)];
        const pool = TICK_EVENTS[prev[idx].key];
        if (!pool) return prev;
        const line = pool[Math.floor(Math.random() * pool.length)];
        return prev.map((b, i) =>
          i === idx ? { ...b, log: [{ at: Date.now(), line }, ...b.log].slice(0, 4) } : b,
        );
      });
      timer = window.setTimeout(tick, 6000 + Math.random() * 4000);
    };
    let timer = window.setTimeout(tick, 4500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const now = Date.now();
  const liveCount = bots.filter((b) => b.source === "live").length;

  return (
    <section
      id="running"
      className="py-20 md:py-28 border-t border-neutral-900 relative overflow-hidden"
    >
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
            <div>
              <p className="section-eyebrow mb-2 font-mono">// what's running</p>
              <h2 className="text-3xl md:text-4xl font-bold">Currently running.</h2>
            </div>
            <div className="text-xs font-mono text-neutral-500">
              session uptime{" "}
              <span className="text-neutral-300">{rel(now - mountedAt.current)}</span>
            </div>
          </div>
          <p className="text-sm text-neutral-500 max-w-xl mb-10 leading-relaxed">
            {bots.length} automations I run on my own infra.{" "}
            {liveCount > 0 ? (
              <>
                <span className="text-neutral-300">{liveCount} wired to live public data</span>
                {generatedAt && (
                  <> as of {rel(now - Date.parse(generatedAt))}</>
                )}
                {liveCount < bots.length && (
                  <> · the rest are simulated until their feed is wired</>
                )}
                .
              </>
            ) : (
              <>
                Stat snapshots are simulated for now — wiring each bot's live feed is{" "}
                <span className="text-neutral-300">on the list</span>, not pretending it's
                already done.
              </>
            )}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bots.map((bot, i) => (
            <BotCard key={bot.key} bot={bot} now={now} delayIndex={i} />
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-[11px] font-mono text-neutral-600 leading-relaxed">
            <span className="text-neutral-400">$</span> live cards fetch{" "}
            <span className="text-neutral-400">public APIs</span> straight from your browser — no
            backend, no build step · simulated cards await a CORS-open feed
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function BotCard({
  bot,
  now,
  delayIndex,
}: {
  bot: BotStatus;
  now: number;
  delayIndex: number;
}) {
  // Stagger scramble entry per-card so they don't all chatter at once on first paint.
  const baseDelay = useMemo(() => 120 + delayIndex * 90, [delayIndex]);
  const isLive = bot.source === "live";

  return (
    <Weighted
      tilt={3}
      lift={6}
      className="relative rounded-xl border border-neutral-800 bg-neutral-950/70 backdrop-blur p-5 hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[bot.status]} animate-pulse`} />
            <span className="font-mono text-sm text-neutral-200">{bot.name}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              [{bot.status}]
            </span>
          </div>
          <p className="text-xs text-neutral-500 leading-snug">{bot.blurb}</p>
        </div>
        <span
          title={isLive ? "Real build-time data" : "Simulated until this bot's feed is wired"}
          className={`shrink-0 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            isLive
              ? "text-emerald-300/80 border-emerald-400/30"
              : "text-neutral-500 border-neutral-700"
          }`}
        >
          {isLive ? "live" : "sim"}
        </span>
      </div>

      {/* Stats row — scramble in once per card */}
      <div className="grid grid-cols-3 gap-3 border-y border-neutral-900 py-3 my-3">
        {bot.stats.map((s, i) => (
          <div key={s.label} className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5 font-mono">
              {s.label}
            </div>
            <div className="font-mono text-lg text-neutral-100 truncate">
              <ScrambleText text={s.value} speed={22} delay={baseDelay + i * 70} />
            </div>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div className="space-y-1.5">
        {bot.log.map((entry, i) => {
          const age = rel(now - entry.at);
          const fresh = now - entry.at < 5000;
          return (
            <div
              key={`${entry.line}-${i}`}
              className="flex items-baseline gap-3 text-xs font-mono"
            >
              <span
                className={`shrink-0 tabular-nums ${fresh ? "text-accent" : "text-neutral-600"}`}
              >
                {age.padStart(8, " ")}
              </span>
              <span className="text-neutral-400 truncate">{entry.line}</span>
            </div>
          );
        })}
      </div>
    </Weighted>
  );
}
