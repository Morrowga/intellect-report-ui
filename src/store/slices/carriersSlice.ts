import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { PaginatedResponse } from "./clientsSlice";

export interface Carrier {
  id:          number;
  corridor:    string;
  name:        string;
  alliance:    string;
  on_time_pct: number;
  trend:       string;
  note:        string;
  source:      string;
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

export interface UploadResult {
  success:         boolean;
  upserted:        number;
  corridors:       number;
  alliances_found: string[];
  new_alliances:   string[];
  recorded_at:     string;
  detail:          string;
}

interface CarriersState {
  items:        Carrier[];
  total:        number;
  page:         number;
  limit:        number;
  pages:        number;
  loading:      boolean;
  error:        string | null;
  uploading:    boolean;
  uploadResult: UploadResult | null;
  uploadError:  string | null;
}

const initialState: CarriersState = {
  items:        [],
  total:        0,
  page:         1,
  limit:        20,
  pages:        1,
  loading:      false,
  error:        null,
  uploading:    false,
  uploadResult: null,
  uploadError:  null,
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

export const uploadCarrierExcel = createAsyncThunk(
  "carriers/uploadExcel",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/carriers/upload-excel", formData);
      return res.data as UploadResult;
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let msg = "Upload failed";
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI validation error — array of {msg, loc, type, input}
        msg = detail.map((e: any) => e.msg ?? String(e)).join(", ");
      } else if (detail) {
        msg = JSON.stringify(detail);
      }
      return rejectWithValue(msg);
    }
  }
);

const carriersSlice = createSlice({
  name: "carriers",
  initialState,
  reducers: {
    clearUploadResult(state) {
      state.uploadResult = null;
      state.uploadError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchCarriers ──────────────────────────────────────────────────────
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

      // ── upsertCarrier ──────────────────────────────────────────────────────
      .addCase(upsertCarrier.fulfilled, (state) => {
        state.total += 1;
      })

      // ── deleteCarrier ──────────────────────────────────────────────────────
      .addCase(deleteCarrier.fulfilled, (state, action) => {
        state.items  = state.items.filter((c) => c.id !== action.payload);
        state.total -= 1;
      })

      // ── uploadCarrierExcel ─────────────────────────────────────────────────
      .addCase(uploadCarrierExcel.pending, (state) => {
        state.uploading   = true;
        state.uploadError = null;
        state.uploadResult = null;
      })
      .addCase(uploadCarrierExcel.fulfilled, (state, action) => {
        state.uploading    = false;
        state.uploadResult = action.payload;
      })
      .addCase(uploadCarrierExcel.rejected, (state, action) => {
        state.uploading   = false;
        state.uploadError = action.payload as string;
      });
  },
});

export const { clearUploadResult } = carriersSlice.actions;
export default carriersSlice.reducer;