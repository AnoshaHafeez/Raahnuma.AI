"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTrips } from "@/store/slices/tripsSlice";
import { fetchDestinations } from "@/store/slices/destinationsSlice";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useAuthGuard();
  const dispatch = useAppDispatch();
  const tripsStatus = useAppSelector((s) => s.trips.status);
  const destinationsStatus = useAppSelector((s) => s.destinations.status);

  // Load the shared data every dashboard page reads, once the session exists.
  // Guarded on "idle" so navigating between pages does not refetch.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (tripsStatus === "idle") dispatch(fetchTrips());
    if (destinationsStatus === "idle") dispatch(fetchDestinations());
  }, [isAuthenticated, tripsStatus, destinationsStatus, dispatch]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
