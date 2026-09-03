import Link from "next/link";
import { ShieldCheck, ExternalLink, Info } from "lucide-react";
import { Trip } from "@/types/trip";

export function RouteSafetyPanel({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-semibold">Route safety</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{trip.routeSafety.summary}</p>
        <Link href={trip.routeSafety.detailsUrl ?? "#"} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View route details <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-semibold">Travel with context</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          AI guidance uses weather feeds and local safety patterns. Always confirm conditions with local authorities.
        </p>
        <button className="mt-3 text-sm font-medium text-primary hover:underline">Report an issue</button>
      </div>
    </div>
  );
}