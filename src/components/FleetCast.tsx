import Reveal from "./motion/Reveal";

/**
 * /fleetcast — product landing for FleetCast, the Android-TV fleet manager.
 *
 * The app isn't a public SaaS yet, so this page is honest about that ("in
 * development") and captures interest via the site contact form instead of
 * dead-ending. Replaces the old /fleetcast link that just reloaded the home page.
 */

const FEATURES = [
  {
    title: "Sideload in seconds",
    body: "Push any APK to any TV on your LAN from your PC — no developer-mode dance, no cables. Roll a new stick in 30 seconds with templates.",
    icon: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  },
  {
    title: "Mirror & remote control",
    body: "See and drive any TV's screen from your desktop. Launch apps, type with a real keyboard, fix a stuck living-room stick from the couch.",
    icon: "M3 5h18v11H3zM8 21h8M12 16v5",
  },
  {
    title: "Snapshots & rollback",
    body: "Capture a TV's full setup before an update, restore it if something breaks. Your configs, launchers, and installs — versioned.",
    icon: "M4 7h16v10H4zM8 3h8v4H8z",
  },
  {
    title: "Schedule & automate",
    body: "Reboot on a timer, disable ad-bloat, mirror one TV's launcher across the fleet, and keep every device checked-in and healthy.",
    icon: "M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z",
  },
];

export default function FleetCast() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Slim top bar */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="container-tight flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="bg-accent text-white w-8 h-8 rounded-md grid place-items-center">K</span>
            <span>KernsDev</span>
          </a>
          <a href="/" className="text-sm text-neutral-300 hover:text-white transition-colors">
            ← Back to site
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container-tight py-16 md:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-accent border border-accent/40 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              In development
            </span>
            <h1 className="text-4xl md:text-6xl font-bold font-display max-w-3xl leading-[1.05]">
              One dashboard for every TV on your network.
            </h1>
            <p className="text-lg text-neutral-400 mt-5 max-w-2xl">
              <span className="text-neutral-200 font-semibold">FleetCast</span> is a local fleet
              manager for Android TVs — Fire TV, Google TV, Shield. Sideload, mirror, snapshot,
              and schedule every device from one place. Built for my own living-room fleet;
              opening it up to yours.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="/#contact" className="btn-primary">
                Get early access →
              </a>
              <a href="/" className="btn-ghost">
                See other work
              </a>
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              No public release yet — join the early-access list and I'll reach out when the first
              build is ready to try.
            </p>
          </Reveal>
        </section>

        {/* Features */}
        <section className="container-tight pb-16 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 p-6 hover:border-accent/40 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-accent/15 text-accent grid place-items-center mb-4">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-display font-bold">{f.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mt-2">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pricing tease */}
        <section className="container-tight pb-20 md:pb-28">
          <Reveal>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-10">
              <p className="section-eyebrow mb-2">Planned pricing</p>
              <h2 className="text-2xl md:text-3xl font-bold">Free for one TV. Pro unlocks the fleet.</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                <div className="rounded-xl border border-neutral-800 p-6">
                  <p className="font-display font-bold text-lg">Free</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    One device. Sideload, mirror, and control — the core toolkit, no cost.
                  </p>
                </div>
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-6">
                  <p className="font-display font-bold text-lg">
                    Pro <span className="text-accent text-sm font-normal">· coming soon</span>
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Unlimited devices, snapshots, scheduling, templates, and fleet-wide automation.
                  </p>
                </div>
              </div>
              <a href="/#contact" className="btn-primary mt-8 inline-block">
                Join the early-access list →
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-neutral-900 py-10">
        <div className="container-tight text-sm text-neutral-500 flex flex-wrap items-center justify-between gap-3">
          <span>© KernsDev — FleetCast is in active development.</span>
          <a href="/" className="hover:text-neutral-300 transition-colors">kernsdev.com</a>
        </div>
      </footer>
    </div>
  );
}
