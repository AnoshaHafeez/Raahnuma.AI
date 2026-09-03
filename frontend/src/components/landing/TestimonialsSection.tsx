"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "We left for Fairy Meadows a day before a storm rolled in. The alert gave us enough time to move our schedule and avoid getting stranded.",
    name: "Ayesha R.",
    role: "Solo trekker, Islamabad"
  },
  {
    quote:
      "First time camping in Naran and I had no idea what to pack. The checklist was specific down to the altitude — genuinely felt like local advice.",
    name: "Bilal K.",
    role: "University trip organizer"
  },
  {
    quote:
      "Rented a four-season tent through the marketplace instead of buying gear I'd use once. Picked it up in Gilgit, no hassle.",
    name: "Sana M.",
    role: "Photographer"
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Real trips, real conditions
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}