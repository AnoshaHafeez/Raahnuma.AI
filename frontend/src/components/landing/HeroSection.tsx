"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/landing-hero-mountains.jpg.jpg"
          alt="Sunrise over the peaks of Hunza Valley"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background dark:from-background/70 dark:via-background/80 dark:to-background" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
        

          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Every mountain has a story.
            <br />
            <span className="text-primary">Do not let it end in an emergency.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Raahnuma.AI turns uncertain weather, unfamiliar routes, and guesswork packing into a clear,
            personalized plan — so your trip to Hunza, Naran, or Skardu stays a memory, not a headline.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="group w-full sm:w-auto" asChild>
              <Link href="/login">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <a href="#how-it-works">
                <FileText className="mr-2 h-4 w-4" />
                Read Docs
              </a>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Trusted by trekkers, families, and student expeditions across Gilgit-Baltistan.
          </p>
        </motion.div>
      </div>

   
    </section>
  );
}
