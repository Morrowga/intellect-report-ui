import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { PaginatedResponse } from "./clientsSlice";

export interface Payment {
  id:                     number;
  client_id:              string | null;
  event_type:             string;
  amount:                 number | null;
  currency:               string | null;
  plan:                   string | null;
  status:                 string;
  description:            string | null;
  stripe_invoice_id:      string | null;
  stripe_subscription_id: string | null;
  created_at:             string;
}

export interface SubscriptionSession {
  client_id:       string;
  plan:            string;
  checkout_url:    string;
  client_secret:   string;
  subscription_id: string;
}

interface PaymentsState {
  items:   Payment[];
  total:   number;
  page:    number;
  limit:   number;
  pages:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: PaymentsState = {
  items:   [],
  total:   0,
  page:    1,
  limit:   50,
  pages:   1,
  loading: false,
  error:   null,
};

export const fetchPayments = createAsyncThunk(
  "payments/fetchAll",
  async ({ page = 1, limit = 50, client_id }: {
    page?: number; limit?: number; client_id?: string
  } = {}) => {
    const params: Record<string, unknown> = { page, limit };
    if (client_id) params.client_id = client_id;
    const res = await api.get("/payments", { params });
    return res.data as PaginatedResponse<Payment>;
  }
);

export const createSubscription = createAsyncThunk(
  "payments/createSubscription",
  async (payload: { client_id: string; plan: string }) => {
    const res = await api.post("/payments/create-subscription", payload);
    return res.data as SubscriptionSession;
  }
);

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items;
        state.total   = action.payload.total;
        state.page    = action.payload.page;
        state.limit   = action.payload.limit;
        state.pages   = action.payload.pages;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message || "Failed to fetch payments";
      });
  },
});

export default paymentsSlice.reducer;