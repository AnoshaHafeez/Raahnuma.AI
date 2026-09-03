"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { GearCard } from "@/components/marketplace/GearCard";
import { Button } from "@/components/ui/button";
import { marketplaceApi, toErrorMessage } from "@/lib/api";
import { toGearProduct } from "@/lib/adapters";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTrip } from "@/store/slices/tripsSlice";
import type { GearProduct } from "@/types/gear";

interface TripGearSuggestionsProps {
  onSeeAll: () => void;
}

/**
 * A small, trip-aware storefront before the general catalogue. The backend
 * ranks these products from the trip's selected places and activity tags.
 */
export function TripGearSuggestions({ onSeeAll }: TripGearSuggestionsProps) {
  const dispatch = useAppDispatch();
  const { trips, activeTripId } = useAppSelector((state) => state.trips);
  const preferredTrip = React.useMemo(
    () =>
      trips.find((trip) => trip.id === activeTripId) ??
      trips.find((trip) => trip.status !== "completed") ??
      trips[0],
    [activeTripId, trips]
  );
  const [selectedTripId, setSelectedTripId] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<GearProduct[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setSelectedTripId((current) =>
      trips.some((trip) => trip.id === current) ? current : preferredTrip?.id ?? ""
    );
  }, [preferredTrip?.id, trips]);

  React.useEffect(() => {
    if (!selectedTripId) {
      setSuggestions([]);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError("");
    marketplaceApi
      .recommendations(Number(selectedTripId))
      .then((products) => {
        if (!cancelled) {
          setSuggestions(products.map(toGearProduct));
          setStatus("ready");
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setSuggestions([]);
          setError(toErrorMessage(reason));
          setStatus("failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTripId]);

  if (trips.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Gear tailored to your trip
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a trip and choose your stops to receive a packing shortlist here.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/trips/new">Plan a trip</Link>
          </Button>
        </div>
      </section>
    );
  }

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  return (
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Our suggestions
          </p>
          <h2 className="mt-1 text-lg font-bold">Gear picked for your trip</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Matched to your selected places and planned activities.
          </p>
        </div>
        <label className="relative block w-full sm:w-56">
          <span className="sr-only">Choose a trip for gear suggestions</span>
          <select
            value={selectedTripId}
            onChange={(event) => {
              setSelectedTripId(event.target.value);
              dispatch(setActiveTrip(event.target.value));
            }}
            className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.destination} · {trip.startDate}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </label>
      </div>

      {status === "loading" ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding the best gear for {selectedTrip?.destination}…
        </div>
      ) : status === "failed" ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>
      ) : suggestions.length > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {suggestions.slice(0, 4).map((product) => (
              <GearCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onSeeAll}>
              See all gear
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No specific matches yet. Browse the complete local catalogue below.
        </div>
      )}
    </section>
  );
}
