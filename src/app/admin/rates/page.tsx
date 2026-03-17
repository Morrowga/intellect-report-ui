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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const CORRIDORS = ["ASIA_EUROPE", "ASIA_US"];
const CORRIDOR_LABELS: Record<string, string> = {
  ASIA_EUROPE: "Asia → Europe",
  ASIA_US:     "Asia → US",
};

const EMPTY_FORM = {
  corridor:       "ASIA_EUROPE",
  rate:           "",
  source:         "Freightos Baltic Index FBX11",
  currency:       "USD",
  container_type: "40ft",
};

const PAGE_LIMIT = 20;

export default function RatesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: rates, loading, error, page, pages, total } = useSelector(
    (s: RootState) => s.rates
  );

  const [open, setOpen]               = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [filterCorridor, setFilterCorridor] = useState<string>("ALL");

  function load(p: number) {
    dispatch(fetchRates({
      page:  p,
      limit: PAGE_LIMIT,
      corridor: filterCorridor === "ALL" ? undefined : filterCorridor,
    }));
  }

  useEffect(() => {
    load(1);
  }, [dispatch, filterCorridor]);

  // Auto-set source label based on corridor
  function handleCorridorChange(corridor: string) {
    setForm((f) => ({
      ...f,
      corridor,
      source: corridor === "ASIA_EUROPE"
        ? "Freightos Baltic Index FBX11"
        : "Freightos Baltic Index FBX01",
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

  // Compare consecutive rates for same corridor to show trend arrow
  function getTrend(index: number) {
    const current = rates[index];
    const next    = rates.slice(index + 1).find((r) => r.corridor === current.corridor);
    if (!next) return null;
    if (current.rate > next.rate) return "up";
    if (current.rate < next.rate) return "down";
    return "flat";
  }

  return (
    <div>
      <PageHeader
        title="Freight Rates"
        description="Update every Friday from Freightos Terminal (FBX11 / FBX01)"
        action={
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2"
          >
            <Plus size={14} />
            Add Rate
          </Button>
        }
      />

      {/* Corridor filter */}
      <div className="flex items-center gap-2 mb-4">
        {["ALL", ...CORRIDORS].map((key) => (
          <button
            key={key}
            onClick={() => setFilterCorridor(key)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium border transition-all
              ${filterCorridor === key
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }
            `}
          >
            {key === "ALL" ? "All Corridors" : CORRIDOR_LABELS[key]}
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
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Corridor
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Rate (USD / 40ft)
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Trend
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Source
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Recorded
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-400" size={20} />
                </TableCell>
              </TableRow>
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-zinc-400 text-sm">
                  No rates yet — add this Friday&apos;s rates
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate, index) => {
                const trend = getTrend(index);
                return (
                  <TableRow
                    key={rate.id}
                    className="border-[#1f1f1f] hover:bg-white/[0.02]"
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400 bg-transparent text-[10px]"
                      >
                        {CORRIDOR_LABELS[rate.corridor] ?? rate.corridor}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-zinc-100 font-medium">
                      ${rate.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {trend === "up" && (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <TrendingUp size={12} /> Rising
                        </span>
                      )}
                      {trend === "down" && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <TrendingDown size={12} /> Falling
                        </span>
                      )}
                      {trend === "flat" && (
                        <span className="flex items-center gap-1 text-zinc-500 text-xs">
                          <Minus size={12} /> Stable
                        </span>
                      )}
                      {trend === null && (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {rate.source}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm font-mono">
                      {new Date(rate.recorded_at).toLocaleDateString("en-US", {
                        year:  "numeric",
                        month: "short",
                        day:   "numeric",
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
        page={page}
        pages={pages}
        total={total}
        limit={PAGE_LIMIT}
        onPageChange={(p) => load(p)}
      />

      {/* Add Rate Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-[#1f1f1f] text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Freight Rate</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Corridor */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Corridor</Label>
              <Select
                value={form.corridor}
                onValueChange={handleCorridorChange}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a]">
                  {CORRIDORS.map((key) => (
                    <SelectItem key={key} value={key} className="text-zinc-300">
                      {CORRIDOR_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rate */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">
                Rate (USD / 40ft container)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 2883"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Source</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 text-sm"
              />
              <p className="text-[10px] text-zinc-400">
                From{" "}
                <a
                  href="https://terminal.freightos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-400 underline underline-offset-2"
                >
                  terminal.freightos.com
                </a>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 bg-dark">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-[#000]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
            >
              {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}