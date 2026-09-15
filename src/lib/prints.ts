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

// Example listings — edit freely. Leave stripeLink "" until the Payment Link
// exists; the card then shows a disabled "Coming soon" so nothing broken ships.
export const PRINTS: Print[] = [
  {
    id: "articulated-dragon",
    name: "Articulated Dragon",
    tagline: "Print-in-place, fully poseable.",
    description:
      "A flexible, fully articulated dragon that coils and poses — printed in one piece, no glue. Available in a range of colors and multicolor gradients.",
    price: "$28",
    image: "/prints/articulated-dragon.jpg",
    material: "PLA Matte",
    size: "230 × 90 × 40 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
    badge: "Bestseller",
  },
  {
    id: "desk-organizer",
    name: "Modular Desk Organizer",
    tagline: "Gridfinity bins for pens, cables & bits.",
    description:
      "A stackable, modular tray system that keeps your desk tidy — pens, cables, USB sticks, small parts. Mix and match bin sizes.",
    price: "$18",
    image: "/prints/desk-organizer.jpg",
    material: "PETG",
    size: "160 × 120 × 45 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
  {
    id: "geometric-planter",
    name: "Geometric Planter",
    tagline: "Faceted low-poly pot with drip tray.",
    description:
      "A crisp faceted planter with a matching drip tray for succulents and small plants. Watertight-lined; pick your color.",
    price: "$22",
    image: "/prints/geometric-planter.jpg",
    material: "PLA",
    size: "110 × 110 × 100 mm",
    leadTime: "Made to order · ships in 3–5 days",
    stripeLink: "",
  },
];
