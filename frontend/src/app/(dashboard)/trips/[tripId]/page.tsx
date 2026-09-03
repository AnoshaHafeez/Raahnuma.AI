"use client";

import { useParams } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTrip } from "@/store/slices/tripsSlice";
import { SafetyAdvisoryCard } from "@/components/trips/SafetyAdvisoryCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { RouteAlertBanner } from "@/components/dashboard/RouteAlertBanner";
import { GearChecklist } from "@/components/trips/GearChecklist";
import { RouteSafetyPanel } from "@/components/trips/RouteSafetyPanel";
import { TripPlacesChecklist } from "@/components/trips/TripPlacesChecklist";
import { Button } from "@/components/ui/button";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useAppDispatch();
  const trip = useAppSelector((s) => s.trips.trips.find((t) => t.id === tripId));
  const status = useAppSelector((s) => s.trips.status);

  React.useEffect(() => {
    if (tripId) dispatch(setActiveTrip(tripId));
  }, [dispatch, tripId]);

  // The trips list is fetched by the dashboard layout, so on a hard refresh of
  // this URL the store is still empty. Without this the page would flash
  // "Trip not found" before the data arrives.
  if (!trip && status !== "ready" && status !== "failed") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium">Trip not found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This trip may have been removed, or it belongs to another account.
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/trips">Back to my trips</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafetyAdvisoryCard trip={trip} />
      <WeatherWidget trip={trip} />
      <RouteAlertBanner trip={trip} />

      <TripPlacesChecklist trip={trip} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GearChecklist trip={trip} />
        <RouteSafetyPanel trip={trip} />
      </div>
    </div>
  );
}
