"use client";

import Link from "next/link";
import { Plus, MapPin, Calendar, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrips } from "@/store/slices/tripsSlice";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateRange, cn } from "@/lib/utils";
import { Trip } from "@/types/trip";

function TripRow({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/30"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{trip.destination}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> {formatDateRange(trip.startDate, trip.endDate)} · {trip.activitiesCount} activities
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
            trip.status === "upcoming" && "bg-primary/10 text-primary",
            trip.status === "active" && "bg-accent/15 text-accent",
            trip.status === "completed" && "bg-secondary text-muted-foreground"
          )}
        >
          {trip.status}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}

export default function TripsPage() {
  const dispatch = useAppDispatch();
  const { trips, status, error } = useAppSelector((s) => s.trips);

  const upcoming = trips.filter((t) => t.status === "upcoming");
  const completed = trips.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every trip you have planned, with its live safety advisory.</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/trips/new">
            <Plus className="h-4 w-4" /> Plan a new trip
          </Link>
        </Button>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your trips...
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
          <Button size="sm" variant="outline" onClick={() => dispatch(fetchTrips())}>
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && trips.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">You have not planned a trip yet.</p>
          <Button className="mt-4 gap-2" asChild>
            <Link href="/trips/new">
              <Plus className="h-4 w-4" /> Plan your first trip
            </Link>
          </Button>
        </div>
      )}

      {trips.length > 0 && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({trips.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {trips.map((trip) => <TripRow key={trip.id} trip={trip} />)}
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming trips.</p>
            )}
            {upcoming.map((trip) => <TripRow key={trip.id} trip={trip} />)}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3">
            {completed.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No completed trips yet.</p>
            )}
            {completed.map((trip) => <TripRow key={trip.id} trip={trip} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}