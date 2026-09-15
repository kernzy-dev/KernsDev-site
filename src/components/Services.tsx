import Reveal from "./motion/Reveal";
import { SERVICES as services } from "../lib/services";

export default function Services() {
  return (
    <section id="services" className="py-20 md:py-28 border-t border-neutral-900">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="section-eyebrow mb-2">Services</p>
              <h2 className="text-3xl md:text-4xl font-bold">
                AI-first software, built end-to-end.
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              An AI specialist who also ships the whole stack — strategy, build, and the
              automation around it. Most projects scope in 1–3 calls, with real pricing on
              the first one. No "starting at $X, actual cost 10× later" games.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.05}>
              <div className="group relative bg-neutral-900/30 border border-neutral-800 hover:border-accent/40 rounded-xl p-5 transition-all hover:-translate-y-1 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl text-accent group-hover:scale-110 transition-transform origin-left">
                    {s.icon}
                  </div>
                  {s.tag && (
                    <span className="text-[10px] uppercase tracking-wider border border-accent/40 text-accent/90 bg-accent/10 px-2 py-0.5 rounded">
                      {s.tag}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="font-display font-semibold text-lg">{s.name}</h3>
                  {s.startingAt && (
                    <span className="text-xs text-neutral-500 whitespace-nowrap">{s.startingAt}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
            <a href="#contact" className="btn-primary">
              Discuss a project →
            </a>
            <a href="/services" className="text-sm text-neutral-400 hover:text-white transition-colors">
              See full services & detail →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
