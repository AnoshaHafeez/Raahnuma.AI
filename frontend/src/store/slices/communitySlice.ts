import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { toErrorMessage, trailReportsApi } from "@/lib/api";
import { toTrailReport } from "@/lib/adapters";
import type { NewTrailReportPayload, TrailReport } from "@/types/community";

interface CommunityState {
  reports: TrailReport[];
  status: "idle" | "loading" | "ready" | "failed";
  submitting: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  reports: [],
  status: "idle",
  submitting: false,
  error: null
};

/** `GET /trail-reports` is public, so the feed renders before login. */
export const fetchReports = createAsyncThunk<TrailReport[], void, { rejectValue: string }>(
  "community/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return (await trailReportsApi.listRecent()).map(toTrailReport);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const submitReport = createAsyncThunk<
  TrailReport,
  NewTrailReportPayload,
  { rejectValue: string }
>("community/submit", async (payload, { rejectWithValue }) => {
  try {
    const created = await trailReportsApi.create({
      destination_id: payload.destinationId,
      place_id: payload.placeId ?? null,
      report_text: payload.description.trim(),
      condition: payload.condition
    });
    return toTrailReport(created);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

/**
 * The server owns the counter and returns the updated report, so the reducer
 * takes its number rather than incrementing locally.
 */
export const upvoteReport = createAsyncThunk<TrailReport, string, { rejectValue: string }>(
  "community/upvote",
  async (reportId, { rejectWithValue }) => {
    try {
      return toTrailReport(await trailReportsApi.upvote(Number(reportId)));
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = "ready";
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Could not load trail reports.";
      })
      .addCase(submitReport.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        state.submitting = false;
        state.reports.unshift(action.payload);
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload ?? "Could not publish your report.";
      })
      .addCase(upvoteReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index >= 0) state.reports[index] = action.payload;
      });
  }
});

export default communitySlice.reducer;
