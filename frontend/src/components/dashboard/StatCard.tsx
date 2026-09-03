"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  accent?: "primary" | "accent" | "destructive";
}

export function StatCard({ label, value, icon: Icon, trend, accent = "primary" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "accent" && "bg-accent/15 text-accent",
            accent === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trend.direction === "up" ? "text-primary" : "text-destructive")}>
          {trend.direction === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend.value}
        </div>
      )}
    </motion.div>
  );
}