type Project = {
  title: string;
  blurb: string;
  tags: string[];
  href?: string;
  status?: string;
};

const projects: Project[] = [
  {
    title: "Fleetcast",
    blurb:
      "Local fleet manager for Android TVs (Fire TV, Google TV, Shield…). Sideload, mirror, snapshot, schedule — all from one dashboard. SaaS-ready.",
    tags: ["Python", "FastAPI", "HTMX", "Tailwind"],
    href: "/fleetcast",
    status: "Live",
  },
  {
    title: "FactVault",
    blurb:
      "End-to-end YouTube Shorts pipeline: AI-generated facts → voiceover → captioned video → upload + cross-post to TikTok and Facebook. Runs unattended daily.",
    tags: ["Python", "Gemini", "ffmpeg", "Playwright"],
    status: "Live · automated daily",
  },
  {
    title: "Telegram-driven remote ops",
    blurb:
      "A control channel that lets you drive long-running tasks (deploys, video pipelines, app fleets) from your phone over Telegram, with permission gates and audit logs.",
    tags: ["Python", "Telegram Bot API", "MCP"],
    status: "In production",
  },
];

export default function FeaturedWork() {
  return (
    <section id="work" className="py-20 md:py-28 border-t border-neutral-900">
      <div className="container-tight">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="section-eyebrow mb-2">Selected work</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built, shipped, in use.</h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-md">
            Real projects in production — each one was a specific problem that off-the-shelf software
            couldn't solve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.map((p) => (
            <article
              key={p.title}
              className="group relative bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 rounded-xl p-6 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-display font-semibold">{p.title}</h3>
                {p.status && (
                  <span className="text-[10px] uppercase tracking-wider bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded">
                    {p.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">{p.blurb}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tags.map((t) => (
                  <span key={t} className="text-[11px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
              {p.href && (
                <a
                  href={p.href}
                  className="text-sm font-medium text-accent hover:text-accent-light inline-flex items-center gap-1"
                >
                  Open →
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
