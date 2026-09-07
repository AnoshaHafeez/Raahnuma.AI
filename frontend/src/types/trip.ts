/**
 * UI-facing trip models (camelCase). Assembled by `toTrip()` in
 * `lib/adapters.ts` from three backend resources:
 *   - `TripDTO`            (GET /api/v1/trips)
 *   - `DestinationDTO`     (GET /api/v1/destinations)  — name, elevation, hazards
 *   - `WeatherSnapshotDTO` (the advisory's `source_weather_snapshot`, or
 *                           GET /api/v1/destinations/{id}/weather when live)
 */

import type { ExperienceLevel } from "./user";

export type WeatherCondition = "sunny" | "cloudy" | "rain" | "snow";

export interface WeatherDay {
  /** Short weekday label for the axis, e.g. "Fri". */
  day: string;
  /** ISO date the label was derived from — used as a stable React key. */
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
}

export interface GearChecklistItem {
  id: string;
  name: string;
  /** `gear_checklist` items are mandatory; `packing_list` items are recommended. */
  category: "mandatory" | "recommended";
  /**
   * Client-side only. The server stores the generated list but not per-item
   * tick state, so this resets when the trip list is refetched.
   */
  checked: boolean;
}

export interface TripAdvisory {
  id: string;
  packingList: string[];
  safetyText: string;
  safetyTextUr: string;
  confidence: string;
  generatedAt: string;
  disclaimer: string;
}

export type TripStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface Trip {
  /** Stringified server id; the `/trips/[tripId]` route matches on this. */
  id: string;
  destinationId: number;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  language: string;
  /** Read back out of the server's free-form `traveler_profile` JSON. */
  experienceLevel: ExperienceLevel;
  activitiesCount: number;
  /** Derived from startDate/endDate against the current date. */
  status: TripStatus;

  currentTempC: number;
  feelsLikeC: number;
  rainChance: number;
  windKph: number;
  visibility: string;
  elevationM: number;
  weatherCondition: WeatherCondition;
  sevenDayOutlook: WeatherDay[];
  /** True when the server replayed a cached snapshot because Open-Meteo was down. */
  weatherStale: boolean;

  /** Built from the destination's `known_hazards`; absent when there are none. */
  routeWarning?: { title: string; description: string };
  routeSafety: { summary: string; detailsUrl?: string };
  gearChecklist: GearChecklistItem[];
  /** Null until the background advisory job finishes. */
  advisory: TripAdvisory | null;
}
