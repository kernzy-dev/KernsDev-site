/**
 * Headless-Chrome render of NOCTURNE for craft-bar review.
 *
 * Boots Chromium with WebGL enabled, loads /world, waits for the HDRI + GLTF
 * to fully load and the intro curtain to fade, scrolls the camera through the
 * WORKSHOP chapter so the hero monolith is on-frame, then screenshots to
 * `_nocturne_hero.png` at the repo root.
 *
 * Usage:  vite dev must be running on http://localhost:5173 first.
 *         node scripts/capture-nocturne.mjs [--wait N] [--scroll P] [--out path]
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
const argAfter = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const WAIT_MS = Number(argAfter("--wait", 9500));
const SCROLL_PROGRESS = Number(argAfter("--scroll", 0.5)); // WORKSHOP chapter
const OUT = argAfter("--out", "_nocturne_hero.png");
const URL = argAfter("--url", "http://localhost:5173/world?skipintro=1");

const outAbs = resolve(process.cwd(), OUT);
mkdirSync(dirname(outAbs), { recursive: true });

console.log(`[capture] launching headless Chromium…`);
// Headless Chromium on Windows needs ANGLE + SwiftShader for WebGL to actually
// produce a context. `--use-gl=swiftshader` alone silently returns null.
const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-features=Vulkan",
    "--disable-web-security", // for HDRI CORS fetch from dl.polyhaven.org
    "--no-sandbox",
  ],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();

  // Explicitly opt out of reduced-motion — otherwise the world's scroll rail
  // collapses to 100vh and scrollTo can't drive ScrollTrigger progress.
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);

  // Surface page console + network failures so silent WebGL / CORS issues aren't invisible.
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning" || t === "info") console.log(`[page:${t}]`, msg.text());
  });
  page.on("pageerror", (err) => console.log(`[page:error]`, err.message));
  page.on("requestfailed", (req) => {
    const f = req.failure();
    if (f && !req.url().includes("favicon")) {
      console.log(`[req:fail]`, req.url(), "—", f.errorText);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/assets/models/") && !res.ok()) {
      console.log(`[req:notok]`, res.status(), url);
    }
  });

  console.log(`[capture] loading ${URL}`);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Probe WebGL directly so we know if Fallback2D is going to render.
  const wg = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const g2 = !!c.getContext("webgl2");
    const c2 = document.createElement("canvas");
    const g1 = !!c2.getContext("webgl");
    const ua = navigator.userAgent;
    return { g2, g1, ua };
  });
  console.log(`[capture] webgl2=${wg.g2} webgl=${wg.g1}`);

  // Wait for the Canvas to actually exist.
  try {
    await page.waitForSelector("canvas", { timeout: 30_000 });
  } catch (e) {
    const html = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
    console.log(`[capture] no canvas after 30s. body snippet:\n${html}`);
    throw e;
  }

  // ?skipintro=1 in the URL bypasses the intro tween, so the camera is
  // free the moment WorldScene mounts. Wait for the HDRI + GLTF to Suspense-resolve
  // (heuristic: give network 4s), then scroll + settle. Bumped to 9s
  // after cold Vite dev restarts made 4.5s not enough for hydrate.
  console.log(`[capture] waiting for scene to hydrate…`);
  await new Promise((r) => setTimeout(r, 9000));

  console.log(`[capture] scrolling to progress=${SCROLL_PROGRESS}`);
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * p, behavior: "instant" });
  }, SCROLL_PROGRESS);

  // Give the ScrollTrigger scrub + camera lerp time to settle at the target
  // keyframe. The lerp is 0.18 damping so ~1s to close in; leave headroom
  // for bloom mipmaps + HDRI cubemap sampling to stabilize.
  console.log(`[capture] settling for ${WAIT_MS}ms…`);
  await new Promise((r) => setTimeout(r, WAIT_MS));

  console.log(`[capture] shooting → ${outAbs}`);
  await page.screenshot({ path: outAbs, fullPage: false, type: "png" });

  console.log(`[capture] done. path=${outAbs}`);
} finally {
  await browser.close();
}
