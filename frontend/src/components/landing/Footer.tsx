import Link from "next/link";
import { Mountain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col items-center justify-between gap-6 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="h-3.5 w-3.5" />
          </span>
          Raahnuma<span className="text-primary">.AI</span>
        </Link>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Raahnuma.AI. Built for the mountains.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}