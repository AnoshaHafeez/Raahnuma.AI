"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CloudRain, MessageSquareText, PackageCheck, ShieldAlert, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { marketplaceApi, trailReportsApi } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { TrailReportDTO } from "@/types/api";

type Notification = {
  id: string;
  title: string;
  message: string;
  href: string;
  icon: typeof Bell;
  tone: "default" | "warning";
};

/** Live trip notifications, built from the same weather, community and gear APIs the app uses elsewhere. */
export function NotificationsMenu() {
  const { trips, activeTripId } = useAppSelector((state) => state.trips);
  const activeTrip =
    trips.find((trip) => trip.id === activeTripId) ??
    trips.find((trip) => trip.status !== "completed") ??
    trips[0];
  const notificationTripId = activeTrip?.id;
  const notificationDestinationId = activeTrip?.destinationId;
  const [reports, setReports] = React.useState<TrailReportDTO[]>([]);
  const [suggestionCount, setSuggestionCount] = React.useState(0);
  const [read, setRead] = React.useState(false);

  React.useEffect(() => {
    if (!notificationTripId || notificationDestinationId == null) {
      setReports([]);
      setSuggestionCount(0);
      return;
    }
    let cancelled = false;
    Promise.all([
      trailReportsApi.listForDestination(notificationDestinationId),
      marketplaceApi.recommendations(Number(notificationTripId)),
    ])
      .then(([nextReports, suggestions]) => {
        if (!cancelled) {
          setReports(nextReports);
          setSuggestionCount(suggestions.length);
          setRead(false);
        }
      })
      .catch(() => {
        // Notifications are supplemental: the core dashboard stays available
        // if either source is temporarily offline.
      });
    return () => {
      cancelled = true;
    };
  }, [notificationDestinationId, notificationTripId]);

  const notifications = React.useMemo<Notification[]>(() => {
    if (!activeTrip) {
      return [{
        id: "plan-a-trip",
        title: "Plan your first trip",
        message: "Choose a destination to receive live weather and gear updates.",
        href: "/trips/new",
        icon: Sparkles,
        tone: "default",
      }];
    }

    const items: Notification[] = [];
    const needsWeatherAttention =
      activeTrip.weatherCondition === "rain" ||
      activeTrip.weatherCondition === "snow" ||
      activeTrip.rainChance >= 60 ||
      activeTrip.windKph >= 45;

    items.push({
      id: `weather-${activeTrip.id}`,
      title: needsWeatherAttention ? `Weather alert for ${activeTrip.destination}` : `Weather update for ${activeTrip.destination}`,
      message: needsWeatherAttention
        ? `${activeTrip.rainChance}% rain chance and ${activeTrip.windKph} km/h wind. Review your safety brief before departure.`
        : `${activeTrip.currentTempC}°C now, with a ${activeTrip.rainChance}% chance of rain.`,
      href: `/trips/${activeTrip.id}`,
      icon: needsWeatherAttention ? ShieldAlert : CloudRain,
      tone: needsWeatherAttention ? "warning" : "default",
    });

    const latestReport = reports.find((report) => report.condition !== "clear") ?? reports[0];
    if (latestReport) {
      items.push({
        id: `community-${latestReport.id}`,
        title: `Community update${latestReport.place_name ? `: ${latestReport.place_name}` : ""}`,
        message: latestReport.condition === "clear"
          ? "A traveler shared a fresh trail report for your destination."
          : `Travelers marked conditions as ${latestReport.condition}. Check the latest details.`,
        href: `/community?destination=${activeTrip.destinationId}`,
        icon: MessageSquareText,
        tone: latestReport.condition === "closed" ? "warning" : "default",
      });
    }

    if (suggestionCount > 0) {
      items.push({
        id: `gear-${activeTrip.id}`,
        title: "Trip-matched gear is ready",
        message: `${suggestionCount} marketplace item${suggestionCount === 1 ? "" : "s"} match your ${activeTrip.destination} itinerary.`,
        href: "/marketplace",
        icon: PackageCheck,
        tone: "default",
      });
    }

    return items;
  }, [activeTrip, reports, suggestionCount]);

  const unreadCount = read ? 0 : notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/60 hover:bg-secondary"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-96 p-2 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0 text-sm text-foreground">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button type="button" onClick={() => setRead(true)} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <DropdownMenuItem key={notification.id} asChild className="items-start gap-3 whitespace-normal p-3">
                <Link href={notification.href}>
                  <span className={notification.tone === "warning" ? "mt-0.5 text-destructive" : "mt-0.5 text-primary"}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{notification.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{notification.message}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
