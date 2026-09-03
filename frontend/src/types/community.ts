/**
 * UI-facing community models (camelCase), mapped from `TrailReportDTO`
 * (GET /api/v1/trail-reports) by `toTrailReport()` in `lib/adapters.ts`.
 */

export type TrailCondition = "clear" | "caution" | "closed";

export interface TrailReport {
  /** Stringified server id. */
  id: string;
  /** Needed for the "same destination" links and for posting a follow-up report. */
  destinationId: number;
  /** Set when the report is about one specific attraction, not the whole valley. */
  placeId: number | null;
  /** Display name of that attraction, when `placeId` is set. */
  placeName: string | null;
  /** Server-side display label: full name, else email local part, else "Traveler". */
  authorName: string;
  destination: string;
  condition: TrailCondition;
  /** Maps to the server's `report_text`. */
  description: string;
  /** Maps to the server's `created_at`. */
  postedAt: string;
  /** Maps to the server's `upvote_count`. */
  helpfulCount: number;
}

export interface NewTrailReportPayload {
  destinationId: number;
  /** Optional: scopes the report to one attraction of the destination. */
  placeId?: number | null;
  condition: TrailCondition;
  description: string;
}
