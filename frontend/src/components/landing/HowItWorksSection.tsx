"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Tell us where you're headed",
    description: "Pick your destination, dates, group size, and experience level — takes under a minute."
  },
  {
    step: "02",
    title: "Get your AI trip pack",
    description: "A personalized gear checklist and safety advisory, grounded in live weather and route data."
  },
  {
    step: "03",
    title: "Gear up locally",
    description: "Rent or buy from verified vendors near your route, delivered to where you're staying."
  },
  {
    step: "04",
    title: "Travel with a safety net",
    description: "Automated alerts if conditions shift, and one-tap SOS if you ever need it."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border bg-secondary/40 py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">From an idea to a safe trip</h2>
          <p className="mt-4 text-muted-foreground">Four steps between the idea of a Hunza trip and actually being ready.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <span className="text-5xl font-bold text-primary/15">{s.step}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              {i < steps.length - 1 && (
                <div className="absolute right-[-1rem] top-6 hidden h-px w-8 bg-border lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}