"use client";

import * as React from "react";
import { useTheme as useNextTheme } from "next-themes";

interface ThemeContextValue {
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Thin wrapper around next-themes so the rest of the app can import
 * a single `useAppTheme()` hook from context/ instead of reaching into
 * next-themes directly. All actual persistence/system-detection logic
 * still lives in next-themes (wired in store/Providers.tsx).
 */
export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useNextTheme();

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeContextProvider");
  return ctx;
}