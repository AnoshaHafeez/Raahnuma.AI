/**
 * UI-facing destination model (camelCase), mapped from `DestinationDTO`
 * (GET /api/v1/destinations) by `toDestination()` in `lib/adapters.ts`.
 */

export interface Destination {
  /** Numeric because request bodies (`destination_id`) need the raw server id. */
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  /** Free-form text; empty when the destination has no recorded hazards. */
  knownHazards: string;
}
