import { configureStore } from "@reduxjs/toolkit";
import clientsReducer  from "./slices/clientsSlice";
import ratesReducer    from "./slices/ratesSlice";
import carriersReducer from "./slices/carriersSlice";
import reportsReducer  from "./slices/reportsSlice";

export const store = configureStore({
  reducer: {
    clients:  clientsReducer,
    rates:    ratesReducer,
    carriers: carriersReducer,
    reports:  reportsReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;