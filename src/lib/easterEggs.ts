/**
 * Client-side Easter eggs — dependency-free, defensive, and strictly cosmetic.
 *
 *  1. consoleGreeting()   — a tasteful styled console banner for curious devs.
 *  2. injectionDetector() — sniffs the URL for obvious attack payloads and,
 *                           if found, logs a cheeky warning + shows a tiny
 *                           auto-dismiss toast. It NEVER renders the payload
 *                           into the DOM (no self-inflicted XSS).
 *
 * Both no-op safely when there's no `window` (SSR / non-browser).
 */

/** Styled console banner. Pure console output — touches nothing in the DOM. */
export function consoleGreeting(): void {
  if (typeof window === "undefined" || typeof console === "undefined") return;
  try {
    console.log(
      "%c👋 curious dev?%c nothing juicy here — it's a static site.\n" +
        "%cBut if you like 3D printing + clean code → %c/services 🖨️",
      "color:#35E7E0;font-weight:700;font-size:13px;",
      "color:#9aa2b1;font-size:12px;",
      "color:#9aa2b1;font-size:12px;",
      "color:#35E7E0;font-weight:600;font-size:12px;",
    );
  } catch {
    /* console styling unsupported — not worth caring about */
  }
}

// Obvious attack signatures we scan the URL for. Intentionally simple: this is
// a wink at script kiddies, not a WAF.
const ATTACK_PATTERNS: readonly RegExp[] = [
  /<script/i,
  /'\s*or\s+1\s*=\s*1/i,
  /union\s+select/i,
  /\.\.\//,
  /\{\{/,
  /javascript:/i,
  /onerror\s*=/i,
];

/**
 * Inspect the current URL (path + query + hash) for attack payloads. On a hit:
 * warn in the console and pop a harmless fixed-text toast. The payload itself
 * is never inserted anywhere — we only read it.
 */
export function injectionDetector(): void {
  if (typeof window === "undefined") return;
  try {
    const { pathname, search, hash } = window.location;
    const haystack = decodeURIComponentSafe(pathname + search + hash);
    if (!ATTACK_PATTERNS.some((re) => re.test(haystack))) return;

    console.warn(
      "%c👀 no SQL here, friend — have a 🍪",
      "color:#f5c451;font-weight:600;",
    );
    showCookieToast();
  } catch {
    /* location unavailable or weird — stay silent */
  }
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Minimal auto-dismiss toast. Uses textContent only (a fixed, safe string) and
 * inline styles — no HTML parsing, no payload reflection. Removes itself.
 */
function showCookieToast(): void {
  showToast("👀 no SQL here — have a 🍪");
}

/* --------------------------------------------------------------------------
 * 3. konamiCode() — the classic ↑↑↓↓←→←→BA unlock. Purely cosmetic: a styled
 *    console note, a toast, and a brief hue flourish on the page. No deps.
 * ------------------------------------------------------------------------ */
const KONAMI: readonly string[] = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

export function konamiCode(): void {
  if (typeof window === "undefined") return;
  let i = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[i]) {
      if (++i === KONAMI.length) { i = 0; konamiUnlock(); }
    } else {
      i = key === KONAMI[0] ? 1 : 0;
    }
  });
}

function konamiUnlock(): void {
  try {
    console.log(
      "%c🎮 KONAMI UNLOCKED %c— up up down down… nice. thanks for poking around ✨",
      "color:#35E7E0;font-weight:800;font-size:15px;",
      "color:#9aa2b1;font-size:12px;",
    );
    showToast("🎮 ↑↑↓↓←→←→BA — you found it! ✨");
    hueFlourish();
  } catch {
    /* ignore */
  }
}

/** A short, self-removing hue-rotate pulse over the whole page. */
function hueFlourish(): void {
  if (typeof document === "undefined" || !document.documentElement) return;
  const el = document.documentElement;
  const prev = el.style.transition;
  const id = "vk-konami-kf";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@keyframes vkKonami{0%{filter:hue-rotate(0)}50%{filter:hue-rotate(180deg)}100%{filter:hue-rotate(360deg)}}";
    document.head.appendChild(style);
  }
  el.style.animation = "vkKonami 2.2s ease-in-out 1";
  window.setTimeout(() => { el.style.animation = ""; el.style.transition = prev; }, 2400);
}

/**
 * Minimal auto-dismiss toast. Uses textContent only (a fixed, safe string) and
 * inline styles — no HTML parsing, no payload reflection. Removes itself.
 */
function showToast(text: string): void {
  if (typeof document === "undefined" || !document.body) return;

  const toast = document.createElement("div");
  toast.textContent = text;
  toast.setAttribute("role", "status");
  toast.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:28px",
    "transform:translateX(-50%) translateY(12px)",
    "z-index:2147483647",
    "background:#111113",
    "color:#e8ecf4",
    "border:1px solid #35E7E0",
    "border-radius:10px",
    "padding:12px 18px",
    "font:600 13px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif",
    "box-shadow:0 12px 32px rgba(0,0,0,0.5)",
    "opacity:0",
    "transition:opacity .25s ease,transform .25s ease",
    "pointer-events:none",
  ].join(";");

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(12px)";
    window.setTimeout(() => toast.remove(), 300);
  }, 4000);
}
