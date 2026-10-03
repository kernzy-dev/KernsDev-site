// 3D-print storefront catalog. Physical prints made on the Bambu X2D and shipped
// to the buyer. Checkout uses Stripe PAYMENT LINKS (no backend, no secret key in
// this repo): create each product in the Stripe dashboard, enable shipping-address
// + shipping-rate collection on the Payment Link, then paste its URL into
// `stripeLink` below. See SHOP_SETUP.md.
//
// SAFETY: never put a Stripe SECRET key (sk_...) anywhere in this repo or a VITE_
// var — those ship to the browser. Payment Links need only the public URL here.

export type Print = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Display price, e.g. "$28". The real charge is set on the Stripe Payment Link. */
  price: string;
  /** Image under /public/prints/ (e.g. "/prints/dragon.jpg"). Missing = gradient fallback. */
  image?: string;
  /** Optional product video under /public/prints/ (e.g. "/prints/dragon.mp4").
   *  When set, the card plays it (muted autoplay loop) instead of the image. */
  video?: string;
  /** Optional web-optimized GLB under /public/models/shop/ (e.g.
   *  "/models/shop/dice-tower.glb"). When set, the card offers a drag-to-rotate
   *  360° viewer. */
  model?: string;
  /** Hex color (no #) the 360° viewer paints the model in — matches the render. */
  modelColor?: string;
  material: string; // "PLA Matte", "PETG", ...
  size: string; // "120 × 80 × 40 mm"
  leadTime?: string; // "Made to order · ships in 3–5 days"
  /** Stripe Payment Link URL for the SMALL/base size (https://buy.stripe.com/...). Empty = "Coming soon". */
  stripeLink: string;
  /** Stripe links for the scaled sizes; filled in once priced + created. */
  sizeLinks?: { M?: string; L?: string };
  badge?: string;
  soldOut?: boolean;
  /** Category tags for the shop's filter bar (e.g. ["Halloween", "Home & Decor"]). */
  tags?: string[];
  /** When set, the card sells by QUANTITY (pick how many) with bulk pricing
   *  instead of S/M/L sizes. See `packTotal`. */
  pack?: Pack;
};

/** Quantity-pack pricing: `unit` dollars each, with `off` dollars off the total
 *  for every `per` units bought (e.g. $2 each, $0.50 off per 5). */
export type Pack = { unit: number; per: number; off: number };

/** Total price for `qty` units under a pack's bulk-discount rule. */
export function packTotal(pack: Pack, qty: number): number {
  const q = Math.max(1, Math.floor(qty || 1));
  return Math.max(0, q * pack.unit - Math.floor(q / pack.per) * pack.off);
}

// Category order for the filter bar. Products carry `tags` from this set; the bar
// shows "All" + these (only the ones actually used appear).
export const CATEGORY_ORDER = [
  "Halloween",
  "Home & Decor",
  "Desk & Office",
  "Tabletop & Games",
  "Toys & Fidgets",
  "Personalized",
];

/** Distinct categories actually used by the catalog, in CATEGORY_ORDER. */
export function catalogCategories(): string[] {
  const used = new Set(PRINTS.flatMap((p) => p.tags ?? []));
  return CATEGORY_ORDER.filter((c) => used.has(c));
}

/** Distinct materials actually used by the catalog, alphabetical. */
export function catalogMaterials(): string[] {
  return Array.from(new Set(PRINTS.map((p) => p.material))).sort();
}

/** Numeric price (from the "$28" display string) for sorting/filtering. */
export function priceValue(p: Print): number {
  return parseFloat(p.price.replace(/[^\d.]/g, "")) || 0;
}

/** A selectable size for a product — dimensions + price + its own checkout link. */
export type SizeOption = {
  key: "S" | "M" | "L";
  name: string;
  dims: string;
  price: string;
  stripeLink: string;
};

// Size scaling rule: dimensions scale linearly; price scales ~with print
// time/material (between area and volume). S = the product's base size/price.
const SIZE_RULES = [
  { key: "S" as const, name: "Small", dim: 1.0, price: 1.0 },
  { key: "M" as const, name: "Medium", dim: 1.6, price: 1.8 },
  { key: "L" as const, name: "Large", dim: 2.2, price: 3.0 },
];

const scaleDims = (size: string, f: number) =>
  size.replace(/[\d.]+/g, (n) => String(Math.round(parseFloat(n) * f)));
const scalePrice = (price: string, f: number) => {
  const n = parseFloat(price.replace(/[^\d.]/g, "")) || 0;
  return "$" + Math.round(n * f);
};

/** Build the three size options for a product from its base size + price. */
export function sizeOptions(p: Print): SizeOption[] {
  return SIZE_RULES.map((r) => ({
    key: r.key,
    name: r.name,
    dims: scaleDims(p.size, r.dim),
    price: scalePrice(p.price, r.price),
    stripeLink: r.key === "S" ? p.stripeLink : p.sizeLinks?.[r.key] ?? "",
  }));
}

// Starter lineup — all NON-BRANDED / commercially-sellable subjects (no fan-art
// IP). Leave stripeLink "" until the Payment Link exists; the card then shows a
// disabled "Coming soon" so nothing broken ships. Add photos to /public/prints/.
export const PRINTS: Print[] = [
  {
    id: "halloween-pumpkin-cat",
    tags: ["Halloween", "Home & Decor"],
    name: "Jack-o'-Lantern Kitty",
    tagline: "Chibi cat peeking from a carved pumpkin.",
    description:
      "A chibi kitty tucked into a carved jack-o'-lantern — a cute seasonal desk piece or Halloween gift. Made to order; pick your colors.",
    price: "$22",
    image: "/prints/halloween-pumpkin-cat.webp",
    model: "/models/shop/halloween-pumpkin-cat.glb",
    modelColor: "e0842e",
    material: "PLA",
    size: "75 × 75 × 75 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/5kQ00igAZ3u67AIbV30000a",
    badge: "Halloween",
  },
  {
    id: "neutral-pumpkin",
    tags: ["Halloween", "Home & Decor"],
    name: "Ridged Pumpkin",
    tagline: "Minimalist ridged pumpkin — neutral fall decor.",
    description:
      "A clean, ridged decorative pumpkin in a minimalist neutral style — modern farmhouse fall & Halloween decor. Made to order; pick your size and color. Large fills the full print bed for a real statement piece.",
    price: "$28",
    image: "/prints/neutral-pumpkin.webp",
    model: "/models/shop/neutral-pumpkin.glb",
    modelColor: "ece7dc",
    material: "PLA",
    size: "116 × 116 × 103 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "New",
  },
  {
    id: "halloween-witch-dog",
    tags: ["Halloween", "Home & Decor"],
    name: "Witchy Wiener Dog",
    tagline: "Dachshund in a witch hat — full Halloween charm.",
    description:
      "A chibi dachshund decked out for Halloween — striped witch hat, ghost costume, and a tiny trick-or-treat pumpkin. A cute seasonal desk piece; printed in full color. Made to order; pick your size.",
    price: "$24",
    image: "/prints/halloween-witch-dog.webp",
    model: "/models/shop/halloween-witch-dog.glb",
    modelColor: "e8e4dc",
    material: "PLA",
    size: "150 × 60 × 90 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Halloween",
  },
  {
    id: "halloween-cute-ghost",
    tags: ["Halloween", "Home & Decor"],
    name: "Cozy Ghost",
    tagline: "Bundled-up ghost with a latte & a jack-o'-lantern.",
    description:
      "A spooky-cute little ghost all bundled up for fall — pom-pom beanie, a pumpkin-spice latte in one hand and a tiny carved jack-o'-lantern in the other. About an inch tall; the perfect desk buddy, shelf companion, or party favor. Build a whole gang: pick how many you want, and every 5 you add knocks the price down. Made to order; pick your color.",
    price: "$2",
    image: "/prints/halloween-cute-ghost.webp",
    model: "/models/shop/halloween-cute-ghost.glb",
    material: "PLA",
    size: "~17 × 17 × 24 mm each",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Halloween",
    pack: { unit: 2, per: 5, off: 0.5 },
  },
  {
    id: "articulated-dragon",
    tags: ["Tabletop & Games", "Home & Decor"],
    name: "Winged Dragon",
    tagline: "Detailed winged dragon centerpiece.",
    description:
      "A striking winged dragon, poised with wings raised — a clean display piece for a shelf, desk, or D&D table. Printed in one solid color or finished in a metallic filament.",
    price: "$28",
    image: "/prints/articulated-dragon.webp",
    model: "/models/shop/articulated-dragon.glb",
    modelColor: "14b8a6",
    material: "PLA Matte",
    size: "150 × 130 × 110 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/cNieVc98x3u6g7e7EN00008",
    badge: "Bestseller",
  },
  {
    id: "articulated-axolotl",
    tags: ["Toys & Fidgets"],
    name: "Articulated Slug",
    tagline: "Squishy, wiggly print-in-place fidget.",
    description:
      "A fully articulated slug with a satisfying wiggle — printed in one piece, no assembly. A goofy, tactile desk buddy. Great in silk pastels or a two-tone body.",
    price: "$16",
    image: "/prints/articulated-axolotl.webp",
    model: "/models/shop/articulated-axolotl.glb",
    modelColor: "d87fb8",
    material: "Silk PLA",
    size: "150 × 40 × 30 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/aFa9AS98xd4G8EM4sB00009",
    badge: "Fan favorite",
  },
  {
    id: "desk-organizer",
    tags: ["Desk & Office"],
    name: "Modular Desk Organizer",
    tagline: "Gridfinity bins for pens, cables & bits.",
    description:
      "A stackable, modular tray system that keeps your desk tidy — pens, cables, USB sticks, small parts. Mix and match bin sizes to fit your setup.",
    price: "$19",
    image: "/prints/desk-organizer.webp",
    model: "/models/shop/desk-organizer.glb",
    modelColor: "8a8a95",
    material: "PETG",
    size: "160 × 120 × 45 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/6oUcN4ckJ5Ce4ow8IR00002",
  },
  {
    id: "phone-tablet-stand",
    tags: ["Desk & Office"],
    name: "Minimalist Phone Stand",
    tagline: "Desk, nightstand, kitchen counter.",
    description:
      "A clean, low-profile stand that props up your phone at a comfortable viewing angle — simple, sturdy, and out of the way. Pick your color to match the desk.",
    price: "$14",
    image: "/prints/phone-tablet-stand.webp",
    model: "/models/shop/phone-tablet-stand.glb",
    modelColor: "3a3a42",
    material: "PETG",
    size: "110 × 90 × 80 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/4gMfZg70p3u68EMf7f00003",
  },
  {
    id: "headphone-stand",
    tags: ["Desk & Office"],
    name: "Headphone Stand",
    tagline: "Clears the desk, shows off the cans.",
    description:
      "A clean, weighted headphone stand that keeps your headset off the desk and cable-tidy. A crisp accent piece for any battlestation.",
    price: "$24",
    image: "/prints/headphone-stand.webp",
    model: "/models/shop/headphone-stand.glb",
    modelColor: "33333a",
    material: "PLA Matte",
    size: "130 × 110 × 280 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/aFa3cu98xd4G9IQ4sB00004",
  },
  {
    id: "geometric-planter",
    tags: ["Home & Decor"],
    name: "Square Planter",
    tagline: "Clean tapered pot for succulents & herbs.",
    description:
      "A crisp square planter with drainage for succulents, herbs, and small plants. Simple modern lines; pick your color to match the room.",
    price: "$18",
    image: "/prints/geometric-planter.webp",
    model: "/models/shop/geometric-planter.glb",
    modelColor: "9caf88",
    material: "PLA",
    size: "115 × 115 × 100 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/fZu28qbgF4yag7e8IR00005",
  },
  {
    id: "dice-tower",
    tags: ["Tabletop & Games"],
    name: "Dice Tower",
    tagline: "Fair rolls, no table-launched d20s.",
    description:
      "A spiral dice tower for board-game and TTRPG night — internal zig-zag ramps tumble dice for a genuinely fair roll into the catch tray. Custom colors welcome.",
    price: "$26",
    image: "/prints/dice-tower.webp",
    model: "/models/shop/dice-tower.glb",
    modelColor: "7c3aed",
    material: "PLA Matte",
    size: "80 × 80 × 150 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/cNi9AS5Wl6GiaMUf7f00006",
  },
  {
    id: "custom-nameplate",
    tags: ["Desk & Office", "Personalized"],
    name: "Custom Desk Nameplate",
    tagline: "Your name (or handle) in 3D.",
    description:
      "A two-tone desk nameplate printed with your name, title, or gamertag — pick your colors and font. A sharp little gift or personal touch.",
    price: "$18",
    image: "/prints/custom-nameplate.webp",
    material: "Silk PLA",
    size: "180 × 45 × 40 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/eVq28qdoNc0Cg7e0cl00007",
    badge: "Personalized",
  },
];
