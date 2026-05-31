# KernsDev Site — 30 Optimizations

A deep-think pass on the kernsdev-site project as it stands tonight (Vite + React 18 + TS + Tailwind + Framer Motion + R3F 8.x + drei 9.x + postprocessing v2.16 + PolyHaven PBR HDR/textures). Every item below has Why / How / Files / Effort / Impact — written so Future-Grant (or me) can pick any one and execute without re-discovering context.

Items are grouped by category, but the **PRIORITY SHORTLIST** at the bottom is the order I'd actually ship them.

---

## A. 3D Scene Performance (5)

### 1. InstancedMesh for trees, bushes, columns, flowers, hedges
**Why** — Right now every tree (22), bush (~20), column (4), and flower (6) is its own draw call. R3F best-practice guidance is "under 100 draw calls for smooth 60fps." Each tree alone has 3 meshes (trunk + two foliage cones) = 66 draw calls JUST for trees. `InstancedMesh` collapses all instances of the same geometry into ONE draw call regardless of count.
**How** — Replace the `.map(...).render(<Tree position=...>)` pattern with drei's `<Instances>` + `<Instance>` components. Each unique geometry (trunk, lower-foliage, upper-foliage) gets its own `<Instances>`, and inside you emit `<Instance>` per position. Set per-instance position via `<Instance position={...}/>`. Result: ~3 draw calls for ALL trees instead of 66.
**Files** — `src/components/three/Landscape.tsx` (Tree, Bush components → InstancedMesh).
**Effort** — 1-2 hours (need to careful with shadow casting; `<Instances>` supports it).
**Impact** — High. Should improve frame rate on mid-tier laptops and especially mobile by 20-40%.

### 2. Detailed LOD on the mansion
**Why** — Eagle-eye descent shows the building from FAR away (y=22 → y=7). At those distances we don't need every cornice, every dormer mullion, every window mullion. Real-time renderers reduce vertex count when objects are far. R3F has `<Detailed distances={[0, 8, 16]}>` from drei that swaps geometry by camera distance.
**How** — Build 3 mansion variants: HighDetail (current), MediumDetail (skip dormer windows + interior pointLights), LowDetail (simple box silhouette). Wrap them in `<Detailed distances={[0, 10, 25]}>` so the renderer picks one based on distance. Save them in `Building.tsx`.
**Files** — `src/components/three/Building.tsx`, possibly extract a `MansionGeometry.tsx` shared component.
**Effort** — 2-3 hours.
**Impact** — Medium-high. Most benefit during the camera-descent first second (when y=22 and the whole scene is just pixels).

### 3. Demand-only frameloop for static moments
**Why** — `<Canvas>` re-renders 60 times per second even when nothing is changing (after the camera descent completes, the only motion is mouse parallax + idle building rotation + chimney smoke if added). After the camera descent, we could swap to `frameloop="demand"` and only re-render on hover/mouse/idle-bob ticks. Massive GPU savings.
**How** — Replace `<Canvas>` with `<Canvas frameloop={running ? "always" : "demand"} />` where `running` is true during the camera animation and false after. On hover events + idle-rotation tick, call `invalidate()` from `useThree` to manually request a redraw.
**Files** — `src/components/three/Scene.tsx`, `CameraRig.tsx`, `Building.tsx`.
**Effort** — 2 hours.
**Impact** — Medium for desktop, HUGE for mobile battery + thermal.

### 4. Mobile shadow downgrade + DPR clamp
**Why** — Shadow maps at 2048×2048 + SoftShadows PCSS sampling + pixel ratio of 2 = killer on mid-tier phones. Detect mobile via `window.matchMedia('(max-width: 768px)')` and drop shadow map to 1024×1024, SoftShadows samples 10→5, dpr to [1, 1.5].
**How** — Read viewport size in `Scene.tsx`, pass quality preset to lighting + Building + canvas dpr prop. Or use `<PerformanceMonitor>` from drei which auto-adapts based on measured fps.
**Files** — `src/components/three/Scene.tsx`, `Building.tsx` (interior point lights are mobile-killers too — cut them on low tier).
**Effort** — 2 hours.
**Impact** — Medium-high on mobile. Makes the difference between "buttery 60fps" and "20fps slideshow."

### 5. OffscreenCanvas for the 3D scene
**Why** — Per 2026 R3F mobile-perf guidance, OffscreenCanvas moves all WebGL work onto a worker thread. The main thread stays free for UI (scroll, framer-motion, HTMX of the rest of the page). On mobile especially, this eliminates the "scrolling jank while the scene is rendering" problem.
**How** — drei has `<Canvas worker>` support (in newer versions). On R3F 8.x: use a custom Canvas wrapper that creates an OffscreenCanvas in a Web Worker via `transferControlToOffscreen()`. Heavier integration: Three.js + worker bundler.
**Files** — New `src/components/three/CanvasWorker.tsx`.
**Effort** — 4-6 hours (the trickiest item on this list — pointer events get hairy across the worker boundary).
**Impact** — Big on mobile. May be deferred — measure first.

---

## B. 3D Scene Visual Quality (5)

### 6. Real GLB tree models from PolyHaven
**Why** — Our cone-tree placeholders are the visual weakest link in the scene now that walls/roof/ground are PBR-textured. Swapping cones for real photogrammetric tree GLB files instantly closes the realism gap.
**How** — PolyHaven has tree models like `birch_tree_dead`, `pine_tree_01`, `oak_tree_01` at https://dl.polyhaven.org/file/ph-assets/Models/glb/2k/<name>/<name>_2k.glb. Use drei's `useGLTF('<url>')` hook, render multiple via `InstancedMesh` (combine with item #1) so all trees still ship in 1 draw call. ~200-500 KB per model.
**Files** — `src/components/three/Landscape.tsx` Tree component.
**Effort** — 2 hours.
**Impact** — Very high visual.

### 7. Selective bloom (only emissive surfaces)
**Why** — Current bloom hits the whole scene above luminance threshold. That means even the bright sky/highlights bloom slightly, which looks "overbaked." Selective bloom restricts the effect to materials we explicitly tag (windows, accent orb on roof, fountain sphere, mailbox details).
**How** — Use postprocessing's `SelectiveBloom` instead of `Bloom`. Tag meshes with a layer (`mesh.layers.enable(BLOOM_LAYER)`). Configure SelectiveBloom to only render that layer.
**Files** — `src/components/three/Scene.tsx`, Building.tsx, Landscape.tsx (assign layers).
**Effort** — 2 hours.
**Impact** — Medium. Makes glowing windows POP without the whole scene feeling hazy.

### 8. Depth of Field (DoF) for cinematic focus
**Why** — Real lenses have shallow focus. Currently everything is in equal focus. DoF would soften the far trees + sky, drawing eye to the mansion. Subliminal "this is cinema" cue.
**How** — `<DepthOfField focusDistance={0.0} focalLength={0.02} bokehScale={2}/>` from `@react-three/postprocessing`. Add to the EffectComposer pipeline AFTER Bloom but before Vignette. Tune focusDistance so the building stays sharp.
**Files** — `src/components/three/Scene.tsx`.
**Effort** — 30 min including tuning.
**Impact** — Medium-high. Cinematic depth perception.

### 9. Chimney smoke + ambient atmospheric particles
**Why** — Static scenes feel dead. Drifting smoke from the two chimneys + subtle ambient dust motes drifting through sun rays = life.
**How** — drei's `<Sparkles>` for ambient dust (low intensity, slow drift). Custom shader or particle system for chimney smoke (upward-drifting transparent puffs). Or simpler: a vertically-stretched cylinder with a soft alpha gradient.
**Files** — `src/components/three/Building.tsx` (smoke), `Landscape.tsx` (dust).
**Effort** — 1-2 hours.
**Impact** — Medium. "Alive" feeling without a real frame-rate hit.

### 10. Screen-space reflections on windows
**Why** — Glass surfaces should reflect their surroundings. Right now windows are just emissive yellow planes (warm glow). Real glass would reflect sky, hedges, the column shadows.
**How** — Two paths: (a) Set window material `roughness=0.05`, `metalness=0`, `envMapIntensity=1.5` — relies on the HDR environment for reflection. Cheap. (b) Full screen-space reflections via `postprocessing` v6+'s SSR effect — costs more, much more accurate. Try (a) first.
**Files** — `src/components/three/Building.tsx` Window component.
**Effort** — 30 min for (a), 2 hours for (b).
**Impact** — Medium-high for (a), high for (b).

---

## C. Bundle Size + Code Splitting (4)

### 11. Vite manualChunks for heavy 3D libs
**Why** — Current bundle has `Scene.js` at 1.07 MB (320 KB gzipped). That's framer-motion, R3F, drei, postprocessing, three.js all in one chunk. Split them into individual vendor chunks. Browser caches each separately — small Building.tsx tweaks won't re-download three.js.
**How** — In `vite.config.ts`, add `build.rollupOptions.output.manualChunks`. Group: `three-vendor` (three), `r3f-vendor` (@react-three/fiber + drei), `postprocess-vendor` (postprocessing + @react-three/postprocessing), `framer-vendor` (framer-motion). **CAVEAT**: GitHub issues #12209 and #17653 show that aggressive manualChunks can break lazy loading — keep `Scene.lazy()` boundary intact and let chunks fall under it.
**Files** — `vite.config.ts`.
**Effort** — 1 hour including bundle-analyzer verification.
**Impact** — Medium for re-visit caching. Doesn't reduce first-load — the bytes still ship.

### 12. rollup-plugin-visualizer audit + tree-shaking
**Why** — Drei has dozens of helpers and only a few are needed (Environment, ContactShadows, SoftShadows, Sky-which-we-removed). Need to verify nothing extra is bundled. Visualizer shows exactly what's in each chunk.
**How** — `npm i -D rollup-plugin-visualizer`. Add to vite.config.ts plugins. `npm run build` produces a `stats.html`. Manually audit + replace barrel imports (`import { Foo } from '@react-three/drei'`) with deep imports (`import { Foo } from '@react-three/drei/core/Foo'`) where possible.
**Files** — `vite.config.ts`, all `Scene.tsx`/`Building.tsx`/`Landscape.tsx` imports.
**Effort** — 2 hours.
**Impact** — Could shave 50-150 KB gzipped depending on what's bloating drei.

### 13. Lazy-load below-fold sections
**Why** — `About`, `FeaturedWork`, `Products`, `Services`, `Contact`, `Footer` all ship in the main bundle but the user can't see them until they scroll. Initial render only needs Nav + Hero + BuildingShowcase scaffold.
**How** — Wrap each below-fold section in `React.lazy()` + Suspense in `App.tsx`. Use IntersectionObserver to load each just before it scrolls into view.
**Files** — `src/App.tsx`, each section component.
**Effort** — 1 hour.
**Impact** — Smaller LCP, slightly snappier first paint. ~30 KB shaved off initial.

### 14. Preload critical assets via `<link rel="preload">`
**Why** — The HDR (~1.2 MB) and stone PBR (~10 MB) start downloading only AFTER the Scene chunk parses. They could start downloading in PARALLEL with the JS — that's what preload hints do.
**How** — In `index.html`, add `<link rel="preload" as="fetch" href="https://dl.polyhaven.org/.../kloofendal_43d_clear_puresky_1k.hdr" crossorigin>` for the HDR and each key texture. Browser starts fetches during HTML parse, far earlier than JS execution.
**Files** — `index.html`.
**Effort** — 15 min.
**Impact** — High for first paint of the 3D scene. May cut 1-2 seconds off "Loading the scene…" wait.

---

## D. Asset Optimization (4)

### 15. Self-host PolyHaven assets in /public
**Why** — We load from `dl.polyhaven.org` at runtime. Risks: (a) PolyHaven might rate-limit or take a downtime hit, (b) DNS lookup + TLS handshake to their CDN adds latency, (c) Cloudflare Pages already gives us a global CDN with HTTP/2 push. Self-hosting puts assets on the same origin = no second TLS handshake, served from edge cache.
**How** — `scripts/fetch-assets.sh` or `.ps1` that curls each PolyHaven URL into `public/textures/`. Update `PBRMaterials.tsx` URL constants to point at `/textures/...`. The downside: +13 MB to the build/deploy size. Cloudflare Pages free tier limit is 25 MB per file but unlimited total — fine.
**Files** — New `scripts/fetch-assets.ps1`, `src/components/three/PBRMaterials.tsx`, `src/components/three/Scene.tsx` (HDR URL).
**Effort** — 1 hour.
**Impact** — Medium. Faster 2nd visit (browser caches against your domain), and removes a third-party dependency.

### 16. KTX2 / Basis Universal texture compression
**Why** — Current PolyHaven JPGs total ~10-15 MB. KTX2/Basis Universal supercompressed textures are typically 3-5× smaller AND decode on the GPU (using less RAM at runtime). Three.js has `KTX2Loader` built-in.
**How** — Use the basisu CLI (or `gltf-transform optimize` which calls it) to convert each PNG/JPG texture to .ktx2. Update `useTexture` to use `useKTX2` from drei. Load `basis_transcoder.wasm` via drei's transcoder helper.
**Files** — Asset pipeline (new), `PBRMaterials.tsx`.
**Effort** — 3-4 hours (basisu install is a chore on Windows).
**Impact** — Big — could reduce first-load by 5-8 MB, also reduces GPU memory by ~40%.

### 17. Convert Fleetcast screenshots to AVIF/WebP with `<picture>` fallback
**Why** — `fleetcast-dashboard.png` is 36 KB; `fleetcast-remote.png` is 50 KB. Small but cumulative. AVIF is 40-60% smaller than PNG at similar quality. WebP fallback for older Safari.
**How** — Use `sharp-cli` or online converters. Save as `fleetcast-dashboard.avif` (+ .webp + .png). In `Products.tsx`, use `<picture><source type="image/avif" srcset="..."><source type="image/webp" srcset="..."><img src="...png"/></picture>`.
**Files** — `public/*.png` + new `.avif`/`.webp`, `src/components/Products.tsx`, possibly `FeaturedWork.tsx` once we add real screenshots.
**Effort** — 30 min per image.
**Impact** — Small for now (2 images), grows as we add more.

### 18. Use vite-imagetools for responsive image srcset generation
**Why** — Different devices need different image sizes. Currently we serve full-resolution screenshots to mobile devices too. Saves bandwidth and improves LCP.
**How** — `npm i -D vite-imagetools`. Import images with query params: `import img from './screenshot.png?w=400;800;1200&format=avif;webp;png&as=picture'`. Plugin generates resized variants at build time and the `as=picture` returns a ready-to-spread object.
**Files** — `vite.config.ts`, every component using a raster image.
**Effort** — 1-2 hours.
**Impact** — Medium for mobile users.

---

## E. Loading UX (3)

### 19. Three.js DefaultLoadingManager progress bar
**Why** — Currently "Loading the scene…" is a static string for 5-10 seconds. User has no idea if it's stuck or progressing. A real progress percentage = much better perceived wait.
**How** — Use drei's `useProgress()` hook (uses Three's DefaultLoadingManager internally). Render `{Math.round(progress)}%` in the Suspense fallback while loaded < 100. Combine with a thin progress bar UI.
**Files** — `src/components/BuildingShowcase.tsx` (the Suspense fallback).
**Effort** — 30 min.
**Impact** — Big for perceived performance.

### 20. Low-res HDR preview → full HDR swap
**Why** — The 1K HDR is ~1.2 MB. We could load a 256×128 PNG preview of the HDR sky FIRST (~30 KB, baked in `/public`), use that as the immediate background, then swap to the full HDR once it arrives. Eliminates the "white flash" moment between page load and HDR ready.
**How** — Bake a low-res PNG of the kloofendal sunset (drop colors into a tiny gradient). Set scene background to that PNG immediately. Listen for the full HDR's loaded event, then `scene.background = highResHDR`.
**Files** — `public/sky-preview.png`, `Scene.tsx`.
**Effort** — 1 hour.
**Impact** — Medium-high perceived performance polish.

### 21. Skeleton/blur-up placeholder for the 3D viewport
**Why** — Even with progress %, the scene area is just a loading message. Replace with a faint stylized SVG silhouette of the mansion + violet glow — communicates "this is where the 3D will be" before the 3D arrives.
**How** — Inline SVG in BuildingShowcase's fallback, with a subtle pulse animation. CSS only, zero JS.
**Files** — `src/components/BuildingShowcase.tsx`.
**Effort** — 1 hour (drawing the SVG).
**Impact** — High for perceived polish. Shows intent.

---

## F. SEO + Meta (3)

### 22. Open Graph + Twitter Card with rendered preview image
**Why** — When someone shares kernsdev.com on Twitter/LinkedIn/iMessage, the unfurl currently has no image. Adding `og:image` with a rendered preview of the mansion = huge first-impression boost.
**How** — Render the scene once at high quality, screenshot a 1200×630 PNG, save to `/public/og-preview.png`. Add `<meta property="og:image" content="/og-preview.png">` and `<meta name="twitter:card" content="summary_large_image">` to `index.html`. Could automate via a Cloudflare Pages Function that screenshots the live site weekly.
**Files** — `public/og-preview.png`, `index.html`.
**Effort** — 30 min (just need a good screenshot).
**Impact** — High when the site gets shared (social media is huge for portfolios).

### 23. JSON-LD structured data
**Why** — Google can show rich snippets if you tag yourself with schema.org Person markup. Helps "Grant Kerns" / "KernsDev" search results display nicer.
**How** — Add `<script type="application/ld+json">` to `index.html` with Person + ProfilePage + Organization schema. Include name, jobTitle, knowsAbout (skills array), address, sameAs (your GitHub/LinkedIn/etc when those exist).
**Files** — `index.html`.
**Effort** — 30 min.
**Impact** — Small-medium. SEO long-tail.

### 24. sitemap.xml + robots.txt + canonical URLs
**Why** — Search engines need to know what pages exist. Even for a single-page site, sitemap.xml signals "this is the URL, here's its update date." Canonical URL prevents duplicate-content issues across www/non-www variants.
**How** — Static `public/sitemap.xml` listing kernsdev.com + key anchors (#work, #products, #services). `public/robots.txt` with `Sitemap:` reference + allow-all crawl directives. `<link rel="canonical" href="https://kernsdev.com/">` in `index.html`.
**Files** — `public/sitemap.xml`, `public/robots.txt`, `index.html`.
**Effort** — 15 min.
**Impact** — Small but expected — Google crawlers check these.

---

## G. Accessibility (3)

### 25. prefers-reduced-motion compliance
**Why** — Vestibular-disorder users disable motion via OS setting. Currently we'd hit them with parallax + camera descent + scroll-reveals + idle mansion rotation. Browser exposes `(prefers-reduced-motion: reduce)` via matchMedia.
**How** — Read the media query in `Hero.tsx`, `Reveal.tsx`, `Scene.tsx`. If reduced-motion is on: skip framer-motion scroll-reveals (just set final state), skip camera descent (camera starts in final position), freeze the mansion's idle rotation, skip the chimney smoke.
**Files** — All animation-using components.
**Effort** — 1 hour.
**Impact** — Critical for accessibility compliance. Also generally a "polite" pattern.

### 26. Keyboard + focus navigation for hover zones
**Why** — Currently the building hover tooltip only fires on mouse `pointerOver`. Keyboard users (Tab navigation) can't see the Honest/Fast/Detail-oriented values. Touch users also miss out unless they tap-and-hold.
**How** — Add invisible buttons positioned over each hover zone (use `<Html occlude>` from drei to project the 3D zone into DOM). Make them keyboard-focusable; their focus event triggers the same setActive() that mouse hover does. Show a focus ring on the legend badges at the top-right.
**Files** — `src/components/three/Building.tsx`, `BuildingShowcase.tsx`.
**Effort** — 2-3 hours.
**Impact** — Critical for a11y compliance + makes the experience work on touch.

### 27. Alt text + screen-reader landmark + visible link skip
**Why** — Screen readers currently get nothing meaningful about the 3D scene. Add an `aria-label` or visually-hidden description: "Interactive 3D scene showing a Georgian mansion. Each architectural part represents a value: foundation = honest, walls = fast, roof = detail-oriented." Also add a "skip to content" link for keyboard users to jump past the long page.
**How** — Edit `BuildingShowcase.tsx` to wrap the canvas with `<div role="img" aria-label="...">`. Add `<a href="#products" class="sr-only focus:not-sr-only">Skip to products</a>` as the first element in Nav.tsx.
**Files** — `BuildingShowcase.tsx`, `Nav.tsx`, `index.css` (sr-only utility).
**Effort** — 30 min.
**Impact** — Critical for a11y.

---

## H. Lighthouse / Core Web Vitals + Polish (3)

### 28. CLS prevention via explicit dimensions
**Why** — Cumulative Layout Shift = images and dynamic content shifting layout as they load. Every `<img>` and the 3D canvas div should have explicit `width`/`height` attributes (or aspect-ratio CSS) so the browser reserves space before content arrives.
**How** — Audit all `<img>` (Fleetcast screenshots) for `width`/`height` attributes. Wrap 3D canvas in a container with `aspect-ratio: 16/10` or set min-height. Skeleton placeholder (#21) already does this for the canvas area.
**Files** — `Products.tsx`, `BuildingShowcase.tsx`.
**Effort** — 30 min.
**Impact** — Lighthouse score boost. Real users won't notice but Google does.

### 29. Image loading="lazy" + decoding="async"
**Why** — Below-fold images shouldn't block the initial render. `loading="lazy"` defers their fetch until they near the viewport. `decoding="async"` lets the decoder work off the main thread.
**How** — Add both attributes to every `<img>` that's not above-the-fold. The Fleetcast screenshot in Products.tsx is below-fold so it qualifies.
**Files** — `Products.tsx`, future `FeaturedWork.tsx` once screenshots are added.
**Effort** — 5 min.
**Impact** — Small but free.

### 30. Resource hints — preconnect/dns-prefetch for fonts + assets origin
**Why** — Currently we connect to fonts.googleapis.com, fonts.gstatic.com, and (in this round) dl.polyhaven.org. Each connection needs DNS + TLS handshake. `<link rel="preconnect">` warms those connections during HTML parse so they're ready when the JS asks for them.
**How** — Already have preconnect for fonts. Add `<link rel="preconnect" href="https://dl.polyhaven.org" crossorigin>` and `<link rel="dns-prefetch" href="https://dl.polyhaven.org">` to `index.html`.
**Files** — `index.html`.
**Effort** — 5 min.
**Impact** — Saves 100-300 ms on first asset fetch.

---

# PRIORITY SHORTLIST (the order I'd actually ship them)

### Tier 1 — Free wins, ship now (under 1 hr each)
1. **#14 preload HDR + textures** (15 min) — biggest first-paint win for the 3D scene
2. **#30 preconnect to dl.polyhaven.org** (5 min) — companion to #14
3. **#19 progress bar in Suspense fallback** (30 min) — fixes the "is it broken or loading?" feeling
4. **#28 CLS prevention via explicit dimensions** (30 min) — Lighthouse + visual stability
5. **#29 loading="lazy" + decoding="async"** (5 min)
6. **#24 sitemap.xml + robots.txt + canonical** (15 min)
7. **#23 JSON-LD structured data** (30 min)
8. **#10a envMap window reflections** (30 min) — visual quality, almost free

### Tier 2 — Big wins, weekend project (2-4 hr each)
9. **#22 OG preview image** (30 min once we have a good screenshot) — huge for shareability
10. **#25 prefers-reduced-motion** (1 hr) — a11y critical, code is straightforward
11. **#27 screen-reader landmark + skip link** (30 min) — a11y
12. **#1 InstancedMesh for trees/bushes/columns** (1-2 hr) — biggest 3D perf win available
13. **#6 Real GLB tree models** (2 hr) — biggest 3D visual win remaining
14. **#8 Depth of Field** (30 min) — cinematic polish
15. **#13 Lazy-load below-fold sections** (1 hr)
16. **#21 Skeleton SVG placeholder** (1 hr)

### Tier 3 — Bigger projects (4+ hr or trickier)
17. **#16 KTX2 texture compression** (3-4 hr) — significant load-time savings if PBR weighs you down
18. **#15 Self-host PolyHaven assets** (1 hr to fetch + commit, but +13 MB to repo)
19. **#26 Keyboard focus navigation for hover zones** (2-3 hr) — a11y + touch support
20. **#11 + #12 Vite manualChunks + bundle audit** (2-3 hr)
21. **#3 Demand frameloop** (2 hr) — battery saver
22. **#2 LOD on mansion** (2-3 hr)
23. **#5 OffscreenCanvas** (4-6 hr) — measure first

### Tier 4 — Save for later or only if needed
- **#4 mobile shadow downgrade** (2 hr) — wait until we actually have mobile metrics
- **#7 Selective bloom** (2 hr) — wait until user feedback complains
- **#9 Chimney smoke + ambient dust** (1-2 hr) — nice-to-have polish
- **#17 AVIF for Fleetcast screenshots** (30 min) — small ROI right now
- **#18 vite-imagetools** (1-2 hr) — overkill until we have many images
- **#20 Low-res HDR preview** (1 hr) — depends on whether #14/#19 already smooth the load

---

# IMPLEMENTATION RECIPE FOR A SINGLE SITTING

If you have 90 minutes and want maximum visible improvement:

1. Add preload + preconnect hints to `index.html` (15 min) — #14, #30
2. Wire useProgress() into the Suspense fallback (30 min) — #19
3. Add envMap reflections to windows (30 min) — #10a
4. Bake an OG preview screenshot and wire meta tags (15 min) — #22

That's a noticeably faster + more polished + shareable site in one sitting, zero new dependencies.

If you have a whole afternoon (4 hr):

- Above 90-min set, then
- InstancedMesh refactor for trees + bushes + columns + flowers (#1)
- Swap cone trees for real GLB models from PolyHaven (#6)

Result: site loads ~2 seconds faster, runs at higher fps, has actual photoreal tree models.

---

# OUT OF SCOPE BUT WORTH THINKING ABOUT

- **Multi-page architecture** — when the site grows, break into routes (Astro? Next.js? Or just React Router on Vite?). For now single-page is fine.
- **CMS for the portfolio** — once you have 5+ projects you'll want them in markdown files, not hardcoded React arrays. A `/content/projects/*.md` + `import.meta.glob` pattern with frontmatter is the lightest possible CMS.
- **Email + booking integration** — when those exist, replace the Contact.tsx placeholders.
- **Analytics** — Plausible.io or Umami (privacy-friendly, no cookie banner needed) over Google Analytics.
- **Error monitoring** — Sentry has a free tier; worth wiring before the site sees real traffic.
- **A/B testing infrastructure** — overkill until traffic justifies. PostHog has a free tier.
- **Dark/light mode toggle** — could swap accent themes without touching the 3D scene. ~1 hr.

---

# REFERENCES (from research while writing this)

- [Scaling performance — React Three Fiber docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Boosting React Three Fiber Mobile Performance in 2026 — Krapton](https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c)
- [100 Three.js Tips That Actually Improve Performance (2026) — utsubo.com](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Building Efficient Three.js Scenes — Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [Three.js Instances tutorial — Codrops](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)
- [Taming Large Chunks in Vite + React — Mykola Aleksandrov](https://www.mykolaaleksandrov.dev/posts/2025/11/taming-large-chunks-vite-react/)
- [Using manualChunks breaks code-splitting (issue #12209) — Vite GitHub](https://github.com/vitejs/vite/issues/12209)
- [KTX2Loader — Three.js docs](https://threejs.org/docs/pages/KTX2Loader.html)
- [Basis Universal GPU Texture Codec — BinomialLLC GitHub](https://github.com/BinomialLLC/basis_universal)
