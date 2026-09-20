import { lazy, Suspense, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import BootSequence from "./components/BootSequence";
import BuildingShowcase from "./components/BuildingShowcase";
import StatusBlock from "./components/StatusBlock";
import CursorTrail from "./components/motion/CursorTrail";

// Below-fold sections are lazy-loaded — they don't ship in the initial bundle.
// The browser fetches them as the user scrolls, parallelizing with whatever the
// rest of the site is doing. Each falls back to a thin spacer of the right
// height so layout doesn't shift.
const About = lazy(() => import("./components/About"));
const FeaturedWork = lazy(() => import("./components/FeaturedWork"));
const Products = lazy(() => import("./components/Products"));
const Services = lazy(() => import("./components/Services"));
const Contact = lazy(() => import("./components/Contact"));
const Footer = lazy(() => import("./components/Footer"));
// /world prototype — explorable 3D dev-plaza. Gated behind a route so it
// ships as its own chunk and doesn't touch the main landing page.
const WorldExperience = lazy(() => import("./components/world/WorldExperience"));
// /shop — 3D-print storefront (Stripe Payment Links). Own chunk / route.
const Shop = lazy(() => import("./components/Shop"));
// /services — dedicated services page (agency-style, AI-specialist brand).
const ServicesPage = lazy(() => import("./components/ServicesPage"));
// /3dtap — NFC-tap landing page for the 3D prints (phones tapping physical tags).
const ThreeDTap = lazy(() => import("./components/ThreeDTap"));

const SECTION_PLACEHOLDER = (
  <div className="py-20 md:py-28 min-h-[640px]" aria-hidden />
);

const WORLD_FALLBACK = <div className="fixed inset-0 bg-neutral-950" />;

export default function App() {
  // Stable across the component's lifetime — no router, so pathname doesn't
  // change without a full reload. Captured once via useState initializer.
  const [route] = useState(
    () => (typeof window !== "undefined" ? window.location.pathname : "/"),
  );
  const [booted, setBooted] = useState(false);

  if (route === "/world") {
    return (
      <Suspense fallback={WORLD_FALLBACK}>
        <WorldExperience />
      </Suspense>
    );
  }

  if (route === "/shop") {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-neutral-950" />}>
        <Shop />
      </Suspense>
    );
  }

  if (route === "/services") {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-neutral-950" />}>
        <ServicesPage />
      </Suspense>
    );
  }

  if (route === "/3dtap") {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-neutral-950" />}>
        <ThreeDTap />
      </Suspense>
    );
  }

  return (
    <>
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <Nav />
      <main>
        <Hero />
        <BuildingShowcase />
        <StatusBlock />
        <Suspense fallback={SECTION_PLACEHOLDER}>
          <About />
          <FeaturedWork />
          <Products />
          <Services />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <CursorTrail />
    </>
  );
}
