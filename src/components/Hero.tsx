import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const meshScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative pt-32 pb-20 md:pt-44 md:pb-40 overflow-hidden"
    >
      {/* Layered animated background — multiple offset gradients on slow loops + subtle grid */}
      <motion.div
        style={{ scale: meshScale }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* Mesh blob 1 */}
        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[25%] w-[40rem] h-[40rem] bg-accent/20 blur-3xl rounded-full"
        />
        {/* Mesh blob 2 */}
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 50, -20, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[15%] w-[36rem] h-[36rem] bg-orange-700/20 blur-3xl rounded-full"
        />
        {/* Mesh blob 3 — cooler color for contrast */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[5%] left-[10%] w-[32rem] h-[32rem] bg-violet-700/15 blur-3xl rounded-full"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
          }}
        />
      </motion.div>

      <div className="container-tight w-full relative">
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-eyebrow mb-4"
          >
            Hi, I'm Grant.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
          >
            I build the software you<br className="hidden md:block" />{" "}
            <span className="text-accent">can't buy off the shelf.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto"
          >
            Custom web apps, automation, and AI integrations for businesses and individuals who need
            something specific — built fast, honest, and detail-oriented.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary"
            >
              Book a call →
            </motion.a>
            <motion.a
              href="#work"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost"
            >
              See the work
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Trio of qualifiers — staggered in */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.8 } },
          }}
          className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { word: "Fast", desc: "Shipped, not perfect. Iterate from real use." },
            { word: "Honest", desc: "If it won't work, I tell you up front." },
            { word: "Detail-oriented", desc: "The thing visitors notice but can't name." },
          ].map((q) => (
            <motion.div
              key={q.word}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="text-center md:text-left"
            >
              <div className="text-2xl font-display font-bold text-accent">{q.word}</div>
              <div className="text-sm text-neutral-400 mt-1">{q.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1.5, duration: 0.8 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 text-xs tracking-wider"
        >
          ↓ scroll
        </motion.div>
      </div>
    </section>
  );
}
