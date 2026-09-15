// Shared services catalog — used by both the landing-page Services section
// (Services.tsx) and the dedicated /services page (ServicesPage.tsx).

export type Service = {
  name: string;
  desc: string;
  startingAt?: string;
  icon: string;
  tag?: "AI"; // AI-forward offerings get an accent badge (brand: AI specialist)
  /** Longer detail shown on the dedicated /services page. */
  detail?: string;
};

// AI-led first (the positioning), then the broader build capability. Honest to
// what Grant actually ships — no inflated agency stats.
export const SERVICES: Service[] = [
  {
    name: "AI Development",
    desc:
      "Custom AI systems end-to-end: LLM & multi-agent apps, RAG over your data, classification, and content pipelines. The kind of thing behind FactVault and the x4 orchestrator.",
    detail:
      "From a single prompt-chained tool to a full multi-agent system with its own memory, guardrails, and orchestration. I build the retrieval, the evaluation harness, the fallbacks, and the ops around it — so it keeps working unattended, not just in a demo.",
    startingAt: "from $1,500",
    icon: "✦",
    tag: "AI",
  },
  {
    name: "AI Integration",
    desc:
      "Drop Claude / Gemini / OpenAI / open-source models into the tools you already use — chat, generation, summarization, extraction — wired to your real workflow.",
    detail:
      "Model-agnostic by design: I route across providers (and local models) with graceful fallback so you're never locked in or knocked offline by one vendor's quota. Streaming, tool-use, and cost controls included.",
    startingAt: "from $1,200",
    icon: "◇",
    tag: "AI",
  },
  {
    name: "AI Strategy & Consulting",
    desc:
      "Where AI actually moves the needle for your business — what to build, what to buy, what to skip. Clear roadmap, no hype, no wasted spend.",
    detail:
      "A short, honest engagement: I look at your workflows, find the few places AI pays for itself, and hand you a prioritized plan with rough costs. You leave knowing what's worth doing — whether or not you hire me to build it.",
    startingAt: "consult",
    icon: "◎",
    tag: "AI",
  },
  {
    name: "Automation Systems",
    desc:
      "Scheduled pipelines, scraping, cross-posting, and data sync between services that don't natively talk — the boring work, done once and forever.",
    detail:
      "If you're copy-pasting between tools or running the same task by hand every week, it can almost certainly be automated — with logging, retries, and alerts so you trust it to run without you watching.",
    startingAt: "from $800",
    icon: "⚙",
  },
  {
    name: "Bots & Agents",
    desc:
      "Telegram / Discord / Slack bots that drive real work — long-running jobs, approvals, notifications, and multi-step agent flows, not toy chat replies.",
    detail:
      "I run my own fleet this way (x4 / TelegramPipes): bots that kick off jobs, ask for approvals, and report back. Same pattern, pointed at your operations.",
    startingAt: "from $600",
    icon: "◈",
    tag: "AI",
  },
  {
    name: "Custom Web Apps",
    desc:
      "React, TypeScript, Tailwind on the front; Python / FastAPI on the back. Built around YOUR workflow, not a template's.",
    detail:
      "Fast, typed, and maintainable. Deployed on infra that costs near-zero to run, with a codebase you (or the next dev) can actually read.",
    startingAt: "from $1,500",
    icon: "⚛",
  },
  {
    name: "Internal Dashboards",
    desc:
      "Wire your spreadsheets / APIs / database into a real UI your team will actually use — Streamlit, Next.js, or whatever fits.",
    detail:
      "Turn the spreadsheet everyone's afraid to touch into a proper tool with roles, validation, and views your team trusts.",
    startingAt: "from $1,000",
    icon: "▤",
  },
  {
    name: "API Development",
    desc:
      "Design, build, integrate, and secure APIs — clean contracts, auth, rate-limits, and docs that make the next dev's life easy.",
    detail:
      "Whether you're exposing your own API or wrangling someone else's, I handle auth, versioning, rate-limits, and docs — the parts that bite later if they're skipped.",
    startingAt: "from $900",
    icon: "⇄",
  },
  {
    name: "Data Pipelines",
    desc:
      "Ingest, transform, and sync your data so it's usable and automated — no more manual exports and copy-paste between tools.",
    detail:
      "Get your data flowing on a schedule, cleaned and shaped for whatever's downstream — reporting, an app, or an AI model.",
    startingAt: "from $1,000",
    icon: "⛓",
  },
  {
    name: "MVP Development",
    desc:
      "Validate an idea fast with a real, scalable product — not a throwaway prototype you'll have to rebuild the week it gets traction.",
    detail:
      "Built to ship AND to survive traction: a focused v1 that proves the idea without painting you into a corner you have to tear down later.",
    startingAt: "from $2,000",
    icon: "🚀",
  },
  {
    name: "Small Business Websites",
    desc:
      "Fast, mobile-first, SEO-clean, hosted on Cloudflare for $0/month. A real human writes the copy with you, not an AI template.",
    detail:
      "A site that loads instantly, ranks clean, and costs nothing to host — with copy we write together so it actually sounds like you.",
    startingAt: "from $250",
    icon: "◉",
  },
];
