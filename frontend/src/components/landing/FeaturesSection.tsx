"use client";

import { motion } from "framer-motion";
import { Backpack, ShieldAlert, MessageCircle, CloudRain, Store, Radio } from "lucide-react";

const features = [
  {
    icon: Backpack,
    title: "AI Packing Engine",
    description: "A checklist built for your route, season, and group — not a generic template copied from the internet."
  },
  {
    icon: ShieldAlert,
    title: "Route & Safety Advisory",
    description: "Live weather fused with elevation and seasonal risk data, explained in plain language before you leave."
  },
  {
    icon: MessageCircle,
    title: "WhatsApp AI Agent",
    description: "No app required — message us directly for packing advice, route questions, or a safety check-in."
  },
  {
    icon: CloudRain,
    title: "Automated Weather Alerts",
    description: "Conditions change fast in the mountains. We watch the forecast for your active trip so you do not have to."
  },
  {
    icon: Store,
    title: "Verified Local Gear",
    description: "Rent or buy from vetted shops in Hunza, Gilgit, and Skardu — supporting the guides who know these trails best."
  },
  {
    icon: Radio,
    title: "One-Tap Emergency SOS",
    description: "Share your live location and itinerary with emergency contacts and local rescue in a single tap."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need before the road gets steep
          </h2>
          <p className="mt-4 text-muted-foreground">
            No more piecing together forecasts, forum posts, and guesswork. One assistant, built for the terrain.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}