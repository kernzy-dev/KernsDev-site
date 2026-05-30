type Service = {
  name: string;
  desc: string;
  startingAt?: string;
};

const services: Service[] = [
  {
    name: "Custom web apps",
    desc:
      "React, TypeScript, Tailwind on the front; Python/FastAPI on the back. Built around YOUR workflow, not a template's.",
    startingAt: "from $1,500",
  },
  {
    name: "Automation systems",
    desc:
      "Scheduled scripts, scraping pipelines, social cross-posting, data sync between services that don't talk to each other natively.",
    startingAt: "from $800",
  },
  {
    name: "AI integrations",
    desc:
      "Bring Gemini / Claude / OpenAI / open-source models into your existing tools — chat interfaces, content generation, classification, summarization.",
    startingAt: "from $1,200",
  },
  {
    name: "Small business websites",
    desc:
      "Fast, mobile-first, SEO-clean. Hosted on Cloudflare for $0/month. Real human writes the copy with you, not an AI template.",
    startingAt: "from $250",
  },
  {
    name: "Internal dashboards",
    desc:
      "Streamlit, Next.js, or whatever fits — wire your spreadsheets / APIs / database into a real UI your team will actually use.",
    startingAt: "from $1,000",
  },
  {
    name: "Bot + agent integrations",
    desc:
      "Telegram / Discord / Slack bots that drive real work — long-running jobs, approvals, notifications, multi-step flows.",
    startingAt: "from $600",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 md:py-28 border-t border-neutral-900">
      <div className="container-tight">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="section-eyebrow mb-2">Services</p>
            <h2 className="text-3xl md:text-4xl font-bold">Hire me for the build.</h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-md">
            Most projects scope in 1-3 phone calls. Real pricing on the first call —
            no "starting at $XXX, actual cost $10× later" games.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div
              key={s.name}
              className="bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="font-display font-semibold text-lg">{s.name}</h3>
                {s.startingAt && (
                  <span className="text-xs text-neutral-500 whitespace-nowrap">{s.startingAt}</span>
                )}
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="#contact" className="btn-primary">
            Discuss a project →
          </a>
        </div>
      </div>
    </section>
  );
}
