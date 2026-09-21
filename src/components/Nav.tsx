import { useEffect, useState } from "react";
import Magnetic from "./motion/Magnetic";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled
          ? "bg-neutral-950/80 backdrop-blur border-b border-neutral-800"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <a
        href="#products"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-accent focus:text-white focus:px-3 focus:py-2 focus:rounded focus:font-medium"
      >
        Skip to products
      </a>
      <div className="container-tight flex items-center justify-between h-16">
        <a href="#top" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="bg-accent text-white w-8 h-8 rounded-md grid place-items-center">K</span>
          <span>KernsDev</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
          <Magnetic radius={48} strength={0.4}>
            <a href="#running" className="hover:text-white transition-colors">Running</a>
          </Magnetic>
          <Magnetic radius={48} strength={0.4}>
            <a href="#work" className="hover:text-white transition-colors">Work</a>
          </Magnetic>
          <Magnetic radius={48} strength={0.4}>
            <a href="#products" className="hover:text-white transition-colors">Products</a>
          </Magnetic>
          <Magnetic radius={48} strength={0.4}>
            <a href="/3dprintshop" className="hover:text-white transition-colors">Prints</a>
          </Magnetic>
          <Magnetic radius={48} strength={0.4}>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
          </Magnetic>
          <Magnetic radius={70} strength={0.3}>
            <a href="#contact" className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md font-medium transition-colors inline-block">
              Book a call
            </a>
          </Magnetic>
        </nav>
      </div>
    </header>
  );
}
