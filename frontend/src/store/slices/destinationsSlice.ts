import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { destinationsApi, toErrorMessage } from "@/lib/api";
import { toDestination } from "@/lib/adapters";
import type { Destination } from "@/types/destination";

interface DestinationsState {
  items: Destination[];
  status: "idle" | "loading" | "ready" | "failed";
  error: string | null;
}

const initialState: DestinationsState = { items: [], status: "idle", error: null };

/**
 * `GET /destinations` is public and effectively static, so this is fetched once
 * and reused by the trip form, the report modal, and the trip adapters.
 */
export const fetchDestinations = createAsyncThunk<
  Destination[],
  void,
  { rejectValue: string }
>("destinations/fetch", async (_, { rejectWithValue }) => {
  try {
    return (await destinationsApi.list()).map(toDestination);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

const destinationsSlice = createSlice({
  name: "destinations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDestinations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDestinations.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
      })
      .addCase(fetchDestinations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Could not load destinations.";
      });
  }
});

export default destinationsSlice.reducer;
