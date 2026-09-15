# 3D-print shop — setup & go-live

The `/shop` page is a storefront for **physical** 3D prints. Checkout uses
**Stripe Payment Links** — no backend, and **no Stripe key lives in this repo**
(a Payment Link is just a public `https://buy.stripe.com/...` URL). This is the
safest setup for a static Cloudflare Pages site.

## Files
- `src/lib/prints.ts` — the catalog (edit this to add/change products).
- `src/components/Shop.tsx` — the storefront page (design only; usually no edits).
- `public/prints/<id>.jpg` — product photos (add your images here).
- Route `/shop` is wired in `src/App.tsx`; a "Prints" link is in the nav.
- `public/_redirects` (`/* /index.html 200`) lets `/shop` (+ `/world`) load on Cloudflare.

## Add a print (per product)
1. **Photo:** drop a square-ish image at `public/prints/<id>.jpg`.
2. **Catalog:** add/edit an entry in `src/lib/prints.ts` (name, price, material,
   size, description, `image`). Leave `stripeLink: ""` for now — the card shows a
   disabled **"Coming soon"** until the link exists, so nothing broken ships.
3. **Stripe Payment Link:**
   - Stripe Dashboard → **Products** → add the product + a price (match the `price`).
   - **Payment Links** → **New link** → pick that product.
   - Turn ON **"Collect customers' shipping addresses"** and add your **shipping
     rates** (this is how physical fulfillment works — Stripe collects the address).
   - Optionally set inventory/quantity limits.
   - **Create**, then **Copy** the `https://buy.stripe.com/...` URL.
4. Paste that URL into the product's `stripeLink` in `prints.ts`.

## Test before going live
- Do the above in **Stripe TEST mode** first (toggle in the dashboard). Test-mode
  Payment Links start `https://buy.stripe.com/test_...`.
- `npm run dev`, open `http://localhost:5173/shop`, click **Buy**, complete Stripe's
  test checkout with card `4242 4242 4242 4242`, any future date/CVC.
- Confirm the order shows in the Stripe test dashboard.

## Go live (your call — this deploys)
- Swap the `stripeLink`s to **live-mode** Payment Links (`https://buy.stripe.com/...`).
- Commit + push to `main` → **Cloudflare Pages auto-deploys**. (Pushing/deploying
  is intentionally left to you.)

## Security (do not skip)
- **Never** put a Stripe **secret** key (`sk_live_...` / `sk_test_...`) anywhere in
  this repo, and **never** in a `VITE_` env var — `VITE_` values are bundled into
  the browser. Payment Links need only the **public** buy URL, so no key is needed here.
- Fulfillment (order emails, tracking) is handled in the Stripe dashboard.

## Later, if you outgrow Payment Links
A real cart / dynamic pricing / automated fulfillment would move checkout to a
**Cloudflare Pages Function** (`/functions/api/checkout`) with the secret key in
Cloudflare's encrypted env — never in the client. That's a bigger build; ping me.
