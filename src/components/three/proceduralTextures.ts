import * as THREE from "three";

/**
 * Procedural Canvas textures — no asset downloads, full control over look.
 * Each function returns a THREE.CanvasTexture you can plug into a material's
 * `map`, `normalMap` (rarely), etc.
 */

function newCanvas(size = 512): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function finishTexture(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Warm wood plank texture with vertical grain + horizontal seams. */
export function makeWoodTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = newCanvas(512);
  // Base
  ctx.fillStyle = "#7d4a25";
  ctx.fillRect(0, 0, 512, 512);
  // Vertical grain — many short strokes
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 80;
    const shade = Math.random() * 0.35;
    ctx.strokeStyle = `rgba(0,0,0,${shade})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }
  // Horizontal plank seams every 80px
  for (let y = 80; y < 512; y += 80) {
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    // Highlight just above the seam
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y - 2);
    ctx.lineTo(512, y - 2);
    ctx.stroke();
  }
  return finishTexture(canvas, 1);
}

/** Concrete texture for the driveway — gray with small dark specks. */
export function makeConcreteTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = newCanvas(512);
  ctx.fillStyle = "#6b6b6b";
  ctx.fillRect(0, 0, 512, 512);
  // Color noise
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  // Dark specks
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Subtle expansion-joint line in the middle
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();
  return finishTexture(canvas, 2);
}

/** Asphalt shingle pattern — rows of staggered tiles. */
export function makeShingleTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = newCanvas(512);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, 512, 512);
  const rowH = 64;
  for (let row = 0; row < 8; row++) {
    const y = row * rowH;
    const offset = (row % 2) * 32;
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + offset;
      // Shingle base
      ctx.fillStyle = `hsl(0, 0%, ${10 + Math.random() * 15}%)`;
      ctx.fillRect(x, y, 64, rowH);
      // Shingle edge highlight
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, 64, rowH);
      // Granular noise on the surface
      for (let i = 0; i < 25; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(x + Math.random() * 64, y + Math.random() * rowH, 1, 1);
      }
    }
  }
  return finishTexture(canvas, 4);
}

/** Limestone / cream stone for mansion walls — subtle warm beige with cracks. */
export function makeLimestoneTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = newCanvas(512);
  // Cream base
  ctx.fillStyle = "#e8dcc1";
  ctx.fillRect(0, 0, 512, 512);
  // Block courses — 6 rows of stone blocks, alternating offset
  const rowH = 85;
  for (let row = 0; row < 7; row++) {
    const y = row * rowH;
    const offset = (row % 2) * 80;
    for (let col = -1; col < 5; col++) {
      const x = col * 170 + offset;
      // Per-stone tone variation
      const lightness = 78 + Math.random() * 12;
      ctx.fillStyle = `hsl(${35 + Math.random() * 10}, ${20 + Math.random() * 10}%, ${lightness}%)`;
      ctx.fillRect(x, y, 170, rowH);
      // Mortar lines
      ctx.strokeStyle = "rgba(120,100,80,0.55)";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, 170, rowH);
      // Subtle weathering specks
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
        ctx.fillRect(x + Math.random() * 170, y + Math.random() * rowH, 2, 2);
      }
    }
  }
  return finishTexture(canvas, 1);
}

/** Grass — mottled greens with bright dots. */
export function makeGrassTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = newCanvas(512);
  ctx.fillStyle = "#2d4a1f";
  ctx.fillRect(0, 0, 512, 512);
  // Greener blotches
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `hsla(${90 + Math.random() * 30}, ${40 + Math.random() * 30}%, ${15 + Math.random() * 18}%, 0.6)`;
    const r = 10 + Math.random() * 35;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lighter highlight blades
  for (let i = 0; i < 600; i++) {
    ctx.strokeStyle = `hsla(${80 + Math.random() * 20}, ${40 + Math.random() * 30}%, ${25 + Math.random() * 20}%, 0.4)`;
    ctx.lineWidth = 1;
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 4 - Math.random() * 4);
    ctx.stroke();
  }
  return finishTexture(canvas, 16);
}
