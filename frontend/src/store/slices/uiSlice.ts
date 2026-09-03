import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  authView: "login" | "register";
  cartOpen: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  authView: "login",
  cartOpen: false
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setAuthView(state, action: PayloadAction<"login" | "register">) {
      state.authView = action.payload;
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.cartOpen = action.payload;
    }
  }
});

export const { toggleSidebar, setAuthView, setCartOpen } = uiSlice.actions;
export default uiSlice.reducer;