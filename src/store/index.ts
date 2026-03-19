import { configureStore } from "@reduxjs/toolkit";
import clientsReducer  from "./slices/clientsSlice";
import ratesReducer    from "./slices/ratesSlice";
import carriersReducer from "./slices/carriersSlice";
import reportsReducer  from "./slices/reportsSlice";
import inquiryReducer  from "./slices/inquirySlice";
import paymentsReducer  from "./slices/paymentsSlice";

export const store = configureStore({
  reducer: {
    clients:  clientsReducer,
    rates:    ratesReducer,
    carriers: carriersReducer,
    reports:  reportsReducer,
    inquiry:  inquiryReducer,
    payments:  paymentsReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;