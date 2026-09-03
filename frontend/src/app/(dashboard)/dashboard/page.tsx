"use client";

import * as React from "react";
import { Map, ShieldCheck, Package, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/communitySlice";
import { StatCard } from "@/components/dashboard/StatCard";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { AltitudeChart } from "@/components/dashboard/AltitudeChart";
import { TripActivityChart } from "@/components/dashboard/TripActivityChart";
import { UpcomingTripsList } from "@/components/dashboard/UpcomingTripsList";
import { RouteAlertBanner } from "@/components/dashboard/RouteAlertBanner";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const trips = useAppSelector((s) => s.trips.trips);
  const user = useAppSelector((s) => s.auth.user);
  const reports = useAppSelector((s) => s.community.reports);
  const reportsStatus = useAppSelector((s) => s.community.status);

  // The report count below is real data, so the feed has to be loaded.
  React.useEffect(() => {
    if (reportsStatus === "idle") dispatch(fetchReports());
  }, [reportsStatus, dispatch]);

  const upcoming = React.useMemo(() => trips.filter((t) => t.status === "upcoming"), [trips]);
  const activeTrip = upcoming[0] ?? trips[0];

  // Every figure below is derived from data the server actually returns.
  const gearReady = activeTrip
    ? `${activeTrip.gearChecklist.filter((g) => g.checked).length}/${activeTrip.gearChecklist.length}`
    : "—";
  const advisoryConfidence = activeTrip?.advisory?.confidence;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName?.split(" ")[0] ?? "Traveler"}</h1>
        <p className="text-sm text-muted-foreground">Here is what is happening with your upcoming trips.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Trips" value={String(upcoming.length)} icon={Map} />
        <StatCard
          label="Advisory Confidence"
          value={advisoryConfidence ? advisoryConfidence.toUpperCase() : "—"}
          icon={ShieldCheck}
          accent="primary"
        />
        <StatCard label="Gear Items Ready" value={gearReady} icon={Package} accent="accent" />
        <StatCard label="Community Reports" value={String(reports.length)} icon={Users} accent="primary" />
      </div>

      {activeTrip && (
        <>
          <RouteAlertBanner trip={activeTrip} />
          <WeatherWidget trip={activeTrip} />
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AltitudeChart trips={trips} />
        <TripActivityChart trips={trips} />
      </div>

      <UpcomingTripsList trips={upcoming} />
    </div>
  );
}
