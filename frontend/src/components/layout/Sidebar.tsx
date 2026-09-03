"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  Store,
  MessagesSquare,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const { t } = useLanguage();
  const translatedNavItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard }, { href: "/trips", label: t("trips"), icon: Map },
    { href: "/marketplace", label: t("marketplace"), icon: Store }, { href: "/community", label: t("community"), icon: MessagesSquare },
    { href: "/sos", label: t("sos"), icon: ShieldAlert }, { href: "/settings", label: t("settings"), icon: Settings }
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast({ title: "Logged out", description: "See you on the next trail.", variant: "success" });
    router.push("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/dashboard" aria-label="Raahnuma.AI dashboard" className="min-w-0">
          <Image
            src="/images/Raahnuma%20Logo.png"
            alt="Raahnuma.AI"
            width={150}
            height={50}
            priority
            className={cn(
              "transition-all",
              collapsed
                ? "h-9 w-9 rounded-lg object-cover object-left"
                : "h-auto w-36"
            )}
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {translatedNavItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {active && <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-primary/10" transition={{ type: "spring", duration: 0.4, bounce: 0.2 }} />}
              <item.icon className="relative z-10 h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
