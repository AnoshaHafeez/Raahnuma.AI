"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "default";
interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within Toaster");
  return ctx;
}

let externalToast: ToastContextValue["toast"] | null = null;
export function toast(t: Omit<ToastItem, "id">) {
  externalToast?.(t);
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const pushToast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4500);
  }, []);

  React.useEffect(() => {
    externalToast = pushToast;
    return () => {
      externalToast = null;
    };
  }, [pushToast]);

  return (
    <ToastContext.Provider value={{ toast: pushToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={cn(
                "flex w-80 items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
                item.variant === "success" && "border-primary/30",
                item.variant === "error" && "border-destructive/30"
              )}
            >
              {item.variant === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
              {item.variant === "error" && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <button
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}