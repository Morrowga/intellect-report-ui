import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { PaginatedResponse } from "./clientsSlice";

export interface Report {
  id: number;
  client_id: string;
  report_date: string;
  corridor: string;
  pdf_path: string;
  tokens_used: number;
  delivered_at: string | null;
  status: string;
}

interface ReportsState {
  items:   Report[];
  total:   number;
  page:    number;
  limit:   number;
  pages:   number;
  loading: boolean;
  error:   string | null;
}

const initialState: ReportsState = {
  items:   [],
  total:   0,
  page:    1,
  limit:   20,
  pages:   1,
  loading: false,
  error:   null,
};

export const fetchReports = createAsyncThunk(
  "reports/fetchAll",
  async ({
    page = 1,
    limit = 20,
    client_id,
    corridor,
    status,
  }: {
    page?:      number;
    limit?:     number;
    client_id?: string;
    corridor?:  string;
    status?:    string;
  } = {}) => {
    const params: Record<string, unknown> = { page, limit };
    if (client_id) params.client_id = client_id;
    if (corridor)  params.corridor  = corridor;
    if (status)    params.status    = status;
    const res = await api.get("/reports", { params });
    return res.data as PaginatedResponse<Report>;
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload.items;
        state.total   = action.payload.total;
        state.page    = action.payload.page;
        state.limit   = action.payload.limit;
        state.pages   = action.payload.pages;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message || "Failed to fetch reports";
      });
  },
});

export default reportsSlice.reducer;