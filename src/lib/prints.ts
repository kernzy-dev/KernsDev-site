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
    name: "Articulated Dragon",
    tagline: "Print-in-place, fully poseable.",
    description:
      "A flexible, fully articulated dragon that coils and poses — printed in one piece, no glue. Pick a single color or a multicolor gradient.",
    price: "$28",
    image: "/prints/articulated-dragon.jpg",
    material: "PLA Matte",
    size: "230 × 90 × 40 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Bestseller",
  },
  {
    id: "articulated-axolotl",
    name: "Articulated Axolotl",
    tagline: "Squishy, wiggly desk buddy.",
    description:
      "A print-in-place axolotl with a satisfying wiggle — the internet's favorite fidget. Great in silk pastels or a two-tone body.",
    price: "$16",
    image: "/prints/articulated-axolotl.jpg",
    material: "Silk PLA",
    size: "150 × 70 × 25 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Fan favorite",
  },
  {
    id: "desk-organizer",
    name: "Modular Desk Organizer",
    tagline: "Gridfinity bins for pens, cables & bits.",
    description:
      "A stackable, modular tray system that keeps your desk tidy — pens, cables, USB sticks, small parts. Mix and match bin sizes to fit your setup.",
    price: "$19",
    image: "/prints/desk-organizer.jpg",
    material: "PETG",
    size: "160 × 120 × 45 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "phone-tablet-stand",
    name: "Adjustable Phone & Tablet Stand",
    tagline: "Desk, nightstand, kitchen counter.",
    description:
      "A sturdy multi-angle stand that holds anything from a phone to a tablet, with a cable pass-through so you can charge while it's docked.",
    price: "$14",
    image: "/prints/phone-tablet-stand.jpg",
    material: "PETG",
    size: "110 × 90 × 80 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "headphone-stand",
    name: "Headphone Stand",
    tagline: "Clears the desk, shows off the cans.",
    description:
      "A clean, weighted headphone stand that keeps your headset off the desk and cable-tidy. A crisp accent piece for any battlestation.",
    price: "$24",
    image: "/prints/headphone-stand.jpg",
    material: "PLA Matte",
    size: "130 × 110 × 280 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "geometric-planter",
    name: "Geometric Planter + Tray",
    tagline: "Faceted low-poly pot with drip tray.",
    description:
      "A crisp faceted planter with a matching drip tray for succulents and small plants. Watertight-lined; pick your color to match the room.",
    price: "$22",
    image: "/prints/geometric-planter.jpg",
    material: "PLA",
    size: "110 × 110 × 100 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "dice-tower",
    name: "Dice Tower",
    tagline: "Fair rolls, no table-launched d20s.",
    description:
      "A collapsible dice tower for board-game and TTRPG night — tumbles dice for a fair roll and packs flat when you're done. Custom colors welcome.",
    price: "$26",
    image: "/prints/dice-tower.jpg",
    material: "PLA Matte",
    size: "90 × 90 × 200 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "custom-nameplate",
    name: "Custom Desk Nameplate",
    tagline: "Your name (or handle) in 3D.",
    description:
      "A two-tone desk nameplate printed with your name, title, or gamertag — pick your colors and font. A sharp little gift or personal touch.",
    price: "$18",
    image: "/prints/custom-nameplate.jpg",
    material: "Silk PLA",
    size: "180 × 45 × 40 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Personalized",
  },
];
