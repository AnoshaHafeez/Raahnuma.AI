"use client";

import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Trip } from "@/types/trip";
import { formatDateRange } from "@/lib/utils";

export function UpcomingTripsList({ trips }: { trips: Trip[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Upcoming Trips</h3>
        <Link href="/trips" className="text-xs font-medium text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-3">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className="group flex items-center justify-between rounded-xl border border-border p-3.5 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{trip.destination}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {formatDateRange(trip.startDate, trip.endDate)}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}