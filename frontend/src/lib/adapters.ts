/**
 * DTO -> view-model adapters.
 *
 * This is the only place that knows about the server's snake_case wire format.
 * Keeping the conversion here means a backend field rename produces one
 * compile error in this file instead of silent `undefined` across the UI.
 */

import type {
  AdvisoryDTO,
  DailyForecastDTO,
  DestinationDTO,
  EmergencyContactDTO,
  TrailReportDTO,
  TripDTO,
  UserDTO,
  WeatherSnapshotDTO
} from "@/types/api";
import type { ProductDTO } from "@/types/api";
import type { GearProduct } from "@/types/gear";
import type { Destination } from "@/types/destination";
import { API_BASE_URL } from "@/lib/api";
import type { TrailReport } from "@/types/community";
import type {
  GearChecklistItem,
  Trip,
  TripAdvisory,
  TripStatus,
  WeatherCondition,
  WeatherDay
} from "@/types/trip";
import type { EmergencyContact, ExperienceLevel, LanguagePreference, User } from "@/types/user";

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["beginner", "intermediate", "expert"];

/* ---------------------------------- user ---------------------------------- */

/** `full_name` and `phone` are nullable server-side; the UI wants plain strings. */
export function toUser(dto: UserDTO): User {
  return {
    id: String(dto.id),
    fullName: dto.full_name?.trim() || dto.email.split("@")[0],
    email: dto.email,
    phone: dto.phone ?? "",
    preferredLanguage: (dto.preferred_language === "ur" ? "ur" : "en") as LanguagePreference,
    experienceLevel: toExperienceLevel(dto.experience_level),
    isAdmin: dto.is_admin,
    createdAt: dto.created_at
  };
}

export function toEmergencyContact(dto: EmergencyContactDTO): EmergencyContact {
  return { id: String(dto.id), name: dto.name, phoneNumber: dto.phone_number };
}

/* ------------------------------ destinations ------------------------------ */

export function toDestination(dto: DestinationDTO): Destination {
  return {
    id: dto.id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    description: dto.description ?? "",
    knownHazards: dto.known_hazards ?? ""
  };
}

const GEAR_COLORS = ["bg-emerald-100 dark:bg-emerald-950", "bg-sky-100 dark:bg-sky-950", "bg-amber-100 dark:bg-amber-950", "bg-rose-100 dark:bg-rose-950"];

function resolveGearImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "";
  return imageUrl.startsWith("/") ? `${API_BASE_URL}${imageUrl}` : imageUrl;
}

export function toGearProduct(dto: ProductDTO): GearProduct {
  return {
    id: String(dto.id), name: dto.name,
    category: dto.category as GearProduct["category"],
    vendor: { id: String(dto.vendor_id), name: dto.vendor_name, location: dto.vendor_location, rating: dto.rating ?? 0 },
    rentPricePerDay: dto.rent_price_per_day, buyPrice: dto.buy_price, rating: dto.rating ?? 0,
    imageColor: GEAR_COLORS[dto.id % GEAR_COLORS.length], imageUrl: resolveGearImageUrl(dto.image_url), useTags: dto.use_tags ?? [],
    destinationId: dto.destination_id, destinationName: dto.destination_name,
    recommendedFor: dto.recommended_for, recommendationReason: dto.reason,
  };
}

/* --------------------------------- weather -------------------------------- */

/**
 * WMO 4677 weather codes, as documented by Open-Meteo, collapsed into the four
 * icons the UI has. Snow is checked before rain because 85/86 (snow showers)
 * fall inside the shower range.
 */
export function toWeatherCondition(code: number | null | undefined): WeatherCondition {
  if (code == null) return "cloudy";
  if (code === 0 || code === 1) return "sunny";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  return "cloudy";
}

/** Open-Meteo reports visibility in metres; the widget shows a word. */
export function toVisibilityLabel(metres: number | null | undefined): string {
  if (metres == null) return "Unknown";
  if (metres >= 10_000) return "Clear";
  if (metres >= 4_000) return "Moderate";
  if (metres >= 1_000) return "Poor";
  return "Very poor";
}

function toWeatherDay(dto: DailyForecastDTO): WeatherDay {
  const parsed = new Date(`${dto.date}T00:00:00`);
  return {
    day: Number.isNaN(parsed.getTime())
      ? dto.date
      : parsed.toLocaleDateString("en-US", { weekday: "short" }),
    date: dto.date,
    tempHigh: Math.round(dto.temp_max_c),
    tempLow: Math.round(dto.temp_min_c),
    condition: toWeatherCondition(dto.weather_code)
  };
}

/* ---------------------------------- trips --------------------------------- */

export function toTripAdvisory(dto: AdvisoryDTO): TripAdvisory {
  return {
    id: String(dto.id),
    packingList: dto.packing_list ?? [],
    safetyText: dto.safety_advisory_text ?? "",
    safetyTextUr: dto.safety_advisory_text_ur ?? "",
    confidence: dto.confidence ?? "unknown",
    generatedAt: dto.generated_at,
    disclaimer: dto.disclaimer ?? ""
  };
}

/**
 * `gear_checklist` becomes the mandatory tab and `packing_list` the recommended
 * tab. Ids are derived from the advisory id plus the index so they stay stable
 * across re-renders without the server having to mint per-item ids.
 */
function toGearChecklist(advisory: AdvisoryDTO | null): GearChecklistItem[] {
  if (!advisory) return [];

  const build = (names: string[], category: GearChecklistItem["category"]) =>
    names
      .filter((name) => typeof name === "string" && name.trim().length > 0)
      .map((name, index) => ({
        id: `${advisory.id}-${category}-${index}`,
        name: name.trim(),
        category,
        checked: false
      }));

  return [
    ...build(advisory.gear_checklist ?? [], "mandatory"),
    ...build(advisory.packing_list ?? [], "recommended")
  ];
}

function toTripStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) return "completed";
  if (startDate > today) return "upcoming";
  return "active";
}

function toExperienceLevel(value: unknown): ExperienceLevel {
  return EXPERIENCE_LEVELS.includes(value as ExperienceLevel)
    ? (value as ExperienceLevel)
    : "beginner";
}

/**
 * `traveler_profile` is an untyped JSON blob on the server, so read it
 * defensively — an older trip may not carry these keys at all.
 */
function readTravelerProfile(profile: Record<string, unknown> | null | undefined) {
  const source = profile ?? {};
  const activities = source.activities;
  const groupSize = Number(source.group_size);

  return {
    experienceLevel: toExperienceLevel(source.experience_level),
    activitiesCount: Array.isArray(activities)
      ? activities.length
      : Number.isFinite(groupSize) && groupSize > 0
        ? Math.trunc(groupSize)
        : 0
  };
}

/**
 * A weather snapshot can arrive either from the live weather endpoint or
 * embedded in an advisory as `source_weather_snapshot` (a loosely-typed dict).
 * Normalise both into the same partial shape.
 */
function readSnapshot(snapshot: Partial<WeatherSnapshotDTO> | null | undefined) {
  const source = snapshot ?? {};
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

  return {
    temperatureC: num(source.temperature_c),
    apparentC: num(source.apparent_temperature_c),
    windKmh: num(source.wind_speed_kmh),
    precipitationProbability: num(source.precipitation_probability),
    visibilityM: num(source.visibility_m),
    elevationM: num(source.elevation_m),
    weatherCode: num(source.weather_code),
    daily: Array.isArray(source.daily) ? (source.daily as DailyForecastDTO[]) : [],
    stale: source.stale === true
  };
}

export interface TripAdapterContext {
  /** Resolves `destination_id` to a display name and hazard text. */
  destination?: Destination;
  /**
   * Live weather, when available. Falls back to the advisory's
   * `source_weather_snapshot` so an offline/cached trip still renders.
   */
  weather?: WeatherSnapshotDTO | null;
}

export function toTrip(dto: TripDTO, context: TripAdapterContext = {}): Trip {
  const advisoryDto = dto.latest_advisory;
  const snapshot = readSnapshot(context.weather ?? advisoryDto?.source_weather_snapshot);
  const { experienceLevel, activitiesCount } = readTravelerProfile(dto.traveler_profile);
  const destinationName = context.destination?.name ?? `Destination #${dto.destination_id}`;
  const hazards = context.destination?.knownHazards?.trim();

  return {
    id: String(dto.id),
    destinationId: dto.destination_id,
    destination: destinationName,
    startDate: dto.start_date,
    endDate: dto.end_date,
    createdAt: dto.created_at,
    language: dto.language,
    experienceLevel,
    activitiesCount,
    status: toTripStatus(dto.start_date, dto.end_date),

    currentTempC: Math.round(snapshot.temperatureC ?? 0),
    feelsLikeC: Math.round(snapshot.apparentC ?? snapshot.temperatureC ?? 0),
    rainChance: Math.round(snapshot.precipitationProbability ?? 0),
    windKph: Math.round(snapshot.windKmh ?? 0),
    visibility: toVisibilityLabel(snapshot.visibilityM),
    elevationM: Math.round(snapshot.elevationM ?? 0),
    weatherCondition: toWeatherCondition(snapshot.weatherCode),
    sevenDayOutlook: snapshot.daily.map(toWeatherDay),
    weatherStale: snapshot.stale,

    routeWarning: hazards
      ? { title: `Known hazards · ${destinationName}`, description: hazards }
      : undefined,
    routeSafety: {
      summary:
        advisoryDto?.safety_advisory_text?.trim() ||
        "Your AI safety advisory is still being generated. Refresh in a moment."
    },
    gearChecklist: toGearChecklist(advisoryDto),
    advisory: advisoryDto ? toTripAdvisory(advisoryDto) : null
  };
}

/* ------------------------------ trail reports ----------------------------- */

export function toTrailReport(dto: TrailReportDTO): TrailReport {
  return {
    id: String(dto.id),
    destinationId: dto.destination_id,
    placeId: dto.place_id ?? null,
    placeName: dto.place_name?.trim() || null,
    authorName: dto.author_name?.trim() || "Traveler",
    destination: dto.destination_name?.trim() || `Destination #${dto.destination_id}`,
    condition: dto.condition,
    description: dto.report_text,
    postedAt: dto.created_at,
    helpfulCount: dto.upvote_count
  };
}
