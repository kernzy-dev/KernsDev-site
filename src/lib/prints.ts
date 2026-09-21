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
  /** Stripe Payment Link URL (https://buy.stripe.com/...). Empty = shows "Coming soon". */
  stripeLink: string;
  badge?: string;
  soldOut?: boolean;
};

// Starter lineup — all NON-BRANDED / commercially-sellable subjects (no fan-art
// IP). Leave stripeLink "" until the Payment Link exists; the card then shows a
// disabled "Coming soon" so nothing broken ships. Add photos to /public/prints/.
export const PRINTS: Print[] = [
  {
    id: "articulated-dragon",
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
