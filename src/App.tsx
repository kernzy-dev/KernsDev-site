import { lazy, Suspense, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import BootSequence from "./components/BootSequence";
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

const SECTION_PLACEHOLDER = (
  <div className="py-20 md:py-28 min-h-[640px]" aria-hidden />
);

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <>
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
      <Nav />
      <main>
        <Hero />
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
