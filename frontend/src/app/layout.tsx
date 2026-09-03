import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/store/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Raahnuma.AI — Your AI Guide to the Northern Areas",
  description:
    "Personalized packing lists, live safety advisories, and verified local gear — built for every trip into Pakistan mountains.",
  icons: { icon: "/favicon.ico" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}