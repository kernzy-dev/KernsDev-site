/**
 * Capture a mid-warp frame to verify the R29 MatrixWarp visual renders.
 * Loads /world (full boot → warp → cave flow), presses a key mid-boot to
 * skip the terminal, then screenshots ~800ms into the warp so we catch
 * the Matrix glyph rain + star trails transitioning.
 *
 * Usage: node scripts/capture-warp.mjs [--out _r29_warp.png] [--at N]
 *  --at: ms into the warp phase to capture (default 900)
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
const argAfter = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const OUT = argAfter("--out", "_r29_warp.png");
const AT = Number(argAfter("--at", 900));
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
  ],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  page.on("pageerror", (err) => console.log(`[page:error]`, err.message));

  console.log(`[warp] loading ${URL}`);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Skip the boot terminal by pressing Escape (BootSequence skips on any key)
  await new Promise((r) => setTimeout(r, 600));
  await page.keyboard.press("Escape");
  console.log(`[warp] boot skipped; sleeping ${AT}ms into warp…`);
  await new Promise((r) => setTimeout(r, AT));

  console.log(`[warp] capturing → ${outAbs}`);
  await page.screenshot({ path: outAbs, type: "png" });
  console.log(`[warp] done`);
} finally {
  await browser.close();
}
