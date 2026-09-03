import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { destinationsApi, toErrorMessage, tripsApi, weatherApi } from "@/lib/api";
import { toDestination, toTrip } from "@/lib/adapters";
import type { WeatherSnapshotDTO } from "@/types/api";
import type { Destination } from "@/types/destination";
import type { ExperienceLevel } from "@/types/user";
import type { Trip } from "@/types/trip";

interface TripsState {
  trips: Trip[];
  activeTripId: string | null;
  status: "idle" | "loading" | "ready" | "failed";
  creating: boolean;
  error: string | null;
}

const initialState: TripsState = {
  trips: [],
  activeTripId: null,
  status: "idle",
  creating: false,
  error: null
};

export interface NewTripInput {
  destinationId: number;
  startDate: string;
  endDate: string;
  groupSize: number;
  experienceLevel: ExperienceLevel;
  selectedPlaceIds: number[];
}

/**
 * Live weather for the destinations that appear in the trip list.
 *
 * Weather is enrichment, not the trip itself: a failure here falls back to the
 * snapshot embedded in the advisory rather than failing the whole page.
 */
async function loadWeather(
  destinationIds: number[]
): Promise<Map<number, WeatherSnapshotDTO | null>> {
  const entries = await Promise.all(
    destinationIds.map(async (id) => {
      try {
        return [id, (await weatherApi.forDestination(id)).weather] as const;
      } catch {
        return [id, null] as const;
      }
    })
  );
  return new Map(entries);
}

/** A trip only carries `destination_id`, so destinations are needed for names. */
async function buildTrips(dtos: Awaited<ReturnType<typeof tripsApi.list>>): Promise<Trip[]> {
  const destinations = (await destinationsApi.list()).map(toDestination);
  const byId = new Map<number, Destination>(destinations.map((d) => [d.id, d]));
  const weather = await loadWeather(
    Array.from(new Set(dtos.map((dto) => dto.destination_id)))
  );

  return dtos.map((dto) =>
    toTrip(dto, {
      destination: byId.get(dto.destination_id),
      weather: weather.get(dto.destination_id) ?? null
    })
  );
}

export const fetchTrips = createAsyncThunk<Trip[], void, { rejectValue: string }>(
  "trips/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await buildTrips(await tripsApi.list());
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/**
 * `POST /trips` returns before the advisory exists — the server generates it in
 * a background task — so the created trip is re-fetched once to pick it up.
 */
export const createTrip = createAsyncThunk<Trip, NewTripInput, { rejectValue: string }>(
  "trips/create",
  async (input, { rejectWithValue }) => {
    try {
      const created = await tripsApi.create({
        destination_id: input.destinationId,
        start_date: input.startDate,
        end_date: input.endDate,
        traveler_profile: {
          experience_level: input.experienceLevel,
          group_size: input.groupSize,
          selected_place_ids: input.selectedPlaceIds,
        }
      });

      // Give the background advisory task a moment, then take the richer copy.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const refreshed = await tripsApi.get(created.id).catch(() => created);

      const [trip] = await buildTrips([refreshed]);
      return trip;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** Forces a fresh LLM advisory for one trip and folds the result back in. */
export const regenerateAdvisory = createAsyncThunk<Trip, string, { rejectValue: string }>(
  "trips/regenerateAdvisory",
  async (tripId, { rejectWithValue }) => {
    try {
      const numericId = Number(tripId);
      await tripsApi.regenerateAdvisory(numericId);
      const [trip] = await buildTrips([await tripsApi.get(numericId)]);
      return trip;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

function upsert(state: TripsState, trip: Trip) {
  const index = state.trips.findIndex((t) => t.id === trip.id);
  if (index >= 0) {
    // Preserve the user's local tick marks, which the server does not store.
    const checked = new Set(
      state.trips[index].gearChecklist.filter((g) => g.checked).map((g) => g.id)
    );
    state.trips[index] = {
      ...trip,
      gearChecklist: trip.gearChecklist.map((g) => ({ ...g, checked: checked.has(g.id) }))
    };
  } else {
    state.trips.unshift(trip);
  }
}

const tripsSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    setActiveTrip(state, action: PayloadAction<string>) {
      state.activeTripId = action.payload;
    },
    /** Client-only: the server stores the generated list, not per-item state. */
    toggleGearItem(state, action: PayloadAction<{ tripId: string; itemId: string }>) {
      const trip = state.trips.find((t) => t.id === action.payload.tripId);
      const item = trip?.gearChecklist.find((g) => g.id === action.payload.itemId);
      if (item) item.checked = !item.checked;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.status = "ready";
        state.trips = action.payload;
        state.activeTripId = action.payload[0]?.id ?? null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Could not load your trips.";
      })
      .addCase(createTrip.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.creating = false;
        upsert(state, action.payload);
        state.activeTripId = action.payload.id;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Could not create your trip.";
      })
      .addCase(regenerateAdvisory.fulfilled, (state, action) => {
        upsert(state, action.payload);
      });
  }
});

export const { setActiveTrip, toggleGearItem } = tripsSlice.actions;
export default tripsSlice.reducer;
