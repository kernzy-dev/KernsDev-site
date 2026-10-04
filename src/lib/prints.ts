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
  "Christmas",
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
    tagline: "3D printed chibi cat peeking from a carved pumpkin.",
    description:
      "A chibi kitty tucked into a carved jack-o'-lantern — a cute piece of 3D printed Halloween decor for a desk, shelf, or tiered tray, and a fun seasonal gift. Handmade to order in PLA; pick your custom colors.",
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
    tagline: "Minimalist ridged 3D printed pumpkin — neutral fall decor.",
    description:
      "A clean, ridged decorative pumpkin in a minimalist neutral style — 3D printed modern-farmhouse fall and Halloween decor for a mantel, shelf, or tiered tray. Handmade to order in PLA; pick your size and color. Large fills the full print bed for a real statement piece.",
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
      "A chibi dachshund decked out for Halloween — striped witch hat, ghost costume, and a tiny trick-or-treat pumpkin. A cute piece of 3D printed Halloween desk decor or shelf sitter, and a fun gift for dog lovers; printed in full color. Handmade to order in PLA; pick your size.",
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
      "A spooky-cute little 3D printed ghost all bundled up for fall — pom-pom beanie, a pumpkin-spice latte in one hand and a tiny carved jack-o'-lantern in the other. About an inch tall; the perfect Halloween desk decor, shelf companion, party favor, or stocking stuffer. Build a whole gang: pick how many you want, and every 5 you add knocks the price down. Handmade to order in PLA; pick your color.",
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
    id: "halloween-mummy-pumpkin",
    tags: ["Halloween", "Home & Decor"],
    name: "Cozy Mummy & Pumpkin",
    tagline: "Smiley bandaged mummy hugging a jack-o'-lantern.",
    description:
      "A cuddly little 3D printed mummy all wrapped up and hugging a carved jack-o'-lantern — spooky-cute Halloween desk decor for a shelf, tiered tray, or party table, and a fun seasonal gift or trick-or-treat favor. Made to order in PLA; pick your colors.",
    price: "$10",
    image: "/prints/halloween-mummy-pumpkin.webp",
    material: "PLA",
    size: "~70 × 60 × 55 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Halloween",
  },
  {
    id: "halloween-ghost-pumpkin",
    tags: ["Halloween", "Home & Decor"],
    name: "Peekaboo Ghost Pumpkin",
    tagline: "Happy little ghost popping out of a carved pumpkin.",
    description:
      "A cheerful little 3D printed ghost peeking out of a carved jack-o'-lantern — a spooky-cute piece of Halloween desk decor for a shelf, tiered tray, or party table, and a fun trick-or-treat gift. Made to order in PLA; pick your colors.",
    price: "$10",
    image: "/prints/halloween-ghost-pumpkin.webp",
    material: "PLA",
    size: "~55 × 50 × 55 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Halloween",
  },
  {
    id: "halloween-ghost-bundle",
    tags: ["Halloween", "Home & Decor"],
    name: "Cute Ghost Bundle",
    tagline: "A cozy set of our bestselling smiley white ghosts.",
    description:
      "A whole cozy family of 3D printed ghosts — smooth glossy white bodies, happy smiling faces, and rosy little cheeks. Our bestselling spooky-cute design, now bundled as a set so you can line the gang up across a desk, shelf, tiered tray, or Halloween party table. A charming piece of autumn decor and a fun gift, party favor, or set of stocking stuffers. Handmade to order in PLA; pick your color.",
    price: "$16",
    image: "/prints/halloween-ghost-bundle.webp",
    material: "PLA",
    size: "~45 × 40 × 55 mm each (set)",
    leadTime: "Made to order — ships in 3–5 days",
    stripeLink: "",
    badge: "Halloween",
  },
  {
    id: "christmas-gnome-tealight",
    tags: ["Christmas", "Home & Decor"],
    name: "Nordic Gnome Tealight",
    tagline: "Carved gnome lantern that glows from within.",
    description:
      "A cozy Scandinavian gnome with an intricately carved, curling hat — drop in a flameless tealight and warm light spills through the filigree body. A charming 3D printed mantel, shelf, or windowsill piece of Christmas and holiday decor. Handmade to order in PLA; pick your color.",
    price: "$24",
    image: "/prints/christmas-gnome-tealight.webp",
    material: "PLA",
    size: "~110 × 75 × 75 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-reindeer-candle",
    tags: ["Christmas", "Home & Decor"],
    name: "Reindeer Candle Holder",
    tagline: "Red-nosed reindeer cradling a jar candle.",
    description:
      "A cheerful red-nosed reindeer holding a tray on its antlers, sized for a standard jar candle (candle not included). A sweet, sturdy 3D printed centerpiece for the holiday table, mantel, or entryway — and a cozy Christmas gift. Handmade to order in PLA; pick your color.",
    price: "$25",
    image: "/prints/christmas-reindeer-candle.webp",
    material: "PLA",
    size: "~150 × 120 × 110 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-mega-reindeer",
    tags: ["Christmas", "Home & Decor"],
    name: "Standing Stag",
    tagline: "Elegant full-antler stag statement piece.",
    description:
      "A graceful standing stag with full sweeping antlers — a clean, modern-farmhouse 3D printed statement piece for a mantel or console. Prints large and reads beautifully in matte white or any single color — elegant Christmas and winter decor. Handmade to order in PLA; pick your size and color.",
    price: "$28",
    image: "/prints/christmas-mega-reindeer.webp",
    material: "PLA",
    size: "250 × 180 × 90 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-reindeer-trio",
    tags: ["Christmas", "Home & Decor"],
    name: "Standing Reindeer Trio",
    tagline: "Set of three minimalist shelf reindeer.",
    description:
      "A set of three slender, minimalist standing reindeer in graduated sizes — an elegant little 3D printed herd for a shelf, mantel, or holiday tablescape. Clean matte finish; looks great as a set and makes a lovely Christmas gift. Handmade to order in PLA; pick your color.",
    price: "$18",
    image: "/prints/christmas-reindeer-trio.webp",
    material: "PLA",
    size: "~120–165 mm tall (set of 3)",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-reindeer-bundle-white",
    tags: ["Christmas", "Home & Decor"],
    name: "All-White Large Reindeer Bundle",
    tagline: "Set of three minimalist all-white standing reindeer.",
    description:
      "A set of three large standing reindeer in graduated sizes, finished in clean matte all-white — elegant Scandinavian modern-farmhouse 3D printed decor. The trio makes a striking little herd for a mantel, console, entryway, or holiday tablescape, and a lovely Christmas gift that reads beautifully as a set. Handmade to order in PLA; pick your color.",
    price: "$26",
    image: "/prints/christmas-reindeer-bundle-white.webp",
    material: "PLA",
    size: "~150–210 mm tall (set of 3)",
    leadTime: "Made to order — ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-snowman",
    tags: ["Christmas", "Home & Decor"],
    name: "Cheery Snowman",
    tagline: "Top hat, scarf & carrot nose.",
    description:
      "A plump, happy little 3D printed snowman all bundled up in a scarf and top hat, with a carrot nose and coal-button smile. Cozy Christmas and winter decor for a desk, shelf, or mantel — and a sweet stocking stuffer. Handmade to order in PLA; pick your color.",
    price: "$13",
    image: "/prints/christmas-snowman.webp",
    material: "PLA",
    size: "~90 mm tall",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-tree",
    tags: ["Christmas", "Home & Decor"],
    name: "Decorated Christmas Tree",
    tagline: "Stylized tree with a gold star & baubles.",
    description:
      "A charming stylized 3D printed Christmas tree topped with a gold star, trimmed with garland and ornaments. A clean, modern little centerpiece and festive Christmas decor for a desk, shelf, or holiday tablescape — also a small gift. Handmade to order in PLA; pick your size and colors.",
    price: "$16",
    image: "/prints/christmas-tree.webp",
    material: "PLA",
    size: "~120 mm tall",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-santa",
    tags: ["Christmas", "Home & Decor"],
    name: "Jolly Santa",
    tagline: "Chibi Santa with his sack of gifts.",
    description:
      "A rosy-cheeked, chibi-style 3D printed Santa Claus with his gift sack and a wrapped present — cheerful Christmas decor and a desk buddy, shelf sitter, or stocking stuffer for the holidays. Handmade to order in PLA; pick your color.",
    price: "$14",
    image: "/prints/christmas-santa.webp",
    material: "PLA",
    size: "~85 mm tall",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "christmas-gingerbread",
    tags: ["Christmas", "Home & Decor"],
    name: "Gingerbread Man",
    tagline: "Iced gingerbread cookie ornament.",
    description:
      "A classic smiling 3D printed gingerbread man with piped-icing trim — great as a hanging Christmas ornament, gift topper, or little shelf friend. Prints flat and quick; add a loop of twine to hang. Handmade to order in PLA; pick your colors.",
    price: "$10",
    image: "/prints/christmas-gingerbread.webp",
    material: "PLA",
    size: "~80 × 65 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Christmas",
  },
  {
    id: "articulated-dragon",
    tags: ["Tabletop & Games", "Home & Decor"],
    name: "Winged Dragon",
    tagline: "Detailed 3D printed winged dragon centerpiece.",
    description:
      "A striking 3D printed winged dragon, poised with wings raised — a clean display piece and collectible for a shelf, desk, or D&D tabletop, and a great gift for fantasy fans. Printed in one solid color or finished in a metallic filament.",
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
    tagline: "Squishy, wiggly 3D printed print-in-place fidget.",
    description:
      "A fully articulated 3D printed slug with a satisfying wiggle — printed in one piece, no assembly. A goofy, tactile desk toy and fidget gift. Great in silk pastel PLA or a two-tone body.",
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
      "A stackable, modular 3D printed tray system that keeps your desk tidy — pens, cables, USB sticks, small parts. A Gridfinity-compatible desk organizer; mix and match bin sizes to fit your setup.",
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
      "A clean, low-profile 3D printed phone stand that props up your phone at a comfortable viewing angle — simple, sturdy desk, nightstand, or kitchen-counter accessory that stays out of the way. Pick your color to match the desk.",
    price: "$14",
    image: "/prints/phone-tablet-stand.webp",
    model: "/models/shop/phone-tablet-stand.glb",
    modelColor: "3a3a42",
    material: "PETG",
    size: "110 × 90 × 80 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/4gMfZg70p3u68EMf7f00003",
  },{
    id: "geometric-planter",
    tags: ["Home & Decor"],
    name: "Square Planter",
    tagline: "Clean tapered pot for succulents & herbs.",
    description:
      "A crisp square 3D printed planter with drainage for succulents, herbs, and small plants. Simple modern lines for desk, shelf, or windowsill decor; pick your color to match the room.",
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
      "A spiral 3D printed dice tower for board-game and TTRPG night — internal zig-zag ramps tumble dice for a genuinely fair roll into the catch tray. A great gift for tabletop and D&D gamers; custom colors welcome.",
    price: "$26",
    image: "/prints/dice-tower.webp",
    model: "/models/shop/dice-tower.glb",
    modelColor: "7c3aed",
    material: "PLA Matte",
    size: "80 × 80 × 150 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "https://buy.stripe.com/cNi9AS5Wl6GiaMUf7f00006",
  },];

// ---------------------------------------------------------------------------
// SEO / structured data
// ---------------------------------------------------------------------------

/** Site origin — used to build absolute URLs for structured data. */
export const SITE_ORIGIN = "https://kernsdev.com";

/** Canonical URL of the 3D-print storefront. */
export const SHOP_URL = `${SITE_ORIGIN}/3dprintshop`;

/**
 * schema.org structured data for the storefront: an `ItemList` of `Product`
 * entries (name, description, image, brand, offers) generated from `PRINTS`.
 * Injected as JSON-LD on the shop view for Google Rich Results / product
 * discoverability. Kept separate from the site's Person / ProfessionalService
 * schema in index.html so the two never conflict. Returns a plain object ready
 * for `JSON.stringify`.
 */
export function shopProductsJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "KernsDev 3D-Printed Decor, Figurines & Gifts",
    itemListElement: PRINTS.map((p, i) => {
      const inStock = Boolean(p.stripeLink) && !p.soldOut;
      const product: Record<string, unknown> = {
        "@type": "Product",
        name: p.name,
        description: p.description,
        material: p.material,
        brand: { "@type": "Brand", name: "KernsDev" },
        offers: {
          "@type": "Offer",
          price: priceValue(p).toFixed(2),
          priceCurrency: "USD",
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
          url: inStock ? p.stripeLink : SHOP_URL,
          seller: { "@type": "Organization", name: "KernsDev" },
        },
      };
      if (p.image) product.image = `${SITE_ORIGIN}${p.image}`;
      const category = (p.tags ?? [])[0];
      if (category) product.category = category;
      return { "@type": "ListItem", position: i + 1, item: product };
    }),
  };
}
