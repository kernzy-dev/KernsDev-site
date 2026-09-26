import { useEffect, useState } from "react";
import Magnetic from "./motion/Magnetic";
import { LogoMark } from "./Logo";

const LINKS = [
  { href: "#running", label: "Running" },
  { href: "#work", label: "Work" },
  { href: "#products", label: "Products" },
  { href: "/3dprintshop", label: "Prints" },
  { href: "#services", label: "Services" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        solid
          ? "bg-neutral-950/90 backdrop-blur border-b border-neutral-800"
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
        <a
          href="#top"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 text-lg"
        >
          <LogoMark />
          <span className="font-mono font-semibold tracking-tight">
            kerns<span className="text-accent">dev</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
          {LINKS.map((l) => (
            <Magnetic key={l.href} radius={48} strength={0.4}>
              <a href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            </Magnetic>
          ))}
          <Magnetic radius={70} strength={0.3}>
            <a
              href="#contact"
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md font-medium transition-colors inline-block"
            >
              Book a call
            </a>
          </Magnetic>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden grid place-items-center h-10 w-10 -mr-2 text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="md:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
          <div className="container-tight py-3 flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-neutral-200 hover:text-accent border-b border-neutral-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-4 mb-1 bg-accent hover:bg-accent-dark text-white text-center px-4 py-3 rounded-md font-medium transition-colors"
            >
              Book a call
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
