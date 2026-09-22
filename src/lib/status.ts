/**
 * Status contract + live data for the "Currently running." block.
 *
 * HONEST DATA ONLY. Every card is backed by a real, CORS-open, keyless public
 * API fetched live in the browser — no backend, no build step, no fabrication.
 * If a provider fails (offline, rate-limited, CORS), that card falls back to a
 * clearly-labelled "sim" seed and says so. Bots that can't be made genuinely
 * live from the browser were removed rather than faked.
 *
 * Live providers:
 *   • polymarket-bot — Polymarket Gamma API (contested prediction markets)
 *   • github         — GitHub public activity for the KernsDev account
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
  /** "live" = real data fetched in-browser; "seed" = local fallback. */
  source: "live" | "seed";
};

// ── Seed (fallback only, shown while a live feed is unreachable) ──────────────
// `atOffset` is ms relative to "now" (negative = past) so seeded log lines look
// recently-aged regardless of when the bundle was built. Every seed here has a
// matching LIVE provider below — the seed is just graceful degradation.

type SeedBot = Omit<BotStatus, "log" | "source"> & {
  log: { atOffset: number; line: string }[];
};

export const SEED: SeedBot[] = [
  {
    key: "polymarket-bot",
    name: "polymarket-bot",
    blurb: "Watches live Polymarket prediction markets — contested edges by 24h volume.",
    status: "online",
    stats: [
      { label: "tracked", value: "—" },
      { label: "vol 24h", value: "—" },
      { label: "hottest", value: "—" },
    ],
    log: [{ atOffset: -8000, line: "connecting to Polymarket Gamma API…" }],
  },
  {
    key: "github",
    name: "github/kernzy-dev",
    blurb: "Live GitHub activity — public commits, repos, and releases as they happen.",
    status: "online",
    stats: [
      { label: "public repos", value: "—" },
      { label: "commits 7d", value: "—" },
      { label: "followers", value: "—" },
    ],
    log: [{ atOffset: -8000, line: "fetching public event stream…" }],
  },
];

/** Synthetic activity used only to keep a *fallback* seed card from looking
 *  frozen while its live feed is unreachable. Never applied to live cards. */
export const TICK_EVENTS: Record<string, string[]> = {
  "polymarket-bot": [
    "retrying Polymarket Gamma API…",
    "awaiting CORS-open market feed…",
  ],
  github: [
    "retrying GitHub public events…",
    "awaiting api.github.com…",
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

const GH_USER = "kernzy-dev";

/**
 * github — live public activity via the GitHub REST API (CORS-open, keyless;
 * ~60 req/hr per visitor, plenty for a page view). Real repos, followers, and
 * a live event stream (pushes, releases, PRs). No feed → card stays simulated.
 */
async function fetchGithub(signal?: AbortSignal): Promise<BotStatus | null> {
  try {
    const [uRes, eRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GH_USER}`, { signal }),
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`, { signal }),
    ]);
    if (!uRes.ok) return null;
    const u = (await uRes.json()) as { public_repos?: number; followers?: number };
    const events = (eRes.ok ? await eRes.json() : []) as Array<Record<string, any>>;
    const now = Date.now();
    const weekAgo = now - 7 * 864e5;

    const commits7d = events
      .filter((e) => e.type === "PushEvent" && Date.parse(e.created_at) >= weekAgo)
      .reduce((a, e) => a + (e.payload?.commits?.length || 0), 0);
    const dayAgo = now - 864e5;
    const pushes24h = events.filter(
      (e) => e.type === "PushEvent" && Date.parse(e.created_at) >= dayAgo,
    ).length;
    const latestAt = events.length ? Date.parse(events[0].created_at) : 0;
    const relShort = (ms: number): string => {
      const s = Math.max(0, Math.floor((now - ms) / 1000));
      if (!ms) return "—";
      if (s < 60) return s + "s";
      if (s < 3600) return Math.floor(s / 60) + "m";
      if (s < 864e2) return Math.floor(s / 3600) + "h";
      return Math.floor(s / 864e2) + "d";
    };

    const line = (e: Record<string, any>): string => {
      const repo = String(e.repo?.name || "").split("/").pop() || "repo";
      switch (e.type) {
        case "PushEvent":
          return `pushed ${e.payload?.commits?.length || 0} commit(s) → ${repo}`;
        case "CreateEvent":
          return `created ${e.payload?.ref_type || "ref"} → ${repo}`;
        case "PullRequestEvent":
          return `${e.payload?.action || "updated"} PR → ${repo}`;
        case "ReleaseEvent":
          return `released ${e.payload?.release?.tag_name || ""} → ${repo}`;
        case "IssuesEvent":
          return `${e.payload?.action || "updated"} issue → ${repo}`;
        case "WatchEvent":
          return `starred ${repo}`;
        default:
          return `${String(e.type).replace("Event", "").toLowerCase()} → ${repo}`;
      }
    };
    const log = events.slice(0, 4).map((e) => ({
      at: Date.parse(e.created_at) || now,
      line: line(e),
    }));
    if (log.length === 0 && !u.public_repos) return null;

    return {
      key: "github",
      name: `github/${GH_USER}`,
      blurb: "Live GitHub activity — public commits, repos, and releases as they happen.",
      status: log.length ? "online" : "idle",
      stats: [
        { label: "commits 7d", value: String(commits7d) },
        { label: "pushes 24h", value: String(pushes24h) },
        { label: "last active", value: relShort(latestAt) },
      ],
      log: log.length ? log : [{ at: now, line: "no recent public activity" }],
      source: "live",
    };
  } catch {
    return null;
  }
}

// Browser-side live providers. Each returns null on any failure (offline,
// rate-limited, CORS) and the bot falls back to its simulated seed.
const PROVIDERS: Array<(signal?: AbortSignal) => Promise<BotStatus | null>> = [
  fetchPolymarket,
  fetchGithub,
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
