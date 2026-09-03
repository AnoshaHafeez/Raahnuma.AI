import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GearProduct } from "@/types/gear";
import { marketplaceApi, toErrorMessage } from "@/lib/api";
import { toGearProduct } from "@/lib/adapters";

interface GearState {
  products: GearProduct[];
  categoryFilter: string;
  searchQuery: string;
  wishlist: string[];
  status: "idle" | "loading" | "ready" | "failed";
  error: string | null;
}

const initialState: GearState = {
  products: [],
  categoryFilter: "All gear",
  searchQuery: "",
  wishlist: [],
  status: "idle",
  error: null,
};

export const fetchGearProducts = createAsyncThunk<GearProduct[], number | undefined, { rejectValue: string }>(
  "gear/fetchProducts",
  async (destinationId, { rejectWithValue }) => {
    try { return (await marketplaceApi.products(destinationId)).map(toGearProduct); }
    catch (error) { return rejectWithValue(toErrorMessage(error)); }
  }
);

export const fetchTripGearRecommendations = createAsyncThunk<GearProduct[], string, { rejectValue: string }>(
  "gear/fetchRecommendations",
  async (tripId, { rejectWithValue }) => {
    try { return (await marketplaceApi.recommendations(Number(tripId))).map(toGearProduct); }
    catch (error) { return rejectWithValue(toErrorMessage(error)); }
  }
);

const gearSlice = createSlice({
  name: "gear",
  initialState,
  reducers: {
    setCategoryFilter(state, action: PayloadAction<string>) {
      state.categoryFilter = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      state.wishlist = state.wishlist.includes(action.payload)
        ? state.wishlist.filter((id) => id !== action.payload)
        : [...state.wishlist, action.payload];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGearProducts.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchGearProducts.fulfilled, (state, action) => { state.status = "ready"; state.products = action.payload; })
      .addCase(fetchGearProducts.rejected, (state, action) => { state.status = "failed"; state.error = action.payload ?? "Could not load gear."; })
      .addCase(fetchTripGearRecommendations.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchTripGearRecommendations.fulfilled, (state, action) => { state.status = "ready"; state.products = action.payload; })
      .addCase(fetchTripGearRecommendations.rejected, (state, action) => { state.status = "failed"; state.error = action.payload ?? "Could not load trip recommendations."; });
  }
});

export const { setCategoryFilter, setSearchQuery, toggleWishlist } = gearSlice.actions;
export default gearSlice.reducer;
