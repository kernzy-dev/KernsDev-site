/**
 * Terminal boot sequence data, shared between the R26 2D `BootSequence`
 * (kept as a fallback for reduced-motion / repeat visits) and the R30
 * `BootScene` (3D CRT terminal inside the R3F Canvas).
 */

export type BootLine =
  | { kind: "prompt"; text: string; type?: number }
  | { kind: "out"; text: string; delay?: number }
  | { kind: "service"; name: string; status: string; meta: string; delay?: number }
  | { kind: "blank"; delay?: number };

export const BOOT_LINES: BootLine[] = [
  { kind: "prompt", text: "ssh grant@kernsdev.com", type: 22 },
  { kind: "out", text: "→ authenticating ... ok", delay: 220 },
  { kind: "out", text: "→ identity:  grant kerns", delay: 110 },
  { kind: "out", text: "→ spinning up services ...", delay: 180 },
  { kind: "service", name: "polymarket-bot",  status: "online", meta: "last trade 12s ago",  delay: 160 },
  { kind: "service", name: "fidel-daytrader", status: "online", meta: "watching 6 tickers",  delay: 140 },
  { kind: "service", name: "factvault",       status: "online", meta: "14 shorts queued",    delay: 150 },
  { kind: "service", name: "fire-control",    status: "online", meta: "3 devices linked",    delay: 130 },
  { kind: "blank", delay: 140 },
  { kind: "out", text: "→ ready in 1.7s", delay: 90 },
  { kind: "out", text: "→ entering ...", delay: 220 },
];

/** SessionStorage flag — set on any boot completion so repeat loads skip. */
export const BOOT_SESSION_FLAG = "kdv_booted_v1";
