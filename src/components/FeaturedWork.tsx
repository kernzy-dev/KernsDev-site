import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";

type Project = {
  title: string;
  blurb: string;
  tags: string[];
  href?: string;
  status?: string;
  accent: string;  // gradient stripe color
  ai?: boolean;     // badge as an AI system (AI-specialist portfolio)
};

const projects: Project[] = [
  {
    title: "FactVault",
    blurb:
      "An autonomous AI content studio: LLMs write each script, AI models generate the imagery and voice, and it edits, captions, and cross-posts to YouTube, TikTok & Facebook — unattended, every day. A feedback loop learns what actually keeps viewers watching.",
    tags: ["LLM / agents", "Gemini", "AI image + video", "Python"],
    status: "Live · runs daily",
    accent: "from-violet-500/30 via-violet-500/10 to-transparent",
    ai: true,
  },
  {
    title: "x4 — AI session orchestration",
    blurb:
      "A 'middle-manager' orchestrator that runs a fleet of autonomous AI coding sessions — assigning work, driving each one's loop, and relaying everything to your phone over Telegram with guardrails and audit logs. Voice-driven too.",
    tags: ["Claude / LLM", "orchestration", "Telegram", "MCP"],
    status: "In production",
    accent: "from-cyan-500/30 via-cyan-500/10 to-transparent",
    ai: true,
  },
  {
    title: "Nexus",
    blurb:
      "A private, on-device AI assistant — voice or text — that runs your computer and smart home, answers from the web and your own documents, remembers context, and acts on a schedule. Runs a local model (no cloud); a tiered brain resolves most commands in milliseconds.",
    tags: ["Local LLM", "Ollama", "voice / STT", "RAG"],
    status: "Local · offline-capable",
    accent: "from-emerald-500/30 via-emerald-500/10 to-transparent",
    ai: true,
  },
  {
    title: "Fleetcast",
    blurb:
      "Local fleet manager for Android TVs (Fire TV, Google TV, Shield…). Sideload, mirror, snapshot, schedule — all from one dashboard. SaaS-ready.",
    tags: ["Python", "FastAPI", "HTMX", "Tailwind"],
    href: "/fleetcast",
    status: "Live",
    accent: "from-purple-500/30 via-purple-500/10 to-transparent",
  },
];

export default function FeaturedWork() {
  return (
    <section id="work" className="py-20 md:py-28 border-t border-neutral-900 relative">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="section-eyebrow mb-2">Selected work</p>
              <h2 className="text-3xl md:text-4xl font-bold">Built, shipped, in use.</h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              Real AI systems in production — agents, automation, and on-device assistants
              solving specific problems, not demos.
            </p>
          </div>
        </Reveal>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          style={{ perspective: "1200px" }}
        >
          {projects.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <Weighted tilt={5} lift={10} className="h-full">
                <article
                  className={`group relative bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 rounded-xl p-6 transition-colors h-full overflow-hidden`}
                >
                  {/* Accent gradient stripe top-right */}
                  <div className={`absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-bl ${p.accent} blur-2xl pointer-events-none`} />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-display font-semibold">{p.title}</h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {p.ai && (
                          <span className="text-[10px] uppercase tracking-wider bg-accent/15 text-accent border border-accent/40 px-2 py-0.5 rounded">
                            AI
                          </span>
                        )}
                        {p.status && (
                          <span className="text-[10px] uppercase tracking-wider bg-neutral-800/60 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded whitespace-nowrap">
                            {p.status}
                          </span>
                        )}
                      </div>
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
                  </div>
                </article>
              </Weighted>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
