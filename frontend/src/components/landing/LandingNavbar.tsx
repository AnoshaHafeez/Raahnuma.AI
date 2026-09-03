"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stories", href: "#testimonials" }
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const section = document.querySelector<HTMLElement>(href);
    if (!section) return;

    window.history.replaceState(null, "", href);
    section.classList.remove("landing-section-enter");
    void section.offsetWidth;
    section.classList.add("landing-section-enter");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Raahnuma.AI home" className="flex items-center">
          <Image
            src="/images/Raahnuma%20Logo.png"
            alt="Raahnuma.AI"
            width={170}
            height={57}
            priority
            className="h-auto w-36 sm:w-40"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={(event) => navigateToSection(event, link.href)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Start Now</Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button aria-label="Toggle menu" onClick={() => setMobileOpen((v) => !v)} className="p-2">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden border-t border-border bg-background overflow-hidden"
        >
          <div className="container flex flex-col gap-4 py-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={(event) => { setMobileOpen(false); navigateToSection(event, link.href); }} className="text-sm font-medium">
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Start Now</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
