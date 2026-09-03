"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  Store,
  MessagesSquare,
  ShieldAlert,
  Settings,
  LogOut,
  Mountain,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const translatedNavItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard }, { href: "/trips", label: t("trips"), icon: Map },
    { href: "/marketplace", label: t("marketplace"), icon: Store }, { href: "/community", label: t("community"), icon: MessagesSquare },
    { href: "/sos", label: t("sos"), icon: ShieldAlert }, { href: "/settings", label: t("settings"), icon: Settings }
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast({ title: "Logged out", description: "See you on the next trail.", variant: "success" });
    onClose();
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Mountain className="h-4 w-4" />
                </span>
                Raahnuma.AI
              </div>
              <button type="button" onClick={onClose} aria-label={t("closeMenu")}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {translatedNavItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                {t("logout")}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
