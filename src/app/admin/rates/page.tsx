"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchRates, createRate } from "@/store/slices/ratesSlice";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ---------------------------------------------------------------------------
// All 16 corridors — 12 FBX (free) + 4 manual
// ---------------------------------------------------------------------------
const CORRIDORS_FBX = [
  "ASIA_NORTHEUROPE",
  "NORTHEUROPE_ASIA",
  "ASIA_MED",
  "MED_ASIA",
  "ASIA_NAWEST",
  "NAWEST_ASIA",
  "ASIA_NAEAST",
  "NAEAST_ASIA",
  "NAEAST_NORTHEUROPE",
  "NORTHEUROPE_NAEAST",
  "EUROPE_SA_EAST",
  "EUROPE_SA_WEST",
];

const CORRIDORS_MANUAL = [
  "ASIA_AU",
  "ASIA_ME",
  "ASIA_SEA",
  "ASIA_INDIA",
];

const ALL_CORRIDORS = [...CORRIDORS_FBX, ...CORRIDORS_MANUAL];

const CORRIDOR_LABELS: Record<string, string> = {
  ASIA_NORTHEUROPE:    "China/East Asia → North Europe",
  NORTHEUROPE_ASIA:    "North Europe → China/East Asia",
  ASIA_MED:            "China/East Asia → Mediterranean",
  MED_ASIA:            "Mediterranean → China/East Asia",
  ASIA_NAWEST:         "China/East Asia → NA West Coast",
  NAWEST_ASIA:         "NA West Coast → China/East Asia",
  ASIA_NAEAST:         "China/East Asia → NA East Coast",
  NAEAST_ASIA:         "NA East Coast → China/East Asia",
  NAEAST_NORTHEUROPE:  "NA East Coast → North Europe",
  NORTHEUROPE_NAEAST:  "North Europe → NA East Coast",
  EUROPE_SA_EAST:      "Europe → SA East Coast",
  EUROPE_SA_WEST:      "Europe → SA West Coast",
  ASIA_AU:             "Asia → Australia",
  ASIA_ME:             "Asia → Middle East",
  ASIA_SEA:            "Asia → SE Asia",
  ASIA_INDIA:          "Asia → India",
};

const CORRIDOR_FBX: Record<string, string> = {
  ASIA_NORTHEUROPE:    "FBX11",
  NORTHEUROPE_ASIA:    "FBX12",
  ASIA_MED:            "FBX13",
  MED_ASIA:            "FBX14",
  ASIA_NAWEST:         "FBX01",
  NAWEST_ASIA:         "FBX02",
  ASIA_NAEAST:         "FBX03",
  NAEAST_ASIA:         "FBX04",
  NAEAST_NORTHEUROPE:  "FBX21",
  NORTHEUROPE_NAEAST:  "FBX22",
  EUROPE_SA_EAST:      "FBX24",
  EUROPE_SA_WEST:      "FBX26",
  ASIA_AU:             "Manual",
  ASIA_ME:             "Manual",
  ASIA_SEA:            "Manual",
  ASIA_INDIA:          "Manual",
};

const EMPTY_FORM = {
  corridor:       "ASIA_NAWEST",
  rate:           "",
  source:         "Freightos Baltic Index FBX01",
  currency:       "USD",
  container_type: "40ft",
  recorded_at:    "",
};

const PAGE_LIMIT = 20;

export default function RatesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: rates, loading, error, page, pages, total } = useSelector(
    (s: RootState) => s.rates
  );

  const [open, setOpen]                     = useState(false);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [submitting, setSubmitting]         = useState(false);
  const [filterCorridor, setFilterCorridor] = useState<string>("ALL");

  const isCorridorKey = ALL_CORRIDORS.includes(filterCorridor);

  function load(p: number) {
    dispatch(fetchRates({
      page:     p,
      limit:    PAGE_LIMIT,
      corridor: isCorridorKey ? filterCorridor : undefined,
    }));
  }

  useEffect(() => { load(1); }, [dispatch, filterCorridor]);

  const displayedRates = filterCorridor === "FBX"
    ? rates.filter(r => CORRIDORS_FBX.includes(r.corridor))
    : filterCorridor === "MANUAL"
    ? rates.filter(r => CORRIDORS_MANUAL.includes(r.corridor))
    : rates;

  function handleCorridorChange(corridor: string) {
    const fbx    = CORRIDOR_FBX[corridor] || "";
    const isManual = CORRIDORS_MANUAL.includes(corridor);
    setForm((f) => ({
      ...f,
      corridor,
      source: isManual
        ? "Manual — forwarder quote / xeneta.com"
        : fbx ? `Freightos Baltic Index ${fbx}` : f.source,
    }));
  }

  async function handleSubmit() {
    if (!form.rate || isNaN(parseFloat(form.rate))) {
      toast.error("Please enter a valid rate");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createRate({
        corridor:       form.corridor,
        rate:           parseFloat(form.rate),
        source:         form.source,
        currency:       form.currency,
        container_type: form.container_type,
        ...(form.recorded_at ? { recorded_at: new Date(form.recorded_at).toISOString() } : {}),
      })).unwrap();
      toast.success(`Rate recorded for ${CORRIDOR_LABELS[form.corridor]}`);
      setOpen(false);
      setForm(EMPTY_FORM);
      load(1);
    } catch {
      toast.error("Failed to save rate");
    } finally {
      setSubmitting(false);
    }
  }

  function getTrend(index: number) {
    const current = rates[index];
    const next    = rates.slice(index + 1).find((r) => r.corridor === current.corridor);
    if (!next) return null;
    if (current.rate > next.rate) return "up";
    if (current.rate < next.rate) return "down";
    return "flat";
  }

  function isManualCorridor(corridor: string) {
    return CORRIDORS_MANUAL.includes(corridor);
  }

  return (
    <div>
      <PageHeader
        title="Freight Rates"
        description="FBX corridors: update every Friday from terminal.freightos.com · Manual corridors: xeneta.com"
        action={
          <Button onClick={() => setOpen(true)} size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2">
            <Plus size={14} />
            Add Rate
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["ALL", "FBX", "MANUAL"].map((group) => (
          <button key={group}
            onClick={() => setFilterCorridor(group)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium border transition-all
              ${filterCorridor === group
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }
            `}
          >
            {group === "ALL" ? "All Corridors" : group === "FBX" ? "FBX (12)" : "Manual (4)"}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
        {ALL_CORRIDORS.map((key) => (
          <button key={key}
            onClick={() => setFilterCorridor(key)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium border transition-all
              ${filterCorridor === key
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }
            `}
          >
            {CORRIDOR_FBX[key] !== "Manual"
              ? CORRIDOR_FBX[key]
              : CORRIDOR_LABELS[key]
            }
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-[#1f1f1f] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1f1f1f] hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Corridor</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Index</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Rate (USD / 40ft)</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Trend</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Source</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Recorded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-400" size={20} />
                </TableCell>
              </TableRow>
            ) : displayedRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-zinc-400 text-sm">
                  No rates yet — add this Friday&apos;s rates
                </TableCell>
              </TableRow>
            ) : (
              displayedRates.map((rate, index) => {
                const trend  = getTrend(index);
                const fbx    = CORRIDOR_FBX[rate.corridor];
                const manual = isManualCorridor(rate.corridor);
                return (
                  <TableRow key={rate.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                    <TableCell>
                      <p className="text-zinc-200 text-sm">
                        {CORRIDOR_LABELS[rate.corridor] ?? rate.corridor}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${
                        manual
                          ? "border-zinc-700 text-zinc-600 bg-transparent"
                          : "border-blue-500/30 text-blue-400 bg-blue-500/5"
                      }`}>
                        {fbx ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-zinc-100 font-medium">
                      ${rate.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {trend === "up"   && <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingUp size={12} /> Rising</span>}
                      {trend === "down" && <span className="flex items-center gap-1 text-emerald-400 text-xs"><TrendingDown size={12} /> Falling</span>}
                      {trend === "flat" && <span className="flex items-center gap-1 text-zinc-500 text-xs"><Minus size={12} /> Stable</span>}
                      {trend === null   && <span className="text-zinc-700 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">{rate.source}</TableCell>
                    <TableCell className="text-zinc-500 text-sm font-mono">
                      {new Date(rate.recorded_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page} pages={pages} total={total} limit={PAGE_LIMIT}
        onPageChange={(p) => load(p)}
      />

      {/* Add Rate Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-[#1f1f1f] text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Freight Rate</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Corridor</Label>
              <Select value={form.corridor} onValueChange={handleCorridorChange}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a] max-h-72">
                  <div className="px-2 py-1 text-[10px] text-zinc-600 uppercase tracking-wider">
                    FBX — Freightos Terminal (free)
                  </div>
                  {CORRIDORS_FBX.map((key) => (
                    <SelectItem key={key} value={key} className="text-zinc-300">
                      <div className="flex items-center justify-between gap-6 w-full">
                        <span className="text-sm">{CORRIDOR_LABELS[key]}</span>
                        <span className="text-zinc-500 text-xs font-mono">{CORRIDOR_FBX[key]}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 mt-1 text-[10px] text-zinc-600 uppercase tracking-wider border-t border-[#2a2a2a]">
                    Manual — xeneta.com or forwarder quote
                  </div>
                  {CORRIDORS_MANUAL.map((key) => (
                    <SelectItem key={key} value={key} className="text-zinc-300">
                      <div className="flex items-center justify-between gap-6 w-full">
                        <span className="text-sm">{CORRIDOR_LABELS[key]}</span>
                        <span className="text-zinc-600 text-xs">Manual</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Rate (USD / 40ft container)</Label>
              <Input type="number" placeholder="e.g. 2883"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">
                Date <span className="text-zinc-600">(leave empty for today)</span>
              </Label>
              <Input type="date"
                value={form.recorded_at}
                onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 text-sm"
              />
              <p className="text-[10px] text-zinc-600">
                Use this to backdate last week&apos;s rate for WoW comparison
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Source</Label>
              <Input value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 text-sm"
              />
              <p className="text-[10px] text-zinc-600">
                FBX:{" "}
                <a href="https://terminal.freightos.com" target="_blank" rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-400 underline underline-offset-2">
                  terminal.freightos.com
                </a>
                {" · "}Manual:{" "}
                <a href="https://www.xeneta.com" target="_blank" rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-400 underline underline-offset-2">
                  xeneta.com
                </a>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}