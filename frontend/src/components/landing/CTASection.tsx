"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16"
        >
          <div className="absolute inset-0 bg-noise" />
          <h2 className="relative text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
            The mountains are not going anywhere. Your readiness should get there first.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Plan your next trip with a system that actually knows the terrain.
          </p>
          <div className="relative mt-8">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link href="/login">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}