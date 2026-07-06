/**
 * Capture the R30 3D BootScene mid-sequence.
 *
 * Usage: node scripts/capture-boot.mjs [--out _r30_boot.png] [--at N]
 *  --at: ms to wait after page load before screenshot (default 1400)
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
const argAfter = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const OUT = argAfter("--out", "_r30_boot.png");
const AT = Number(argAfter("--at", 1400));
const URL = argAfter("--url", "http://localhost:5173/world");

const outAbs = resolve(process.cwd(), OUT);
mkdirSync(dirname(outAbs), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-web-security",
    "--no-sandbox",
    // Headless Chromium throttles setTimeout on invisible/backgrounded pages
    // — the boot typewriter uses setTimeout so we'd see zero progress
    // without these flags.
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  page.on("pageerror", (err) => console.log(`[page:error]`, err.message));
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") console.log(`[page:${t}]`, msg.text());
  });

  console.log(`[boot] loading ${URL}`);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log(`[boot] sleeping ${AT}ms before capture…`);
  await new Promise((r) => setTimeout(r, AT));
  console.log(`[boot] capturing → ${outAbs}`);
  await page.screenshot({ path: outAbs, type: "png" });
  console.log(`[boot] done`);
} finally {
  await browser.close();
}
