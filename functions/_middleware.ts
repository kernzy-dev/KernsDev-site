/**
 * Cloudflare Pages Functions middleware — runs server-side for every request
 * BEFORE the SPA `/* -> /index.html 200` fallback in public/_redirects.
 *
 * Job: catch the usual drive-by scanner traffic (WordPress/PHP probes, secret
 * paths, vuln-scanner user-agents), log a single structured line to the Pages
 * function logs, and serve a harmless on-brand gag page instead of letting the
 * bot think it found a live CMS. Everything else falls straight through to the
 * real static site via `next()`.
 *
 * Zero npm dependencies — pure Pages-Functions runtime (Workers APIs only).
 * `@cloudflare/workers-types` isn't installed in this project, so we define a
 * minimal local type for the handler context instead of relying on the
 * ambient `PagesFunction` global.
 */

interface MiddlewareContext {
  request: Request;
  next: () => Promise<Response>;
}

// Scanner-bait paths. Matched case-insensitively as a PREFIX of the pathname,
// so `/wp-admin/setup-config.php` still trips `/wp-admin`. The two "bait"
// paths (/secret-admin, /flag.txt) are also advertised in robots.txt.
const HONEYPOT_PATHS: readonly string[] = [
  "/admin",
  "/administrator",
  "/wp-admin",
  "/wp-login.php",
  "/.env",
  "/.git/config",
  "/phpmyadmin",
  "/xmlrpc.php",
  "/shell.php",
  "/config.php",
  "/secret-admin",
  "/flag.txt",
];

// Known offensive-security / scanning tools. Matched as a case-insensitive
// substring of the User-Agent header.
const BAD_USER_AGENTS: readonly string[] = [
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "acunetix",
  "nessus",
  "zgrab",
  "nuclei",
];

/** Escape a string for safe interpolation into HTML text/attribute content. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** On-brand, dependency-free gag page. `path` is already escaped by caller. */
function gagPage(safePath: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>Nice try — KernsDev</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background: #0a0a0a;
    color: #e8ecf4;
    font-family: ui-sans-serif, system-ui, -apple-system, "Inter", sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100%; padding: 24px; line-height: 1.6;
  }
  .card {
    max-width: 560px; width: 100%;
    background: #111113;
    border: 1px solid #262629;
    border-radius: 14px;
    padding: 40px 36px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }
  .eyebrow {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #35E7E0; margin: 0 0 14px;
  }
  h1 { font-size: 1.6rem; margin: 0 0 14px; letter-spacing: -0.02em; }
  code {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    background: #1b1b1f; border: 1px solid #2a2a2e;
    border-radius: 6px; padding: 1px 7px; color: #c6ccd8;
    word-break: break-all;
  }
  p { color: #9aa2b1; margin: 0 0 14px; }
  a.home {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 12px; color: #0a0a0a; background: #35E7E0;
    text-decoration: none; font-weight: 600;
    padding: 10px 18px; border-radius: 9px;
  }
  a.home:hover { background: #28c7c1; }
</style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">🕵️ 404 · security theater</p>
    <h1>Looking for <code>${safePath}</code>?</h1>
    <p>
      This is a static site. No WordPress, no PHP, no database, no admin
      panel — just HTML, a little WebGL, and clean code.
    </p>
    <p>Nice try, though. Here's a coffee for the effort. ☕</p>
    <a class="home" href="/">← Back to kernsdev.com</a>
  </main>
</body>
</html>`;
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathLower = url.pathname.toLowerCase();
  const ua = request.headers.get("user-agent") || "";
  const uaLower = ua.toLowerCase();

  const pathHit = HONEYPOT_PATHS.some((p) => pathLower.startsWith(p));
  const uaHit = BAD_USER_AGENTS.some((bad) => uaLower.includes(bad));

  if (pathHit || uaHit) {
    // Single structured line — surfaces in `wrangler pages ... tail` / the
    // Cloudflare dashboard function logs.
    console.log(
      JSON.stringify({
        tag: "honeypot",
        ts: new Date().toISOString(),
        ip: request.headers.get("cf-connecting-ip"),
        ua,
        method: request.method,
        path: url.pathname,
        reason: pathHit ? "path" : "user-agent",
      }),
    );

    return new Response(gagPage(escapeHtml(url.pathname)), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  }

  return next();
}
