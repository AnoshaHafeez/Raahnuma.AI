"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { AuthContextProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <LanguageProvider>
          <ThemeContextProvider>
            <AuthContextProvider>
              <Toaster>{children}</Toaster>
            </AuthContextProvider>
          </ThemeContextProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  );
}
