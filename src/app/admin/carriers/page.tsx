"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchCarriers,
  upsertCarrier,
  deleteCarrier,
  Carrier,
  CarrierUpsert,
} from "@/store/slices/carriersSlice";
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
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const CORRIDORS = ["ASIA_EUROPE", "ASIA_US"];
const CORRIDOR_LABELS: Record<string, string> = {
  ASIA_EUROPE: "Asia → Europe",
  ASIA_US:     "Asia → US",
};

const TREND_OPTIONS = ["IMPROVING", "STABLE", "DECLINING"];

const EMPTY_FORM: CarrierUpsert = {
  corridor:    "ASIA_EUROPE",
  name:        "",
  alliance:    "",
  on_time_pct: 0,
  trend:       "STABLE",
  note:        "",
  source:      "Sea-Intelligence",
};

const PAGE_LIMIT = 20;

export default function CarriersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: carriers, loading, error, page, pages, total } = useSelector(
    (s: RootState) => s.carriers
  );

  const [open, setOpen]                   = useState(false);
  const [form, setForm]                   = useState<CarrierUpsert>(EMPTY_FORM);
  const [submitting, setSubmitting]       = useState(false);
  const [filterCorridor, setFilterCorridor] = useState("ALL");

  function load(p: number) {
    dispatch(fetchCarriers({
      page:     p,
      limit:    PAGE_LIMIT,
      corridor: filterCorridor === "ALL" ? undefined : filterCorridor,
    }));
  }

  useEffect(() => {
    load(1);
  }, [dispatch, filterCorridor]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.alliance || !form.note) {
      toast.error("Name, alliance and note are required");
      return;
    }
    if (form.on_time_pct < 0 || form.on_time_pct > 100) {
      toast.error("On-time % must be between 0 and 100");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(upsertCarrier(form)).unwrap();
      toast.success(`Carrier record saved for ${CORRIDOR_LABELS[form.corridor]}`);
      setOpen(false);
      setForm(EMPTY_FORM);
      load(1);
    } catch {
      toast.error("Failed to save carrier");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(carrier: Carrier) {
    if (!confirm(`Delete ${carrier.name} record from ${new Date(carrier.recorded_at).toLocaleDateString()}?`))
      return;
    try {
      await dispatch(deleteCarrier(carrier.id)).unwrap();
      toast.success("Carrier record deleted");
      load(page);
    } catch {
      toast.error("Failed to delete carrier");
    }
  }

  function TrendBadge({ trend }: { trend: string }) {
    if (trend === "IMPROVING")
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs">
          <TrendingUp size={12} /> Improving
        </span>
      );
    if (trend === "DECLINING")
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs">
          <TrendingDown size={12} /> Declining
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-zinc-500 text-xs">
        <Minus size={12} /> Stable
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Carrier Reliability"
        description="Update monthly from Sea-Intelligence press releases"
        action={
          <Button
            onClick={openAdd}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2"
          >
            <Plus size={14} />
            Add Carrier
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
                Carrier
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Corridor
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                On-Time %
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Trend
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Note
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">
                Updated
              </TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-400" size={20} />
                </TableCell>
              </TableRow>
            ) : carriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400 text-sm">
                  No carrier data — add this month's reliability scores
                </TableCell>
              </TableRow>
            ) : (
              carriers.map((carrier) => (
                <TableRow
                  key={carrier.id}
                  className="border-[#1f1f1f] hover:bg-white/[0.02]"
                >
                  <TableCell>
                    <div>
                      <p className="text-zinc-100 font-medium text-sm">{carrier.name}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">{carrier.alliance}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-zinc-400 bg-transparent text-[10px]"
                    >
                      {CORRIDOR_LABELS[carrier.corridor] ?? carrier.corridor}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            carrier.on_time_pct >= 70
                              ? "bg-emerald-500"
                              : carrier.on_time_pct >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${carrier.on_time_pct}%` }}
                        />
                      </div>
                      <span className="text-zinc-100 text-sm font-mono">
                        {carrier.on_time_pct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TrendBadge trend={carrier.trend} />
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">
                    {carrier.note}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {new Date(carrier.recorded_at).toLocaleDateString("en-US", {
                      year:  "numeric",
                      month: "short",
                      day:   "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/5"
                      onClick={() => handleDelete(carrier)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Add Carrier Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-[#1f1f1f] text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Carrier Record</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Corridor */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Corridor</Label>
              <Select
                value={form.corridor}
                onValueChange={(v) => setForm({ ...form, corridor: v })}
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

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Carrier Name</Label>
              <Input
                placeholder="e.g. Maersk (Gemini)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              />
            </div>

            {/* Alliance */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Alliance</Label>
              <Input
                placeholder="e.g. Gemini Cooperation"
                value={form.alliance}
                onChange={(e) => setForm({ ...form, alliance: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              />
            </div>

            {/* On-time % */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">
                On-Time % (0–100)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 73"
                value={form.on_time_pct || ""}
                onChange={(e) =>
                  setForm({ ...form, on_time_pct: parseInt(e.target.value) || 0 })
                }
                className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              />
            </div>

            {/* Trend */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Trend</Label>
              <Select
                value={form.trend}
                onValueChange={(v) => setForm({ ...form, trend: v })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#2a2a2a]">
                  {TREND_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-zinc-300">
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Note</Label>
              <Input
                placeholder="e.g. Hub-and-spoke network, highest reliability"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
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
                  href="https://sea-intelligence.com/press-room"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-400 underline underline-offset-2"
                >
                  sea-intelligence.com/press-room
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
              Save Carrier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}