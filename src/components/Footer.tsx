export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-900 py-10">
      <div className="container-tight flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="bg-accent text-white w-6 h-6 rounded grid place-items-center text-xs font-bold">K</span>
          <span>© {year} KernsDev · Grant Kerns</span>
        </div>
        <div className="flex gap-6">
          <a href="#work" className="hover:text-neutral-300">Work</a>
          <a href="#products" className="hover:text-neutral-300">Products</a>
          <a href="#services" className="hover:text-neutral-300">Services</a>
          <a href="#contact" className="hover:text-neutral-300">Contact</a>
        </div>
      </div>
    </footer>
  );
}
