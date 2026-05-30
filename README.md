# KernsDev Site

The kernsdev.com landing — developer portfolio, products, and services for **Grant Kerns**.

## Stack

- **Vite 6** + **React 18** + **TypeScript**
- **Tailwind CSS 3**
- Hand-written components (no AI templates)
- Deploys via Cloudflare Pages (auto-build on push to `main`)

## Local dev

```powershell
npm install
npm run dev     # http://localhost:5173
```

## Build

```powershell
npm run build    # outputs to dist/
```

## Structure

```
src/
├── main.tsx          # React entry
├── App.tsx           # top-level composition
├── index.css         # Tailwind + base styles
└── components/
    ├── Nav.tsx       # sticky top nav with anchor links
    ├── Hero.tsx      # "Hi, I'm Grant. I build software."
    ├── About.tsx     # personal-founder voice paragraph
    ├── FeaturedWork.tsx  # 3 case-study cards
    ├── Products.tsx  # Fleetcast card + placeholder for future
    ├── Services.tsx  # 6 service cards with starting-at prices
    ├── Contact.tsx   # Book a call CTA + email fallback
    └── Footer.tsx
```

## Things to edit by hand (search for TODO)

- `src/components/Contact.tsx` → `BOOKING_URL` constant — wire your Cal.com / Calendly link once set up
- Email address → currently `grant.kerns14@gmail.com`; swap when branded email is live
- Add real screenshots for the Fleetcast and FactVault project cards (drop into `public/` and reference)
- `index.html` meta tags — verify OG description matches latest positioning

## Deploy

Cloudflare Pages auto-deploys on push to `main`. Production URL once domain is wired:
**https://kernsdev.com**

Until then, preview at the `*.pages.dev` URL Cloudflare assigns.
