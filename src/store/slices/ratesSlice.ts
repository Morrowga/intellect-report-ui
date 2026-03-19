import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { PaginatedResponse } from "./clientsSlice";

export interface Rate {
  id:             number;
  corridor:       string;
  rate:           number;
  currency:       string;
  container_type: string;
  source:         string;
  recorded_at:    string;
}

export interface RateCreate {
  corridor:       string;
  rate:           number;
  currency?:      string;
  container_type?: string;
  source?:        string;
  recorded_at?:   string;  // ISO string — optional, for backdating
}

interface RatesState {
  items:   Rate[];
  total:   number;
  page:    number;
  limit:   number;
  pages:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: RatesState = {
  items:   [],
  total:   0,
  page:    1,
  limit:   20,
  pages:   1,
  loading: false,
  error:   null,
};

export const fetchRates = createAsyncThunk(
  "rates/fetchAll",
  async ({ page = 1, limit = 20, corridor }: {
    page?: number; limit?: number; corridor?: string
  } = {}) => {
    const params: Record<string, unknown> = { page, limit };
    if (corridor) params.corridor = corridor;
    const res = await api.get("/rates", { params });
    return res.data as PaginatedResponse<Rate>;
  }
);

export const createRate = createAsyncThunk(
  "rates/create",
  async (payload: RateCreate) => {
    const res = await api.post("/rates", payload);
    return res.data as Rate;
  }
);

const ratesSlice = createSlice({
  name: "rates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRates.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchRates.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items;
        state.total   = action.payload.total;
        state.page    = action.payload.page;
        state.limit   = action.payload.limit;
        state.pages   = action.payload.pages;
      })
      .addCase(fetchRates.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message || "Failed to fetch rates";
      })
      .addCase(createRate.fulfilled, (state) => {
        state.total += 1;
      });
  },
});

export default ratesSlice.reducer;