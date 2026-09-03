import { AlertTriangle } from "lucide-react";
import { Trip } from "@/types/trip";

export function RouteAlertBanner({ trip }: { trip: Trip }) {
  if (!trip.routeWarning) return null;

  return (
    <div className="flex gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-semibold">{trip.routeWarning.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{trip.routeWarning.description}</p>
      </div>
    </div>
  );
}