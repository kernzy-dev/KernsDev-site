import Reveal from "./motion/Reveal";
import Weighted from "./motion/Weighted";

type Product = {
  name: string;
  oneLiner: string;
  description: string;
  href: string;
  status: "Live" | "In beta" | "Coming soon";
  badge?: string;
  image?: string;
};

const products: Product[] = [
  {
    name: "Fleetcast",
    oneLiner: "Manage every Android TV in your house from one dashboard.",
    description:
      "Discover, mirror, and remote-control Fire TV / Google TV / Shield sticks on your LAN. Sideload from your PC, schedule reboots, kill ad bloat, snapshot setups, and roll new sticks in 30 seconds with templates. Free for 1 TV, Pro unlocks the fleet.",
    href: "/fleetcast",
    status: "Live",
    badge: "First product",
    image: "/fleetcast-dashboard.png",
  },
];

const statusStyle = (s: Product["status"]) => {
  switch (s) {
    case "Live":
      return "bg-green-500/15 text-green-300 border-green-500/30";
    case "In beta":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-neutral-700/30 text-neutral-400 border-neutral-700";
  }
};

export default function Products() {
  return (
    <section id="products" className="py-20 md:py-28 border-t border-neutral-900">
      <div className="container-tight">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="section-eyebrow mb-2">Products</p>
              <h2 className="text-3xl md:text-4xl font-bold">Apps you can use today.</h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              Things I've built for myself that turned out to be useful enough to share. Free tiers,
              no signup walls on the trial.
            </p>
          </div>
        </Reveal>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{ perspective: "1500px" }}
        >
          {products.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <Weighted tilt={4} lift={14} className="h-full">
                <article className="group relative bg-gradient-to-br from-neutral-900/60 to-neutral-900/20 border border-neutral-800 hover:border-accent/40 rounded-2xl overflow-hidden transition-colors h-full">
                  {/* Hero image — 3D floating effect */}
                  {p.image && (
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-900/80 z-10" />
                      <img
                        src={p.image}
                        alt={`${p.name} screenshot`}
                        loading="lazy"
                        decoding="async"
                        width="1280"
                        height="900"
                        className="absolute inset-x-4 top-6 w-[calc(100%-2rem)] h-auto rounded-md shadow-2xl shadow-black/60 ring-1 ring-neutral-700/50 transition-transform duration-700 group-hover:scale-[1.04]"
                        style={{ transform: "translateZ(40px)", aspectRatio: "1280/900" }}
                      />
                    </div>
                  )}

                  <div className="p-7 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-display font-bold">{p.name}</h3>
                        {p.badge && (
                          <p className="text-xs text-neutral-500 mt-1">{p.badge}</p>
                        )}
                      </div>
                      <span className={`text-[11px] uppercase tracking-wider border px-2 py-1 rounded ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-lg text-neutral-200 font-medium mb-3">{p.oneLiner}</p>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-6">{p.description}</p>
                    <a href={p.href} className="btn-primary text-sm">
                      Try it →
                    </a>
                  </div>
                </article>
              </Weighted>
            </Reveal>
          ))}

          {/* "More coming" placeholder */}
          <Reveal delay={0.2}>
            <div className="bg-neutral-900/20 border border-dashed border-neutral-800 rounded-2xl p-8 flex flex-col justify-center items-center text-center min-h-[460px] h-full">
              <div className="text-5xl mb-3 grayscale opacity-70">⌛</div>
              <h3 className="text-lg font-display font-semibold text-neutral-300">More on the way</h3>
              <p className="text-sm text-neutral-500 mt-2 max-w-xs">
                Next up: a Telegram-driven scheduling agent and a small-business booking tool.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
