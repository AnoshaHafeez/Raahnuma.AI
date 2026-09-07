/**
 * Wire-format DTOs — these mirror the FastAPI Pydantic schemas in
 * `backend/app/schemas/` exactly (snake_case, integer ids, ISO date strings).
 *
 * Never render these directly. Convert them into the camelCase view models in
 * `src/types/*` with the helpers in `src/lib/adapters.ts`, so a backend field
 * rename surfaces as a single compile error here instead of silent `undefined`
 * across the UI.
 */

export type LanguageCode = "en" | "ur";
export type ExperienceLevel = "beginner" | "intermediate" | "expert";
export type TrailCondition = "clear" | "caution" | "closed";

/* ---------------------------------- auth ---------------------------------- */

export interface UserDTO {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: LanguageCode;
  experience_level: ExperienceLevel;
  is_admin: boolean;
  created_at: string;
}

export interface TokenDTO {
  access_token: string;
  token_type: string;
  /** Lifetime in seconds, as reported by the server. */
  expires_in: number;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  full_name?: string | null;
  phone?: string | null;
  preferred_language?: LanguageCode;
  experience_level?: ExperienceLevel;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface UserUpdateRequestDTO {
  full_name?: string;
  phone?: string;
  preferred_language?: LanguageCode;
  experience_level?: ExperienceLevel;
}

export interface PasswordChangeRequestDTO {
  current_password: string;
  new_password: string;
}

/* ------------------------------ destinations ------------------------------ */

export interface DestinationDTO {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  known_hazards: string;
}

/* --------------------------------- weather -------------------------------- */

export interface DailyForecastDTO {
  /** ISO date, e.g. "2026-08-30". */
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  weather_code: number;
  precipitation_probability: number | null;
}

export interface WeatherSnapshotDTO {
  temperature_c: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  weather_code: number;
  apparent_temperature_c: number | null;
  relative_humidity: number | null;
  precipitation_probability: number | null;
  visibility_m: number | null;
  elevation_m: number | null;
  daily: DailyForecastDTO[];
  /** True when the API was unreachable and a cached snapshot was replayed. */
  stale: boolean;
  raw: Record<string, unknown>;
}

export interface WeatherResponseDTO {
  destination_id: number;
  destination_name: string;
  weather: WeatherSnapshotDTO;
}

/* ---------------------------------- trips --------------------------------- */

export interface AdvisoryDTO {
  id: number;
  packing_list: string[];
  gear_checklist: string[];
  safety_advisory_text: string;
  safety_advisory_text_ur: string;
  confidence: string;
  source_weather_snapshot: Partial<WeatherSnapshotDTO> & Record<string, unknown>;
  generated_at: string;
  disclaimer: string;
}

export interface TripDTO {
  id: number;
  user_id: number;
  destination_id: number;
  /** ISO date (no time component). */
  start_date: string;
  end_date: string;
  traveler_profile: Record<string, unknown>;
  language: string;
  status?: string;
  created_at: string;
  latest_advisory: AdvisoryDTO | null;
}

export interface TripCreateRequestDTO {
  destination_id: number;
  start_date: string;
  end_date: string;
  traveler_profile?: Record<string, unknown>;
  language?: string;
}

export interface OfflinePackDTO {
  trip: TripDTO;
  advisory: AdvisoryDTO | null;
  vendors: VendorDTO[];
}

/* --------------------------------- vendors -------------------------------- */

export interface VendorDTO {
  id: number;
  destination_id: number;
  name: string;
  /** Free-form on the server; "gear_rental" and "guide" are the seeded values. */
  type: string;
  contact_phone: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  last_verified_on: string | null;
  is_active: boolean;
}

export interface PlaceDTO {
  id: number;
  destination_id: number;
  name: string;
  description: string;
  activity_tags: string[];
  latitude: number | null;
  longitude: number | null;
  community_rating: number | null;
  review_count: number;
  community_review: string;
  image_url: string;
  /** 1 = the destination's most visited attraction; null when unranked. */
  popularity_rank: number | null;
}

/** One entry of the AI top-picks shortlist, with the signals behind it. */
export interface PlacePickDTO {
  place_id: number;
  name: string;
  description: string;
  activity_tags: string[];
  popularity_rank: number | null;
  community_rating: number | null;
  review_count: number;
  recent_mentions: number;
  reason: string;
}

export interface PlaceRecommendationDTO {
  destination_id: number;
  destination_name: string;
  /** "heuristic" means the AI providers were unavailable and curated data was used. */
  source: "ai" | "heuristic";
  summary: string;
  picks: PlacePickDTO[];
  generated_at: string;
}

/** A place on a trip's visit checklist. */
export interface TripPlaceDTO {
  id: number;
  trip_id: number;
  place_id: number;
  name: string;
  description: string;
  activity_tags: string[];
  popularity_rank: number | null;
  visited: boolean;
  visited_at: string | null;
  sort_order: number;
}

export interface ProductDTO {
  id: number;
  name: string;
  category: string;
  rent_price_per_day: number;
  buy_price: number;
  rating: number | null;
  image_url: string;
  use_tags: string[];
  stock_quantity: number;
  vendor_id: number;
  vendor_name: string;
  vendor_location: string;
  destination_id: number;
  destination_name: string;
  recommended_for?: string[];
  reason?: string;
}

export interface OrderCreateRequestDTO {
  recipient_name: string;
  phone: string;
  delivery_address: string;
  payment_method: "cod";
  trip_id?: number;
  items: Array<{ product_id: number; mode: "rent" | "buy"; quantity: number; rental_days: number }>;
}

export interface OrderDTO {
  id: number;
  total_amount: number;
  status: string;
  payment_method: string;
}

/* ----------------------------------- sos ---------------------------------- */

export interface EmergencyContactDTO {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
}

export interface EmergencyContactCreateRequestDTO {
  name: string;
  phone_number: string;
}

export interface SOSCreateRequestDTO {
  latitude: number;
  longitude: number;
  trip_id?: number | null;
  message?: string | null;
}

export interface SOSResponseDTO {
  sos_event_id: number;
  contacts: EmergencyContactDTO[];
  prefilled_message: string;
  maps_link: string;
}

/* ------------------------------ trail reports ----------------------------- */

export interface TrailReportDTO {
  id: number;
  destination_id: number;
  place_id: number | null;
  user_id: number;
  report_text: string;
  condition: TrailCondition;
  upvote_count: number;
  created_at: string;
  author_name: string | null;
  destination_name: string | null;
  place_name: string | null;
}

export interface TrailReportCreateRequestDTO {
  destination_id: number;
  /** Scope the report to one attraction of the destination. */
  place_id?: number | null;
  report_text: string;
  condition: TrailCondition;
}
