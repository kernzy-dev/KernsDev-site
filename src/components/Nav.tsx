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
        <a href="#top" className="flex items-center gap-2.5 font-display font-bold text-lg">
          <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
            <defs>
              <linearGradient id="navk" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c084fc" />
                <stop offset="1" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="15" fill="url(#navk)" />
            <path d="M20 15 h7 v13.5 L40.5 15 H50 L34.5 31.5 L51 49 h-9.5 L27 34.5 V49 h-7 z" fill="#fff" />
            <rect x="41" y="43.5" width="7" height="5.5" rx="1" fill="#e9d5ff" />
          </svg>
          <span>Kerns<span className="text-accent-light">Dev</span></span>
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
