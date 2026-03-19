// store/slices/inquirySlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8087";
const API_KEY  = process.env.NEXT_PUBLIC_API_KEY  || "dev-key-change-me";

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Inquiry {
  id:           number;
  company_name: string;
  email:        string;
  status:       string;
  created_at:   string;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

// Public — landing page form (no API key)
export const submitInquiry = createAsyncThunk(
  "inquiry/submit",
  async (payload: { company_name: string; email: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Admin — fetch paginated list
export const fetchInquiries = createAsyncThunk(
  "inquiry/fetchAll",
  async (params: { page: number; limit: number; status?: string }, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams({
        page:  String(params.page),
        limit: String(params.limit),
        ...(params.status ? { status: params.status } : {}),
      });
      const res = await fetch(`${API_BASE}/inquiries?${q}`, { headers: AUTH_HEADERS });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Admin — update status
export const updateInquiryStatus = createAsyncThunk(
  "inquiry/updateStatus",
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/inquiries/${id}?status=${status}`, {
        method: "PUT",
        headers: AUTH_HEADERS,
      });
      if (!res.ok) throw new Error("Failed to update");
      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── State ────────────────────────────────────────────────────────────────────
interface InquiryState {
  // landing page form
  status: "idle" | "loading" | "success" | "error";
  error:  string | null;
  // admin list
  items:       Inquiry[];
  listLoading: boolean;
  listError:   string | null;
  page:        number;
  pages:       number;
  total:       number;
}

const initialState: InquiryState = {
  status: "idle",
  error:  null,
  items:       [],
  listLoading: false,
  listError:   null,
  page:  1,
  pages: 1,
  total: 0,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const inquirySlice = createSlice({
  name: "inquiry",
  initialState,
  reducers: {
    resetInquiry: (state) => { state.status = "idle"; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // submit
      .addCase(submitInquiry.pending,   (state) => { state.status = "loading"; state.error = null; })
      .addCase(submitInquiry.fulfilled, (state) => { state.status = "success"; })
      .addCase(submitInquiry.rejected,  (state, action) => {
        state.status = "error";
        state.error  = action.payload as string;
      })
      // fetch list
      .addCase(fetchInquiries.pending,   (state) => { state.listLoading = true;  state.listError = null; })
      .addCase(fetchInquiries.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items  = action.payload.items;
        state.page   = action.payload.page;
        state.pages  = action.payload.pages;
        state.total  = action.payload.total;
      })
      .addCase(fetchInquiries.rejected,  (state, action) => {
        state.listLoading = false;
        state.listError   = action.payload as string;
      })
      // update status — optimistic update in list
      .addCase(updateInquiryStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx].status = action.payload.status;
      });
  },
});

export const { resetInquiry } = inquirySlice.actions;
export default inquirySlice.reducer;