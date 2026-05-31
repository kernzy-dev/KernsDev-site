import { useEffect, useMemo, useRef, useState } from "react";
import Reveal from "./motion/Reveal";
import ScrambleText from "./motion/ScrambleText";
import Weighted from "./motion/Weighted";

/**
 * "Currently running" — the live status block that replaces the 3D mansion.
 *
 * The honest version of a values section. Instead of an abstract metaphor
 * (foundation = honest, walls = fast, roof = detail-oriented), the page
 * exposes the actual automations Grant has running, with stats that scramble
 * into place and an activity log that ticks over time.
 *
 * Data is locally simulated at the moment — wiring to real bot APIs is
 * deliberately framed as "not yet". That admission itself is part of the
 * brutalist-honest tone we're going for.
 */

type Status = "online" | "idle" | "scheduled";

type Bot = {
  key: string;
  name: string;
  blurb: string;
  status: Status;
  stats: { label: string; value: string }[];
  log: { at: number; line: string }[];
};

const SEED: Bot[] = [
  {
    key: "polymarket-bot",
    name: "polymarket-bot",
    blurb: "Algorithmic trading on Polymarket prediction markets. Watches news + edges.",
    status: "online",
    stats: [
      { label: "trades 24h", value: "14" },
      { label: "win rate", value: "61%" },
      { label: "open positions", value: "3" },
    ],
    log: [
      { at: -12_000,    line: "closed YES TRUMP-2028 0.42→0.51 (+21%)" },
      { at: -3 * 60_000, line: "opened NO FED-CUT-Q2 @ 0.38" },
      { at: -7 * 60_000, line: "news scan: Reuters fed-cut sentiment ↓" },
    ],
  },
  {
    key: "fidel-daytrader",
    name: "fidel-daytrader",
    blurb: "Day-trading paper account on Alpaca. Tech signal + news sentiment hybrid.",
    status: "online",
    stats: [
      { label: "P&L today",     value: "+$1.20" },
      { label: "open positions", value: "2" },
      { label: "signal Q",      value: "0.78" },
    ],
    log: [
      { at: -45_000,     line: "BUY NVDA @ 142.18 — RSI cross + news+" },
      { at: -4 * 60_000, line: "SELL AAPL @ 188.42 (+0.6%)" },
      { at: -12 * 60_000, line: "watchlist refresh: 6 tickers" },
    ],
  },
  {
    key: "factvault",
    name: "factvault",
    blurb: "Automated dark-facts YouTube Shorts pipeline. Script → TTS → render → upload.",
    status: "online",
    stats: [
      { label: "queued",     value: "14" },
      { label: "uploaded 7d", value: "9" },
      { label: "avg length",  value: "52s" },
    ],
    log: [
      { at: -2 * 60_000,  line: "render q'd: 'Antarctic Cold War bunkers'" },
      { at: -25 * 60_000, line: "uploaded: 'The day the sky burned green'" },
      { at: -55 * 60_000, line: "tts: 6 scripts voiced" },
    ],
  },
  {
    key: "fire-control",
    name: "fire-control",
    blurb: "Fire TV fleet manager. Sideload, mirror, snapshots — CLI + web UI.",
    status: "online",
    stats: [
      { label: "devices",    value: "3" },
      { label: "snapshots",  value: "11" },
      { label: "installs 24h", value: "2" },
    ],
    log: [
      { at: -90_000,     line: "fleet sync ok — 3/3 reachable" },
      { at: -8 * 60_000, line: "snapshot taken: living-room-tv pre-update" },
      { at: -34 * 60_000, line: "sideload: kodi v21.1 → bedroom-tv" },
    ],
  },
];

const STATUS_COLOR: Record<Status, string> = {
  online: "bg-emerald-400",
  idle: "bg-amber-400",
  scheduled: "bg-sky-400",
};

const TICK_EVENTS: Record<string, string[]> = {
  "polymarket-bot": [
    "news scan: AP fed-cut sentiment ↑",
    "rebalance: closing GOP-PRIMARY position",
    "edge check: SUPREME-COURT-RULING > 3% margin",
    "opened YES TX-SENATE-2026 @ 0.34",
    "scanning markets… 12 new candidates",
  ],
  "fidel-daytrader": [
    "BUY TSLA @ 248.03 — momentum + earnings+",
    "SELL MSFT @ 421.12 (+0.4%)",
    "signal flush: 4 stale tickers dropped",
    "watchlist refresh: 6 tickers",
    "RSI cross on AMD — eyes only",
  ],
  factvault: [
    "render q'd: 'Why nobody lives on Devon Island'",
    "tts: 3 scripts voiced",
    "uploaded: 'The lightbulb that wouldn't die'",
    "stockpile: 8 b-roll clips fetched",
    "script: 'Roman concrete still confuses scientists'",
  ],
  "fire-control": [
    "fleet sync ok — 3/3 reachable",
    "snapshot taken: bedroom-tv pre-update",
    "bloat disabled: AmazonAppstore → living-room",
    "mirror: kitchen-tv ← living-room launcher",
    "device check-in: bedroom-tv heartbeat ok",
  ],
};

function rel(ms: number): string {
  const sec = Math.abs(Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function StatusBlock() {
  const mountedAt = useRef(Date.now());
  const [bots, setBots] = useState<Bot[]>(SEED);
  const [, force] = useState(0);

  // Re-render every 15s so "12s ago" labels stay accurate.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Activity tick — every 6–10s, pick one bot and prepend a fresh event.
  // Also mutate one stat to a nearby-plausible value so the page feels alive.
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setBots((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const pool = TICK_EVENTS[prev[idx].key];
        const line = pool[Math.floor(Math.random() * pool.length)];
        const next = prev.map((b, i) => {
          if (i !== idx) return b;
          return {
            ...b,
            log: [{ at: 0, line }, ...b.log].slice(0, 4),
          };
        });
        return next;
      });
      const next = 6000 + Math.random() * 4000;
      timer = window.setTimeout(tick, next);
    };
    let timer = window.setTimeout(tick, 4500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const now = Date.now();

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
              session uptime <span className="text-neutral-300">{rel(mountedAt.current - now)}</span>
            </div>
          </div>
          <p className="text-sm text-neutral-500 max-w-xl mb-10 leading-relaxed">
            Four automations I have running on my own infra. The activity log ticks every few
            seconds. Stat snapshots are local for now — wiring to live API endpoints is{" "}
            <span className="text-neutral-300">on the list</span>, not pretending it's already done.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bots.map((bot, i) => (
            <BotCard key={bot.key} bot={bot} delayIndex={i} />
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-[11px] font-mono text-neutral-600 leading-relaxed">
            <span className="text-neutral-400">$</span> next: wire <span className="text-neutral-400">/status.json</span>{" "}
            endpoint per bot · expose log via SSE · drop the local simulation
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function BotCard({ bot, delayIndex }: { bot: Bot; delayIndex: number }) {
  // Stagger scramble entry per-card so they don't all chatter at once on first paint.
  const baseDelay = useMemo(() => 120 + delayIndex * 90, [delayIndex]);

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
          // entry.at is 0 for fresh ticks, or a negative ms offset for seeded events.
          const age = entry.at === 0 ? "just now" : rel(entry.at);
          return (
            <div
              key={`${entry.line}-${i}`}
              className="flex items-baseline gap-3 text-xs font-mono"
            >
              <span className={`shrink-0 tabular-nums ${entry.at === 0 ? "text-accent" : "text-neutral-600"}`}>
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
