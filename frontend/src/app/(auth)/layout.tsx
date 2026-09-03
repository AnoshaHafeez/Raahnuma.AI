import Image from "next/image";
import Link from "next/link";
import { Mountain } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/images/auth-mountains-bg.jpg.jpg"
          alt="Karakoram mountain range at dawn"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-900/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/10 to-transparent" />

        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-bold leading-tight text-balance">
            Every trail has a plan.
            <br /> Now yours does too.
          </h2>
          <p className="mt-3 max-w-md text-white/80">
            Join thousands of travelers using AI to prepare smarter for Pakistan&apos;s northern trails.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </span>
            Raahnuma<span className="text-primary">.AI</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center">{children}</div>
      </div>
    </div>
  );
}
