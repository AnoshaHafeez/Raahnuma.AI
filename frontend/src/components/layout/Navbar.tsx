"use client";

import * as React from "react";
import { Menu, Search, ShieldAlert, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileSidebar } from "./MobileSidebar";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { initials } from "@/lib/utils";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { NotificationsMenu } from "./NotificationsMenu";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const [lang, setLang] = React.useState<"English" | "اردو">("English");
  const user = useAppSelector((s) => s.auth.user);
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <header data-localization-skip className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label={t("openMenu")} className="p-2 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder={t("search")}
              className="h-10 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-80"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-label={`Change language from ${lang}`}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 text-xs font-medium hover:bg-secondary"
            >
              {language === "en" ? "English" : "اردو"} <ChevronDown className="h-3 w-3" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-28 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {(["English", "اردو"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLanguage(l === "English" ? "en" : "ur");
                      setLangOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          <NotificationsMenu />

          <Button variant="destructive" size="sm" className="hidden gap-1.5 sm:inline-flex" asChild>
            <Link href="/sos">
              <ShieldAlert className="h-4 w-4" />
              {t("quickSos")}
            </Link>
          </Button>

          <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user ? initials(user.fullName) : "U"}
          </Link>
        </div>
      </header>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
