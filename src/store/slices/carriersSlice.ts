import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { PaginatedResponse } from "./clientsSlice";

export interface Carrier {
  id: number;
  corridor: string;
  name: string;
  alliance: string;
  on_time_pct: number;
  trend: string;
  note: string;
  source: string;
  recorded_at: string;
}

export interface CarrierUpsert {
  corridor:    string;
  name:        string;
  alliance:    string;
  on_time_pct: number;
  trend:       string;
  note:        string;
  source?:     string;
}

interface CarriersState {
  items:   Carrier[];
  total:   number;
  page:    number;
  limit:   number;
  pages:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: CarriersState = {
  items:   [],
  total:   0,
  page:    1,
  limit:   20,
  pages:   1,
  loading: false,
  error:   null,
};

export const fetchCarriers = createAsyncThunk(
  "carriers/fetchAll",
  async ({ page = 1, limit = 20, corridor }: { page?: number; limit?: number; corridor?: string } = {}) => {
    const params: Record<string, unknown> = { page, limit };
    if (corridor) params.corridor = corridor;
    const res = await api.get("/carriers", { params });
    return res.data as PaginatedResponse<Carrier>;
  }
);

export const upsertCarrier = createAsyncThunk(
  "carriers/upsert",
  async (payload: CarrierUpsert) => {
    const res = await api.put("/carriers", payload);
    return res.data as Carrier;
  }
);

export const deleteCarrier = createAsyncThunk(
  "carriers/delete",
  async (id: number) => {
    await api.delete(`/carriers/${id}`);
    return id;
  }
);

const carriersSlice = createSlice({
  name: "carriers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarriers.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchCarriers.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items;
        state.total   = action.payload.total;
        state.page    = action.payload.page;
        state.limit   = action.payload.limit;
        state.pages   = action.payload.pages;
      })
      .addCase(fetchCarriers.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message || "Failed to fetch carriers";
      })
      .addCase(upsertCarrier.fulfilled, (state) => {
        state.total += 1;
      })
      .addCase(deleteCarrier.fulfilled, (state, action) => {
        state.items  = state.items.filter((c) => c.id !== action.payload);
        state.total -= 1;
      });
  },
});

export default carriersSlice.reducer;