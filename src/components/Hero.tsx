export default function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Soft accent glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-accent/10 blur-3xl rounded-full" />
      </div>

      <div className="container-tight">
        <div className="text-center max-w-3xl mx-auto">
          <p className="section-eyebrow mb-4 animate-fade-up">Hi, I'm Grant.</p>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6 animate-fade-up">
            I build the software you<br className="hidden md:block" />{" "}
            <span className="text-accent">can't buy off the shelf.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto animate-fade-up">
            Custom web apps, automation, and AI integrations for businesses and individuals who need
            something specific — built fast, honest, and detail-oriented.
          </p>
          <div className="flex flex-wrap justify-center gap-3 animate-fade-up">
            <a href="#contact" className="btn-primary">
              Book a call →
            </a>
            <a href="#work" className="btn-ghost">See the work</a>
          </div>
        </div>

        {/* Trio of qualifiers */}
        <div className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { word: "Fast", desc: "Shipped, not perfect. Iterate from real use." },
            { word: "Honest", desc: "If it won't work, I tell you up front." },
            { word: "Detail-oriented", desc: "The thing visitors notice but can't name." },
          ].map((q) => (
            <div key={q.word} className="text-center md:text-left">
              <div className="text-2xl font-display font-bold text-accent">{q.word}</div>
              <div className="text-sm text-neutral-400 mt-1">{q.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
