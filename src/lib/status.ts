/**
 * Status contract + live data for the "Currently running." block.
 *
 * Data is pulled LIVE IN THE BROWSER — no build step, no backend, no dependency
 * on any one machine. Each provider hits a CORS-open, keyless public API and
 * maps the response onto a bot card. Anything a provider can't supply (API
 * down, rate-limited, or CORS-blocked) falls back to the simulated seed below
 * and is honestly labelled as such.
 *
 * Note: only CORS-open public APIs can be read directly from the browser.
 * Polymarket's Gamma API sends `Access-Control-Allow-Origin: *` so it works;
 * stock-quote APIs (Yahoo, Stooq) do not, so fidel-daytrader can't go live
 * client-side without a key or a proxy.
 *
 * Log timestamps (`LogEntry.at`) are absolute epoch milliseconds.
 */

export type BotState = "online" | "idle" | "scheduled" | "offline";

export type Stat = { label: string; value: string };

export type LogEntry = { at: number; line: string };

export type BotStatus = {
  key: string;
  name: string;
  blurb: string;
  status: BotState;
  stats: Stat[];
  log: LogEntry[];
  /** "live" = real data fetched in-browser; "seed" = local simulation. */
  source: "live" | "seed";
};

// ── Seed (fallback + simulation) ────────────────────────────────────────────
// `atOffset` is ms relative to "now" (negative = in the past) so seeded log
// lines always look recently-aged regardless of when the bundle was built.

type SeedBot = Omit<BotStatus, "log" | "source"> & {
  log: { atOffset: number; line: string }[];
};

export const SEED: SeedBot[] = [
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
      { atOffset: -12_000, line: "closed YES TRUMP-2028 0.42→0.51 (+21%)" },
      { atOffset: -3 * 60_000, line: "opened NO FED-CUT-Q2 @ 0.38" },
      { atOffset: -7 * 60_000, line: "news scan: Reuters fed-cut sentiment ↓" },
    ],
  },
  {
    key: "fidel-daytrader",
    name: "fidel-daytrader",
    blurb: "Day-trading paper account on Alpaca. Tech signal + news sentiment hybrid.",
    status: "online",
    stats: [
      { label: "P&L today", value: "+$1.20" },
      { label: "open positions", value: "2" },
      { label: "signal Q", value: "0.78" },
    ],
    log: [
      { atOffset: -45_000, line: "BUY NVDA @ 142.18 — RSI cross + news+" },
      { atOffset: -4 * 60_000, line: "SELL AAPL @ 188.42 (+0.6%)" },
      { atOffset: -12 * 60_000, line: "watchlist refresh: 6 tickers" },
    ],
  },
  {
    key: "factvault",
    name: "factvault",
    blurb: "Automated dark-facts YouTube Shorts pipeline. Script → TTS → render → upload.",
    status: "online",
    stats: [
      { label: "queued", value: "14" },
      { label: "uploaded 7d", value: "9" },
      { label: "avg length", value: "52s" },
    ],
    log: [
      { atOffset: -2 * 60_000, line: "render q'd: 'Antarctic Cold War bunkers'" },
      { atOffset: -25 * 60_000, line: "uploaded: 'The day the sky burned green'" },
      { atOffset: -55 * 60_000, line: "tts: 6 scripts voiced" },
    ],
  },
  {
    key: "fire-control",
    name: "fire-control",
    blurb: "Fire TV fleet manager. Sideload, mirror, snapshots — CLI + web UI.",
    status: "online",
    stats: [
      { label: "devices", value: "3" },
      { label: "snapshots", value: "11" },
      { label: "installs 24h", value: "2" },
    ],
    log: [
      { atOffset: -90_000, line: "fleet sync ok — 3/3 reachable" },
      { atOffset: -8 * 60_000, line: "snapshot taken: living-room-tv pre-update" },
      { atOffset: -34 * 60_000, line: "sideload: kodi v21.1 → bedroom-tv" },
    ],
  },
];

/** Synthetic activity used to make *seed* (not live) bots feel alive. */
export const TICK_EVENTS: Record<string, string[]> = {
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

/** Expand the seed into full bot cards with absolute timestamps. */
export function seedBots(now: number): BotStatus[] {
  return SEED.map((b) => ({
    ...b,
    source: "seed" as const,
    log: b.log.map((e) => ({ at: now + e.atOffset, line: e.line })),
  }));
}

// ── Live providers (fetched in the browser) ──────────────────────────────────

function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * polymarket-bot — live Polymarket markets via the public Gamma API (CORS-open,
 * keyless). Filtered to *contested* markets (0.05–0.95) so it's not all
 * long-shot 0%/100% lines; that's also where the interesting edges live.
 */
async function fetchPolymarket(signal?: AbortSignal): Promise<BotStatus | null> {
  try {
    const res = await fetch(
      "https://gamma-api.polymarket.com/markets?closed=false&active=true&order=volume24hr&ascending=false&limit=40",
      { signal },
    );
    if (!res.ok) return null;
    const markets = (await res.json()) as Array<Record<string, unknown>>;
    const rows = (Array.isArray(markets) ? markets : [])
      .map((m) => {
        let yes: number | null = null;
        try {
          const prices = JSON.parse((m.outcomePrices as string) ?? "[]");
          if (prices.length) yes = Number(prices[0]);
        } catch {
          /* malformed outcomePrices */
        }
        const vol = Number((m.volume24hr as number) ?? (m.volume as number) ?? 0);
        return { q: String(m.question ?? "").trim(), yes, vol };
      })
      .filter(
        (r): r is { q: string; yes: number; vol: number } =>
          !!r.q && r.yes != null && Number.isFinite(r.yes) && r.yes >= 0.05 && r.yes <= 0.95,
      );
    if (rows.length === 0) return null;

    const totalVol = rows.reduce((a, r) => a + (Number.isFinite(r.vol) ? r.vol : 0), 0);
    const now = Date.now();
    return {
      key: "polymarket-bot",
      name: "polymarket-bot",
      blurb: "Watches live Polymarket prediction markets — contested edges by 24h volume.",
      status: "online",
      stats: [
        { label: "tracked", value: String(rows.length) },
        { label: "vol 24h", value: "$" + compact(totalVol) },
        { label: "hottest", value: Math.round(rows[0].yes * 100) + "%" },
      ],
      log: rows.slice(0, 4).map((r, i) => ({
        at: now - i * 1000,
        line: `${truncate(r.q, 40)} — ${Math.round(r.yes * 100)}%`,
      })),
      source: "live",
    };
  } catch {
    return null;
  }
}

/** Approximate US equities session (9:30–16:00 ET, Mon–Fri). DST-correct via
 *  the IANA zone; holidays are not accounted for (close enough for a label). */
function usMarketOpen(): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const wd = get("weekday");
    if (wd === "Sat" || wd === "Sun") return false;
    const mins = Number(get("hour")) * 60 + Number(get("minute"));
    return mins >= 9 * 60 + 30 && mins < 16 * 60;
  } catch {
    return false;
  }
}

const STOCK_WATCH = ["NVDA", "TSLA", "AAPL", "AMD", "MSFT", "SPY"];

/**
 * fidel-daytrader — live equity quotes via Finnhub (CORS-open). Needs a free
 * key in `VITE_FINNHUB_KEY`, inlined into the static bundle at build time. With
 * no key the provider no-ops and the card stays simulated.
 */
async function fetchStocks(signal?: AbortSignal): Promise<BotStatus | null> {
  const key = import.meta.env.VITE_FINNHUB_KEY;
  if (!key) return null;
  try {
    const quotes = (
      await Promise.all(
        STOCK_WATCH.map(async (sym) => {
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${key}`,
              { signal },
            );
            if (!res.ok) return null;
            const q = (await res.json()) as { c?: number; dp?: number };
            const price = Number(q.c);
            const pct = Number(q.dp);
            if (!Number.isFinite(price) || price === 0) return null;
            return { sym, price, pct: Number.isFinite(pct) ? pct : 0 };
          } catch {
            return null;
          }
        }),
      )
    ).filter((q): q is { sym: string; price: number; pct: number } => q != null);
    if (quotes.length === 0) return null;

    const open = usMarketOpen();
    const arrow = (p: number) => (p >= 0 ? "▲" : "▼");
    const byMove = [...quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const top = byMove[0];
    const now = Date.now();
    return {
      key: "fidel-daytrader",
      name: "fidel-daytrader",
      blurb: "Tracks a live equities watchlist — real quotes, signal + sentiment hybrid.",
      status: open ? "online" : "scheduled",
      stats: [
        { label: "watching", value: String(quotes.length) },
        { label: "top mover", value: `${top.sym} ${arrow(top.pct)}${Math.abs(top.pct).toFixed(1)}%` },
        { label: "market", value: open ? "open" : "closed" },
      ],
      log: byMove.slice(0, 4).map((q, i) => ({
        at: now - i * 1000,
        line: `${q.sym} ${q.price.toFixed(2)} ${arrow(q.pct)}${Math.abs(q.pct).toFixed(1)}%`,
      })),
      source: "live",
    };
  } catch {
    return null;
  }
}

// Browser-side live providers. Each returns null on any failure (offline,
// rate-limited, CORS, missing key) and the bot falls back to its simulated seed.
const PROVIDERS: Array<(signal?: AbortSignal) => Promise<BotStatus | null>> = [
  fetchPolymarket,
  fetchStocks,
];

export type LoadedStatus = {
  bots: BotStatus[];
  /** ISO time the live data was fetched, or null if everything fell back to seed. */
  generatedAt: string | null;
};

/**
 * Pull live data directly in the browser and merge it over the seed. Live bots
 * override their seed entry by key; everything else stays simulated. No build
 * step and no backend — the deployed site is self-sufficient.
 */
export async function loadStatus(now: number, signal?: AbortSignal): Promise<LoadedStatus> {
  const seeded = seedBots(now);
  const results = await Promise.all(PROVIDERS.map((p) => p(signal).catch(() => null)));
  const live = results.filter((b): b is BotStatus => b != null);
  if (live.length === 0) return { bots: seeded, generatedAt: null };

  const byKey = new Map(seeded.map((b) => [b.key, b]));
  for (const b of live) byKey.set(b.key, b);
  const ordered = seeded.map((b) => byKey.get(b.key)!);
  for (const b of live) if (!SEED.some((s) => s.key === b.key)) ordered.push(b);
  return { bots: ordered, generatedAt: new Date().toISOString() };
}
