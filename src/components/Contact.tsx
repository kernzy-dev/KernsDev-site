// TODO: replace BOOKING_URL with your Cal.com or Calendly link once set up.
const BOOKING_URL = "mailto:grant.kerns14@gmail.com?subject=KernsDev%20—%20want%20to%20book%20a%20call";
const EMAIL = "grant.kerns14@gmail.com";

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 border-t border-neutral-900 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-accent/8 blur-3xl rounded-full" />
      </div>

      <div className="container-tight max-w-3xl text-center">
        <p className="section-eyebrow mb-3">Get in touch</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Got a problem that needs <span className="text-accent">specific software</span>?
        </h2>
        <p className="text-lg text-neutral-300 mb-10">
          Tell me about it. First call is free, 20 minutes, no pitch deck. If it's a fit we'll scope
          the build; if it isn't I'll tell you what tool already does it.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={BOOKING_URL} className="btn-primary text-base">
            Book a call →
          </a>
          <a href={`mailto:${EMAIL}`} className="btn-ghost text-base">
            {EMAIL}
          </a>
        </div>
        <p className="text-xs text-neutral-600 mt-8">
          Based in Somerset, KY · Remote-friendly · Reply within 24h
        </p>
      </div>
    </section>
  );
}
