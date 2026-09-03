"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitReport } from "@/store/slices/communitySlice";
import { fetchDestinations } from "@/store/slices/destinationsSlice";
import { toast } from "@/components/ui/toaster";
import { TrailReport } from "@/types/community";
import { cn } from "@/lib/utils";
import { placesApi } from "@/lib/api";
import type { PlaceDTO } from "@/types/api";

const conditions: { value: TrailReport["condition"]; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "caution", label: "Use caution" },
  { value: "closed", label: "Closed" },
];

interface NewReportModalProps {
  /** Preselect the destination and open the modal, e.g. from a deep link. */
  initialDestinationId?: number;
  /** Preselect a specific place of that destination. */
  initialPlaceId?: number;
  /** When true the modal opens on mount. */
  initiallyOpen?: boolean;
}

export function NewReportModal({
  initialDestinationId,
  initialPlaceId,
  initiallyOpen,
}: NewReportModalProps = {}) {
  const dispatch = useAppDispatch();
  const destinations = useAppSelector((s) => s.destinations.items);
  const destinationsStatus = useAppSelector((s) => s.destinations.status);
  const submitting = useAppSelector((s) => s.community.submitting);
  const [open, setOpen] = React.useState(!!initiallyOpen);
  const [form, setForm] = React.useState({
    destinationId: initialDestinationId ?? 0,
    placeId: initialPlaceId ?? 0,
    description: "",
    condition: "clear" as TrailReport["condition"],
  });

  const [places, setPlaces] = React.useState<PlaceDTO[]>([]);
  const [placesLoading, setPlacesLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && destinationsStatus === "idle") dispatch(fetchDestinations());
  }, [open, destinationsStatus, dispatch]);

  // Default to the first destination once the list arrives, but only when the
  // caller did not preselect one via URL params.
  React.useEffect(() => {
    if (!form.destinationId && destinations.length) {
      setForm((f) => ({ ...f, destinationId: destinations[0].id }));
    }
  }, [destinations, form.destinationId]);

  // When the modal opens with a preselected destination, preload its places so
  // the place dropdown is populated immediately.
  React.useEffect(() => {
    if (!form.destinationId) return;
    let cancelled = false;
    setPlacesLoading(true);
    placesApi
      .list(form.destinationId)
      .then((items) => {
        if (!cancelled) setPlaces(items);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.destinationId]);

  // If the user switches destination, any previously selected place may no
  // longer belong to it — clear it rather than silently sending a cross-valley
  // report.
  React.useEffect(() => {
    if (form.placeId && !places.some((p) => p.id === form.placeId)) {
      setForm((f) => ({ ...f, placeId: 0 }));
    }
  }, [places, form.placeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destinationId) return;

    const result = await dispatch(
      submitReport({
        destinationId: form.destinationId,
        placeId: form.placeId || null,
        condition: form.condition,
        description: form.description,
      })
    );

    if (submitReport.fulfilled.match(result)) {
      toast({
        title: "Report submitted",
        description: "Thanks — your update is now visible to other travelers.",
        variant: "success",
      });
      setOpen(false);
      setForm((f) => ({
        ...f,
        description: "",
        condition: "clear",
        placeId: 0,
      }));
    } else {
      toast({
        title: "Could not submit report",
        description: result.payload ?? "Please try again.",
        variant: "error",
      });
    }
  };

  const selectedPlace = places.find((p) => p.id === form.placeId);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Report trail condition
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold">
              Report trail condition
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination</Label>
              <select
                id="destination"
                required
                value={form.destinationId || ""}
                disabled={
                  destinationsStatus === "loading" ||
                  destinations.length === 0
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    destinationId: Number(e.target.value),
                  }))
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
              >
                {destinationsStatus === "loading" && (
                  <option value="">Loading destinations...</option>
                )}
                {destinationsStatus === "failed" && (
                  <option value="">Could not load destinations</option>
                )}
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="place">
                Place{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <select
                id="place"
                value={form.placeId || ""}
                disabled={placesLoading || places.length === 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, placeId: Number(e.target.value) }))
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
              >
                {placesLoading && (
                  <option value="">Loading places…</option>
                )}
                {!placesLoading && places.length === 0 && (
                  <option value="">No places for this destination</option>
                )}
                {!placesLoading && places.length > 0 && (
                  <>
                    <option value="">Whole destination</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {selectedPlace && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlace.description}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Condition</Label>
              <div className="grid grid-cols-3 gap-2">
                {conditions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, condition: c.value }))
                    }
                    className={cn(
                      "h-9 rounded-lg border text-xs font-medium transition-colors",
                      form.condition === c.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What did you see on the trail?"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !form.destinationId}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "Submit report"
              )}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
