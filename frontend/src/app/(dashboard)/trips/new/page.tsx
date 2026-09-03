"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  Gauge,
  AlertTriangle,
  Sparkles,
  Check,
  ChevronDown,
  Loader2,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTrip } from "@/store/slices/tripsSlice";
import { fetchDestinations } from "@/store/slices/destinationsSlice";
import { toast } from "@/components/ui/toaster";
import { ExperienceLevel } from "@/types/user";
import { cn } from "@/lib/utils";
import { placesApi } from "@/lib/api";
import type {
  PlaceDTO,
  PlaceRecommendationDTO,
  PlacePickDTO,
} from "@/types/api";

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

export default function NewTripPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    items: destinations,
    status: destinationsStatus,
    error: destinationsError,
  } = useAppSelector((s) => s.destinations);
  const creating = useAppSelector((s) => s.trips.creating);
  const [dateError, setDateError] = React.useState("");
  const [form, setForm] = React.useState({
    destinationId: 0,
    startDate: "",
    endDate: "",
    groupSize: 2,
    experienceLevel: "beginner" as ExperienceLevel,
    selectedPlaceIds: [] as number[],
  });

  const [places, setPlaces] = React.useState<PlaceDTO[]>([]);
  const [placesLoading, setPlacesLoading] = React.useState(false);
  const [showAllPlaces, setShowAllPlaces] = React.useState(false);

  const [recommendation, setRecommendation] = React.useState<PlaceRecommendationDTO | null>(null);
  const [recommendationLoading, setRecommendationLoading] = React.useState(false);
  const [recommendationError, setRecommendationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (destinationsStatus === "idle") dispatch(fetchDestinations());
  }, [destinationsStatus, dispatch]);

  // Default to the first destination once the list arrives.
  React.useEffect(() => {
    if (form.destinationId === 0 && destinations.length > 0) {
      setForm((f) => ({ ...f, destinationId: destinations[0].id }));
    }
  }, [destinations, form.destinationId]);

  // Whenever the destination changes, reload the full places list and ask the
  // AI for its top picks. The two calls are independent so a slow LLM does not
  // block the scrollable list.
  React.useEffect(() => {
    if (!form.destinationId) return;
    let cancelled = false;
    setPlacesLoading(true);
    setRecommendationLoading(true);
    setRecommendationError(null);
    setShowAllPlaces(false);

    placesApi
      .list(form.destinationId)
      .then((items) => {
        if (!cancelled) {
          setPlaces(items);
          setForm((current) => ({ ...current, selectedPlaceIds: [] }));
        }
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });

    placesApi
      .recommendations(form.destinationId, 3)
      .then((data) => {
        if (!cancelled) {
          setRecommendation(data);
          setRecommendationError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRecommendation(null);
          setRecommendationError(
            err instanceof Error ? err.message : "Could not load AI picks."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRecommendationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.destinationId]);

  const togglePlace = (placeId: number) => {
    setForm((current) => ({
      ...current,
      selectedPlaceIds: current.selectedPlaceIds.includes(placeId)
        ? current.selectedPlaceIds.filter((id) => id !== placeId)
        : [...current.selectedPlaceIds, placeId],
    }));
  };

  const addAllTopPicks = () => {
    if (!recommendation) return;
    const ids = recommendation.picks.map((p) => p.place_id);
    setForm((current) => {
      const merged = new Set([...current.selectedPlaceIds, ...ids]);
      return { ...current, selectedPlaceIds: Array.from(merged) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.destinationId) {
      setDateError("Pick a destination first.");
      return;
    }
    if (form.endDate < form.startDate) {
      setDateError("Your end date must be on or after your start date.");
      return;
    }
    setDateError("");

    const result = await dispatch(createTrip(form));

    if (createTrip.fulfilled.match(result)) {
      toast({
        title: "Trip created",
        description: result.payload.advisory
          ? "Your AI safety advisory is ready."
          : "Your advisory is still generating — refresh the trip in a moment.",
        variant: "success",
      });
      router.push(`/trips/${result.payload.id}`);
      return;
    }

    toast({
      title: "Could not create your trip",
      description: result.payload ?? "Please try again.",
      variant: "error",
    });
  };

  const selectedCount = form.selectedPlaceIds.length;
  const picksById = React.useMemo(() => {
    const map = new Map<number, PlacePickDTO>();
    recommendation?.picks.forEach((p) => map.set(p.place_id, p));
    return map;
  }, [recommendation]);

  const destinationName =
    destinations.find((d) => d.id === form.destinationId)?.name ?? "";
  const remainingPlaces = places.filter((place) => !picksById.has(place.id));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plan a new trip</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us where you are headed — we will generate your packing list and
          safety advisory.
        </p>
      </div>

      {destinationsStatus === "failed" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" /> {destinationsError}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch(fetchDestinations())}
          >
            Try again
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="destination">Destination</Label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="destination"
              value={form.destinationId}
              disabled={destinations.length === 0}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  destinationId: Number(e.target.value),
                }))
              }
              className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
            >
              {destinations.length === 0 && (
                <option value={0}>
                  {destinationsStatus === "loading"
                    ? "Loading destinations..."
                    : "No destinations available"}
                </option>
              )}
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ---------- AI top picks ---------- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Top 3 AI picks
              {recommendation?.source === "heuristic" && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  heuristic
                </span>
              )}
            </Label>
            {recommendation && recommendation.picks.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={addAllTopPicks}
                className="h-7 text-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Select top 3
              </Button>
            )}
          </div>

          {recommendationLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Asking the AI for the best stops in {destinationName}…
            </div>
          ) : recommendationError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {recommendationError}
            </p>
          ) : recommendation && recommendation.picks.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                {recommendation.summary}
              </p>
              <div className="grid gap-2">
                {recommendation.picks.slice(0, 3).map((pick, idx) => {
                  const selected = form.selectedPlaceIds.includes(
                    pick.place_id
                  );
                  return (
                    <button
                      key={pick.place_id}
                      type="button"
                      onClick={() => togglePlace(pick.place_id)}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-input hover:bg-secondary"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input text-muted-foreground"
                        )}
                      >
                        {selected ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{pick.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pick.reason}
                        </p>
                        <p className="mt-1 text-xs text-primary">
                          {pick.activity_tags.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No picks available yet for this destination.
            </p>
          )}
        </div>

        {/* ---------- Remaining places list ---------- */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAllPlaces((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-input px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
          >
            <span>
              Explore all other places in {destinationName || "this destination"}
              {remainingPlaces.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {remainingPlaces.length}
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showAllPlaces && "rotate-180"
              )}
            />
          </button>

          {showAllPlaces && (
            <div className="space-y-1.5">
              {placesLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading places…
                </p>
              ) : remainingPlaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have seen every available place for this destination.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {remainingPlaces.map((place) => {
                    const selected = form.selectedPlaceIds.includes(place.id);
                    const pick = picksById.get(place.id);
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => togglePlace(place.id)}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-input hover:bg-secondary"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {place.name}
                              </p>
                              {place.popularity_rank != null &&
                                place.popularity_rank <= 5 && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                    <Star className="h-2.5 w-2.5" />
                                    #{place.popularity_rank}
                                  </span>
                                )}
                              {pick && (
                                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                  AI pick
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {place.description}
                            </p>
                            <p className="mt-1 text-xs text-primary">
                              {place.activity_tags.join(" · ")}
                            </p>
                          </div>
                          {place.community_rating != null && (
                            <span className="shrink-0 text-xs font-medium">
                              ★ {place.community_rating} ({place.review_count})
                            </span>
                          )}
                        </div>
                        {place.community_review && (
                          <p className="mt-2 border-t border-border pt-2 text-xs italic text-muted-foreground">
                            &ldquo;{place.community_review}&rdquo;
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedCount} place{selectedCount === 1 ? "" : "s"} selected —
              they will be added to your trip checklist and tailor the AI
              advisory.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                className="pl-10"
                required
                value={form.startDate}
                onChange={(e) => {
                  setDateError("");
                  setForm((f) => ({ ...f, startDate: e.target.value }));
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date</Label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                min={form.startDate || undefined}
                className="pl-10"
                required
                value={form.endDate}
                onChange={(e) => {
                  setDateError("");
                  setForm((f) => ({ ...f, endDate: e.target.value }));
                }}
              />
            </div>
          </div>
        </div>
        {dateError && (
          <p className="text-sm text-destructive" role="alert">
            {dateError}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="groupSize">Group size</Label>
          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="groupSize"
              type="number"
              min={1}
              className="pl-10"
              value={form.groupSize}
              onChange={(e) =>
                setForm((f) => ({ ...f, groupSize: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> Experience level
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, experienceLevel: level.value }))
                }
                className={cn(
                  "h-10 rounded-lg border text-xs font-medium transition-colors",
                  form.experienceLevel === level.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-secondary"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={creating || !form.destinationId}
        >
          {creating ? "Generating your advisory..." : "Generate trip pack"}
        </Button>
      </form>
    </div>
  );
}
