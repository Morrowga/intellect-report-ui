import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

export interface Client {
  id: string;
  name: string;
  email: string;
  industry: string;
  segments: string[];
  contract_rate: number | null;
  report_frequency: string;
  active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ClientsState {
  items:   Client[];
  total:   number;
  page:    number;
  limit:   number;
  pages:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: ClientsState = {
  items:   [],
  total:   0,
  page:    1,
  limit:   20,
  pages:   1,
  loading: false,
  error:   null,
};

export const fetchClients = createAsyncThunk(
  "clients/fetchAll",
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const res = await api.get("/clients", { params: { page, limit } });
    return res.data as PaginatedResponse<Client>;
  }
);

export const createClient = createAsyncThunk(
  "clients/create",
  async (payload: Omit<Client, "created_at">) => {
    const res = await api.post("/clients", payload);
    return res.data as Client;
  }
);

export const updateClient = createAsyncThunk(
  "clients/update",
  async ({ id, data }: { id: string; data: Partial<Client> }) => {
    const res = await api.put(`/clients/${id}`, data);
    return res.data as Client;
  }
);

export const deactivateClient = createAsyncThunk(
  "clients/deactivate",
  async (id: string) => {
    await api.delete(`/clients/${id}`);
    return id;
  }
);

const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items;
        state.total   = action.payload.total;
        state.page    = action.payload.page;
        state.limit   = action.payload.limit;
        state.pages   = action.payload.pages;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message || "Failed to fetch clients";
      })
      .addCase(createClient.fulfilled, (state) => {
        state.total += 1;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deactivateClient.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload);
        if (idx !== -1) state.items[idx].active = false;
      });
  },
});

export default clientsSlice.reducer;