export default function About() {
  return (
    <section className="py-20 md:py-28 border-t border-neutral-900">
      <div className="container-tight max-w-3xl">
        <p className="section-eyebrow mb-3">About</p>
        <p className="text-2xl md:text-3xl font-display leading-snug text-neutral-100">
          I make software that does the specific job nobody built a product for —
          and I make it look like it cost more than it did.
        </p>
        <p className="mt-6 text-neutral-400 leading-relaxed">
          I work directly with clients (no agency layers, no account managers) on web apps,
          internal tools, automations, and AI integrations. Most projects ship within a few
          weeks; the bigger ones get split into deliverable phases so you see value early.
        </p>
        <p className="mt-4 text-neutral-400 leading-relaxed">
          The site you're on right now? Hand-coded. The products linked below? Same. That's
          intentional — the work IS the portfolio.
        </p>
      </div>
    </section>
  );
}
