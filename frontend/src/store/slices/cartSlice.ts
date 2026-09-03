import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem, GearProduct } from "@/types/gear";

interface CartState {
  items: CartItem[];
  tripId: string | null;
}

const initialState: CartState = { items: [], tripId: null };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ product: GearProduct; mode: "rent" | "buy" }>) {
      const existing = state.items.find(
        (i) => i.product.id === action.payload.product.id && i.mode === action.payload.mode
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ product: action.payload.product, mode: action.payload.mode, quantity: 1, rentalDays: 1 });
      }
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; mode: "rent" | "buy" }>) {
      state.items = state.items.filter(
        (i) => !(i.product.id === action.payload.productId && i.mode === action.payload.mode)
      );
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; mode: "rent" | "buy"; quantity: number }>) {
      const item = state.items.find((i) => i.product.id === action.payload.productId && i.mode === action.payload.mode);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
    },
    updateRentalDays(state, action: PayloadAction<{ productId: string; mode: "rent" | "buy"; rentalDays: number }>) {
      const item = state.items.find((i) => i.product.id === action.payload.productId && i.mode === action.payload.mode);
      if (item && item.mode === "rent") item.rentalDays = Math.min(60, Math.max(1, action.payload.rentalDays));
    },
    setCartTripId(state, action: PayloadAction<string | null>) { state.tripId = action.payload; },
    clearCart(state) {
      state.items = [];
      state.tripId = null;
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, updateRentalDays, setCartTripId, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
