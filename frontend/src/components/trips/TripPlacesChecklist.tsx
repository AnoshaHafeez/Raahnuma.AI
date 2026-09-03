"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/lib/api";
import type { TripPlaceDTO } from "@/types/api";
import type { Trip } from "@/types/trip";
import { cn } from "@/lib/utils";

interface Props {
  trip: Trip;
}

export function TripPlacesChecklist({ trip }: Props) {
  const router = useRouter();
  const [places, setPlaces] = React.useState<TripPlaceDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    placesApi
      .forTrip(Number(trip.id))
      .then((rows) => {
        if (!cancelled) setPlaces(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load checklist.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  const toggleVisited = async (row: TripPlaceDTO) => {
    if (togglingId !== null) return;
    setTogglingId(row.id);
    const next = !row.visited;
    // Optimistic update — the server is the source of truth, but flipping the
    // tick immediately keeps the UI feeling snappy.
    setPlaces((current) =>
      current.map((p) =>
        p.id === row.id
          ? { ...p, visited: next, visited_at: next ? new Date().toISOString() : null }
          : p
      )
    );
    try {
      await placesApi.setVisited(Number(trip.id), row.place_id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that place.");
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  };

  const visitedCount = places.filter((p) => p.visited).length;
  const hasVisited = visitedCount > 0;
  const lastVisited = [...places].reverse().find((p) => p.visited);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Places to visit
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tick off the stops as you go — the checklist is saved with your trip.
          </p>
        </div>
        {places.length > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {visitedCount}/{places.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading your checklist…
        </div>
      ) : error ? (
        <p className="py-4 text-xs text-destructive">{error}</p>
      ) : places.length === 0 ? (
        <p className="py-4 text-xs text-muted-foreground">
          No places were added when this trip was planned. You can still edit
          the trip to pick stops, or just use the checklist on the trip form.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {places.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => toggleVisited(row)}
                disabled={togglingId === row.id}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  row.visited
                    ? "border-primary/40 bg-primary/5"
                    : "border-input hover:bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    row.visited
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {row.visited ? <Check className="h-3 w-3" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold",
                      row.visited && "text-muted-foreground line-through"
                    )}
                  >
                    {row.name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {row.description}
                  </p>
                  {row.visited_at && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Visited {new Date(row.visited_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasVisited && lastVisited && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">
            You visited {lastVisited.name}. Share what it was like — your
            report helps the next traveller.
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-2 h-8 text-xs"
          >
            <Link
              href={
                `/community?destination=${trip.destinationId}` +
                `&place=${lastVisited.place_id}` +
                `&open=1`
              }
            >
              <PenLine className="mr-1.5 h-3.5 w-3.5" />
              Write a trail report
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
