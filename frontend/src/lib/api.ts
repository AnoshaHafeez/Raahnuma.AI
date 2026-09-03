/**
 * Typed HTTP client for the Raahnuma.AI FastAPI backend.
 *
 * Everything the UI sends or receives goes through `request()`, which owns the
 * cross-cutting concerns: base URL, JSON encoding, the `Authorization` header,
 * FastAPI error-shape parsing, timeouts, and 401 handling.
 *
 * Functions here return raw DTOs (see `src/types/api.ts`). Use the mappers in
 * `src/lib/adapters.ts` to turn them into the camelCase view models the
 * components render.
 */

import { clearSession, getAccessToken } from "@/lib/auth";
import type {
  AdvisoryDTO,
  DestinationDTO,
  EmergencyContactCreateRequestDTO,
  EmergencyContactDTO,
  LoginRequestDTO,
  OfflinePackDTO,
  PasswordChangeRequestDTO,
  RegisterRequestDTO,
  SOSCreateRequestDTO,
  SOSResponseDTO,
  TokenDTO,
  TrailReportCreateRequestDTO,
  TrailReportDTO,
  TripCreateRequestDTO,
  TripDTO,
  UserDTO,
  UserUpdateRequestDTO,
  VendorDTO,
  PlaceDTO,
  PlaceRecommendationDTO,
  TripPlaceDTO,
  ProductDTO,
  OrderCreateRequestDTO,
  OrderDTO,
  WeatherResponseDTO,
} from "@/types/api";

/** Origin of the FastAPI server, without a trailing slash. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

/** Every versioned route lives under this prefix (see `app.include_router` in main.py). */
const API_PREFIX = "/api/v1";

const DEFAULT_TIMEOUT_MS = 20_000;
/** Advisory generation calls an LLM, so it needs a longer ceiling. */
const LONG_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  /** True when the request failed before reaching the server. */
  get isNetworkError() {
    return this.status === 0;
  }
}

/* --------------------------- 401 handling --------------------------- */

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Register what should happen when the server rejects our token.
 *
 * Wired up in `AuthContext` so this module never has to import the Redux store
 * (which would create a cycle: store -> thunks -> api -> store).
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function handleUnauthorized() {
  clearSession();
  unauthorizedHandler?.();
}

/* ----------------------------- error parsing ----------------------------- */

/**
 * Turn a FastAPI error body into a single human-readable string.
 *
 * FastAPI uses `{"detail": "..."}` for raised HTTPExceptions and
 * `{"detail": [{loc, msg, ...}]}` for 422 validation failures.
 */
function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (payload && typeof payload === "object") {
    const detail = (payload as { detail?: unknown }).detail;

    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const { loc, msg } = item as { loc?: unknown[]; msg?: string };
          if (!msg) return null;
          // Drop the leading "body"/"query" segment — it is noise for a user.
          const field = Array.isArray(loc) ? loc.slice(1).join(".") : "";
          return field ? `${field}: ${msg}` : msg;
        })
        .filter(Boolean);
      if (messages.length) return messages.join("; ");
    }
  }
  return fallback;
}

/* -------------------------------- request -------------------------------- */

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Attach the bearer token. Defaults to true. */
  auth?: boolean;
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${API_PREFIX}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      // Fail fast on a missing/expired token instead of a guaranteed 401 round trip.
      handleUnauthorized();
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Abort on timeout, while still honouring a caller-supplied signal.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener("abort", onCallerAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (error) {
    if (signal?.aborted) throw error; // caller cancelled deliberately
    if (controller.signal.aborted) {
      throw new ApiError(0, "The request timed out. Please check your connection.");
    }
    throw new ApiError(
      0,
      `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`,
      error
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  // 204 No Content (change-password, delete contact) has no body to parse.
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    if (!response.ok) {
      throw new ApiError(response.status, `Request failed (${response.status}).`);
    }
    return undefined as T;
  }

  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(payload, `Request failed (${response.status}).`),
      payload
    );
  }

  return payload as T;
}

/* ---------------------------------- auth ---------------------------------- */

export const authApi = {
  /** POST /api/v1/auth/register */
  register: (payload: RegisterRequestDTO) =>
    request<UserDTO>("/auth/register", { method: "POST", body: payload, auth: false }),

  /** POST /api/v1/auth/login */
  login: (payload: LoginRequestDTO) =>
    request<TokenDTO>("/auth/login", { method: "POST", body: payload, auth: false }),

  /**
   * GET /api/v1/auth/me
   *
   * `token` is accepted explicitly because this is called immediately after
   * login, before the session has been persisted to localStorage.
   */
  me: async (token?: string): Promise<UserDTO> => {
    if (!token) return request<UserDTO>("/auth/me");

    const response = await fetch(buildUrl("/auth/me"), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      credentials: "omit",
    }).catch((error) => {
      throw new ApiError(0, `Cannot reach the server at ${API_BASE_URL}.`, error);
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        extractMessage(payload, "Could not load your profile."),
        payload
      );
    }
    return (await response.json()) as UserDTO;
  },

  /** PATCH /api/v1/auth/me */
  updateMe: (payload: UserUpdateRequestDTO) =>
    request<UserDTO>("/auth/me", { method: "PATCH", body: payload }),

  /** POST /api/v1/auth/change-password — 204 on success. */
  changePassword: (payload: PasswordChangeRequestDTO) =>
    request<void>("/auth/change-password", { method: "POST", body: payload }),
};

/* ------------------------------ destinations ------------------------------ */

export const destinationsApi = {
  /** GET /api/v1/destinations — public. */
  list: () => request<DestinationDTO[]>("/destinations", { auth: false }),

  /** GET /api/v1/destinations/{id} — public. */
  get: (destinationId: number) =>
    request<DestinationDTO>(`/destinations/${destinationId}`, { auth: false }),

  /** GET /api/v1/destinations/{id}/vendors — public. */
  vendors: (destinationId: number) =>
    request<VendorDTO[]>(`/destinations/${destinationId}/vendors`, { auth: false }),
};

export const marketplaceApi = {
  places: (destinationId: number) => request<PlaceDTO[]>(`/destinations/${destinationId}/places`, { auth: false }),
  products: (destinationId?: number) => request<ProductDTO[]>("/marketplace/products", { auth: false, query: { destination_id: destinationId } }),
  recommendations: (tripId: number) => request<ProductDTO[]>(`/trips/${tripId}/gear-recommendations`),
  placeOrder: (payload: OrderCreateRequestDTO) => request<OrderDTO>("/orders", { method: "POST", body: payload }),
};

/* ---------------------------- places & checklist --------------------------- */

export const placesApi = {
  /** GET /api/v1/destinations/{id}/places — every catalogued area, most visited first. */
  list: (destinationId: number) =>
    request<PlaceDTO[]>(`/destinations/${destinationId}/places`, { auth: false }),

  /**
   * GET /api/v1/destinations/{id}/place-recommendations — AI top picks.
   *
   * Uses the long timeout: this hits an LLM. The server degrades to a heuristic
   * ranking (`source: "heuristic"`) rather than failing, so callers never need a
   * fallback of their own.
   */
  recommendations: (destinationId: number, limit = 5) =>
    request<PlaceRecommendationDTO>(`/destinations/${destinationId}/place-recommendations`, {
      auth: false,
      query: { limit },
      timeoutMs: LONG_TIMEOUT_MS,
    }),

  /** GET /api/v1/trips/{id}/places — the trip's visit checklist. */
  forTrip: (tripId: number) => request<TripPlaceDTO[]>(`/trips/${tripId}/places`),

  /** PUT /api/v1/trips/{id}/places — replace the checklist, keeping ticked state. */
  setForTrip: (tripId: number, placeIds: number[]) =>
    request<TripPlaceDTO[]>(`/trips/${tripId}/places`, {
      method: "PUT",
      body: { place_ids: placeIds },
    }),

  /** PATCH /api/v1/trips/{tripId}/places/{placeId} — tick a place off. */
  setVisited: (tripId: number, placeId: number, visited: boolean) =>
    request<TripPlaceDTO>(`/trips/${tripId}/places/${placeId}`, {
      method: "PATCH",
      body: { visited },
    }),

  /** DELETE /api/v1/trips/{tripId}/places/{placeId} — drop a place from the trip. */
  removeFromTrip: (tripId: number, placeId: number) =>
    request<void>(`/trips/${tripId}/places/${placeId}`, { method: "DELETE" }),
};

/* --------------------------------- weather -------------------------------- */

export const weatherApi = {
  /** GET /api/v1/weather/{destination_id} — public. */
  forDestination: (destinationId: number) =>
    request<WeatherResponseDTO>(`/weather/${destinationId}`, { auth: false }),
};

/* ---------------------------------- trips --------------------------------- */

export const tripsApi = {
  /** GET /api/v1/trips */
  list: () => request<TripDTO[]>("/trips"),

  /** GET /api/v1/trips/{id} */
  get: (tripId: number) => request<TripDTO>(`/trips/${tripId}`),

  /**
   * POST /api/v1/trips
   *
   * Returns immediately with `latest_advisory: null`; the server generates the
   * advisory in a background task, so re-fetch the trip to pick it up.
   */
  create: (payload: TripCreateRequestDTO) =>
    request<TripDTO>("/trips", { method: "POST", body: payload }),

  /** POST /api/v1/trips/{id}/regenerate-advisory — synchronous LLM call, returns the advisory. */
  regenerateAdvisory: (tripId: number) =>
    request<AdvisoryDTO>(`/trips/${tripId}/regenerate-advisory`, {
      method: "POST",
      timeoutMs: LONG_TIMEOUT_MS,
    }),

  /** GET /api/v1/trips/{id}/offline-pack */
  offlinePack: (tripId: number) => request<OfflinePackDTO>(`/trips/${tripId}/offline-pack`),
};

/* ----------------------------------- sos ---------------------------------- */

export const sosApi = {
  /** POST /api/v1/sos — persists the event and returns a share-ready payload. */
  trigger: (payload: SOSCreateRequestDTO) =>
    request<SOSResponseDTO>("/sos", { method: "POST", body: payload }),

  /** GET /api/v1/emergency-contacts */
  listContacts: () => request<EmergencyContactDTO[]>("/emergency-contacts"),

  /** POST /api/v1/emergency-contacts */
  addContact: (payload: EmergencyContactCreateRequestDTO) =>
    request<EmergencyContactDTO>("/emergency-contacts", { method: "POST", body: payload }),

  /** DELETE /api/v1/emergency-contacts/{id} — 204 on success. */
  deleteContact: (contactId: number) =>
    request<void>(`/emergency-contacts/${contactId}`, { method: "DELETE" }),
};

/* ------------------------------ trail reports ----------------------------- */

export const trailReportsApi = {
  /** GET /api/v1/trail-reports — public global feed. */
  listRecent: (limit = 50) =>
    request<TrailReportDTO[]>("/trail-reports", { auth: false, query: { limit } }),

  /** GET /api/v1/destinations/{id}/trail-reports — public. */
  listForDestination: (destinationId: number) =>
    request<TrailReportDTO[]>(`/destinations/${destinationId}/trail-reports`, {
      auth: false,
    }),

  /** POST /api/v1/trail-reports */
  create: (payload: TrailReportCreateRequestDTO) =>
    request<TrailReportDTO>("/trail-reports", { method: "POST", body: payload }),

  /** POST /api/v1/trail-reports/{id}/upvote */
  upvote: (reportId: number) =>
    request<TrailReportDTO>(`/trail-reports/${reportId}/upvote`, { method: "POST" }),
};

/* --------------------------------- health --------------------------------- */

/** GET /health — note this one sits outside the /api/v1 prefix. */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

/** Human-readable message for any thrown value, for use in toasts. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
