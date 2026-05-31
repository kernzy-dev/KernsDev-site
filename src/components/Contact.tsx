import { motion } from "framer-motion";
import Reveal from "./motion/Reveal";

// TODO: replace BOOKING_URL with your Cal.com / Calendly link when ready.
// TODO: when the branded email is live, swap CONTACT_EMAIL back in and re-enable the email button.
const BOOKING_URL = "#";  // disabled until set up
const CONTACT_EMAIL: string | null = null;  // intentionally hidden — branded email coming soon

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 border-t border-neutral-900 relative overflow-hidden">
      {/* Animated accent glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-accent/10 blur-3xl rounded-full"
        />
      </div>

      <div className="container-tight max-w-3xl text-center">
        <Reveal>
          <p className="section-eyebrow mb-3">Get in touch</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Got a problem that needs <span className="text-accent">specific software</span>?
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg text-neutral-300 mb-10">
            Tell me about it. First call is free, 20 minutes, no pitch deck. If it's a fit we'll
            scope the build; if it isn't I'll tell you what tool already does it.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-wrap justify-center gap-3">
            <motion.a
              href={BOOKING_URL}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-base"
              onClick={(e) => {
                if (BOOKING_URL === "#") {
                  e.preventDefault();
                  alert("Booking link is being set up — check back soon.");
                }
              }}
            >
              Book a call →
            </motion.a>
            {CONTACT_EMAIL && (
              <motion.a
                href={`mailto:${CONTACT_EMAIL}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-ghost text-base"
              >
                {CONTACT_EMAIL}
              </motion.a>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.4}>
          <p className="text-xs text-neutral-600 mt-8">
            Based in Somerset, KY · Remote-friendly · Booking + email channels coming soon
          </p>
        </Reveal>
      </div>
    </section>
  );
}
