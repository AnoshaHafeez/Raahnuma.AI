import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import tripsReducer from "./slices/tripsSlice";
import gearReducer from "./slices/gearSlice";
import cartReducer from "./slices/cartSlice";
import communityReducer from "./slices/communitySlice";
import destinationsReducer from "./slices/destinationsSlice";
import sosReducer from "./slices/sosSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    trips: tripsReducer,
    destinations: destinationsReducer,
    gear: gearReducer,
    cart: cartReducer,
    community: communityReducer,
    sos: sosReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;