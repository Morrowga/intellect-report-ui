"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchReports } from "@/store/slices/reportsSlice";
import { fetchClients } from "@/store/slices/clientsSlice";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Play, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";

const ALL_CORRIDORS = [
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
  "ASIA_AU",
  "ASIA_ME",
  "ASIA_SEA",
  "ASIA_INDIA",
];

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

const STATUS_OPTIONS = ["delivered", "failed"];
const PAGE_LIMIT = 20;

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: reports, loading, error, page, pages, total } = useSelector(
    (s: RootState) => s.reports
  );
  const { items: clients } = useSelector((s: RootState) => s.clients);

  const [filterClient,   setFilterClient]   = useState("ALL");
  const [filterCorridor, setFilterCorridor] = useState("ALL");
  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [running,        setRunning]        = useState(false);
  const [jobId,          setJobId]          = useState<string | null>(null);
  const [jobStatus,      setJobStatus]      = useState<string | null>(null);

  function load(p: number) {
    dispatch(fetchReports({
      page:      p,
      limit:     PAGE_LIMIT,
      client_id: filterClient   === "ALL" ? undefined : filterClient,
      corridor:  filterCorridor === "ALL" ? undefined : filterCorridor,
      status:    filterStatus   === "ALL" ? undefined : filterStatus,
    }));
  }

  useEffect(() => {
    load(1);
    if (clients.length === 0) dispatch(fetchClients({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => { load(1); }, [filterClient, filterCorridor, filterStatus]);

  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pipeline/status/${jobId}`);
        const s   = res.data.status;
        setJobStatus(s);
        if (s === "completed") {
          toast.success("Pipeline completed — reports generated");
          setRunning(false);
          load(1);
          clearInterval(interval);
        } else if (s === "failed") {
          toast.error(`Pipeline failed: ${res.data.error || "unknown error"}`);
          setRunning(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Server restarted — job lost from memory, treat as completed
          toast.info("Pipeline finished (server restarted during run)");
          setRunning(false);
          setJobStatus("completed");
          load(1);
        }
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function handleRunPipeline() {
    if (!confirm("Run pipeline for all active clients? This will generate and send reports."))
      return;
    setRunning(true);
    setJobStatus("queued");
    try {
      const res = await api.post("/pipeline/run", {});
      setJobId(res.data.job_id);
      toast.success(`Pipeline started — ${res.data.client_count} client(s) queued`);
    } catch {
      toast.error("Failed to start pipeline");
      setRunning(false);
    }
  }

  async function handleDownload(reportId: number, clientId: string, date: string) {
    try {
      const res  = await api.get(`/reports/${reportId}/download`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href      = url;
      link.download  = `report_${clientId}_${date}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  }

  function StatusBadge({ status }: { status: string }) {
    return (
      <Badge variant="outline" className={
        status === "delivered"
          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px]"
          : "border-red-500/30 text-red-400 bg-red-500/5 text-[10px]"
      }>
        {status}
      </Badge>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Report history and pipeline management"
        action={
          <Button onClick={handleRunPipeline} disabled={running} size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2">
            {running ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {jobStatus === "queued"  && "Queued..."}
                {jobStatus === "running" && "Running..."}
              </>
            ) : (
              <><Play size={14} /> Run Pipeline</>
            )}
          </Button>
        }
      />

      {running && (
        <div className="mb-4 px-4 py-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Pipeline {jobStatus} — checking every 3 seconds...
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-44 bg-transparent border-[#2a2a2a] text-zinc-400 text-xs h-8">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="ALL" className="text-zinc-300 text-xs">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-zinc-300 text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCorridor} onValueChange={setFilterCorridor}>
          <SelectTrigger className="w-56 bg-transparent border-[#2a2a2a] text-zinc-400 text-xs h-8">
            <SelectValue placeholder="All Corridors" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a] max-h-72">
            <SelectItem value="ALL" className="text-zinc-300 text-xs">All Corridors</SelectItem>
            {ALL_CORRIDORS.map((key) => (
              <SelectItem key={key} value={key} className="text-zinc-300 text-xs">
                {CORRIDOR_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-transparent border-[#2a2a2a] text-zinc-400 text-xs h-8">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="ALL" className="text-zinc-300 text-xs">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-zinc-300 text-xs">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-300"
          onClick={() => load(page)}>
          <RefreshCw size={13} />
        </Button>
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
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Client</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Corridor</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Report Date</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Delivered</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Tokens</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-400" size={20} />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400 text-sm">
                  No reports yet — run the pipeline to generate the first report
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                  <TableCell className="text-zinc-300 text-sm font-mono">{report.client_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline"
                      className="border-zinc-700 text-zinc-400 bg-transparent text-[10px]">
                      {CORRIDOR_LABELS[report.corridor] ?? report.corridor}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm font-mono">
                    {new Date(report.report_date).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {report.delivered_at
                      ? new Date(report.delivered_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {report.tokens_used?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell><StatusBadge status={report.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5"
                      onClick={() => handleDownload(report.id, report.client_id, report.report_date.slice(0, 10))}>
                      <Download size={13} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pages={pages} total={total} limit={PAGE_LIMIT}
        onPageChange={(p) => load(p)} />
    </div>
  );
}