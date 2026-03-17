"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Users, FileText, Bell, Play, Loader2, RefreshCw,
  TrendingUp, ArrowRight, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

interface ApiSource {
  name:   string;
  status: "CONNECTED" | "ERROR" | "TIMEOUT" | "UNREACHABLE";
  code:   number | null;
}

interface Stats {
  clients:  { active: number; inactive: number };
  reports:  { this_week: number; delivered_week: number; failed_week: number; last_run: string | null; last_run_status: string | null };
  alerts:   { this_week: number };
  latest_rates:   { corridor: string; rate: number; recorded_at: string }[];
  recent_reports: { id: number; client_id: string; corridor: string; report_date: string; status: string; delivered_at: string | null }[];
}

interface SourceHealth {
  sources:   ApiSource[];
  connected: number;
  total:     number;
  healthy:   boolean;
}

const CORRIDOR_LABELS: Record<string, string> = {
  ASIA_EUROPE:  "Asia → Europe",
  ASIA_US:      "Asia → US West",
  ASIA_US_EAST: "Asia → US East",
  ASIA_AU:      "Asia → Australia",
  ASIA_ME:      "Asia → Middle East",
  EUROPE_US:    "Europe → US",
  ASIA_SEA:     "Asia → SE Asia",
  ASIA_INDIA:   "Asia → India",
};

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 flex items-start justify-between
      ${accent ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d0d0d] border-[#1f1f1f]"}`}>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-semibold font-mono ${accent ? "text-emerald-400" : "text-zinc-100"}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-md ${accent ? "bg-emerald-500/10" : "bg-white/5"}`}>
        <Icon size={16} className={accent ? "text-emerald-400" : "text-zinc-500"} />
      </div>
    </div>
  );
}

function SourceStatusDot({ status }: { status: string }) {
  if (status === "CONNECTED")
    return <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] shrink-0" />;
  if (status === "ERROR")
    return <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
}

function SourceStatusBadge({ status }: { status: string }) {
  if (status === "CONNECTED")
    return <span className="text-xs font-mono text-emerald-500">CONNECTED</span>;
  if (status === "ERROR")
    return <span className="text-xs font-mono text-yellow-500">ERROR</span>;
  if (status === "TIMEOUT")
    return <span className="text-xs font-mono text-orange-500">TIMEOUT</span>;
  return <span className="text-xs font-mono text-red-500">UNREACHABLE</span>;
}

export default function DashboardPage() {
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [sourceHealth,  setSourceHealth]  = useState<SourceHealth | null>(null);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingSources,setLoadingSources]= useState(true);
  const [running,       setRunning]       = useState(false);
  const [jobId,         setJobId]         = useState<string | null>(null);
  const [jobStatus,     setJobStatus]     = useState<string | null>(null);

  const CACHE_KEY     = "source_health_cache";
  const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 minutes

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch { toast.error("Failed to load dashboard stats"); }
    finally { setLoadingStats(false); }
  }

  async function loadSources(force = false) {
    // Check cache unless forced
    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            setSourceHealth(data);
            setLoadingSources(false);
            return;
          }
        }
      } catch {}
    }

    setLoadingSources(true);
    try {
      const res = await api.get("/health/sources");
      setSourceHealth(res.data);
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: res.data,
        timestamp: Date.now(),
      }));
    } catch { toast.error("Failed to check API sources"); }
    finally { setLoadingSources(false); }
  }

  useEffect(() => {
    loadStats();
    loadSources(); // uses cache if available
  }, []);

  // Poll pipeline job
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pipeline/status/${jobId}`);
        const s = res.data.status;
        setJobStatus(s);
        if (s === "completed") {
          toast.success("Pipeline completed");
          setRunning(false); loadStats(); clearInterval(interval);
        } else if (s === "failed") {
          toast.error(`Pipeline failed: ${res.data.error || "unknown"}`);
          setRunning(false); clearInterval(interval);
        }
      } catch { clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  async function handleRunPipeline() {
    if (!confirm("Run pipeline for all active clients?")) return;
    setRunning(true); setJobStatus("queued");
    try {
      const res = await api.post("/pipeline/run", { environment: "development" });
      setJobId(res.data.job_id);
      toast.success(`Pipeline started — ${res.data.client_count} client(s) queued`);
    } catch { toast.error("Failed to start pipeline"); setRunning(false); }
  }

  if (loadingStats) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-zinc-600" size={24} />
    </div>
  );

  if (!stats) return null;

  const liveCount    = sourceHealth?.connected ?? 0;
  const totalSources = sourceHealth?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="System overview and quick actions"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"
              className="h-8 w-8 text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
              onClick={() => { loadStats(); loadSources(true); }}>
              <RefreshCw size={13} />
            </Button>
            <Button onClick={handleRunPipeline} disabled={running} size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2">
              {running ? (
                <><Loader2 size={14} className="animate-spin" />
                  {jobStatus === "queued" && "Queued..."}
                  {jobStatus === "running" && "Running..."}</>
              ) : <><Play size={14} /> Run Pipeline</>}
            </Button>
          </div>
        }
      />

      {running && (
        <div className="mb-6 px-4 py-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Pipeline {jobStatus} — checking every 3 seconds...
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Clients" value={stats.clients.active}
          sub={`${stats.clients.inactive} inactive`} icon={Users} accent />
        <StatCard label="Reports This Week" value={stats.reports.this_week}
          sub={`${stats.reports.delivered_week} delivered · ${stats.reports.failed_week} failed`}
          icon={FileText} />
        <StatCard label="Alerts This Week" value={stats.alerts.this_week}
          sub="Disruption + tariff alerts" icon={Bell} />
        <StatCard
          label="API Sources"
          value={totalSources > 0 ? `${liveCount}/${totalSources}` : "—"}
          sub={sourceHealth?.healthy ? "All connected" : "Some sources unreachable"}
          icon={TrendingUp}
          accent={sourceHealth?.healthy ?? false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Live API source health */}
        <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-300">API Source Health</h2>
            <button
              onClick={() => loadSources(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <RefreshCw size={12} className={loadingSources ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingSources ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-zinc-600" size={16} />
            </div>
          ) : sourceHealth ? (
            <div className="space-y-3">
              {sourceHealth.sources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SourceStatusDot status={source.status} />
                    <span className="text-sm text-zinc-400">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SourceStatusBadge status={source.status} />
                    {source.code && (
                      <span className="text-[10px] text-zinc-700 font-mono">{source.code}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Could not reach health endpoint</p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Latest rates */}
          <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-zinc-300">Latest Freight Rates</h2>
              <Link href="/rates"
                className="text-xs text-zinc-600 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                Update <ArrowRight size={11} />
              </Link>
            </div>
            {stats.latest_rates.length === 0 ? (
              <p className="text-sm text-zinc-600">No rates in DB yet</p>
            ) : (
              <div className="space-y-3">
                {stats.latest_rates.map((r) => (
                  <div key={r.corridor} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{CORRIDOR_LABELS[r.corridor] ?? r.corridor}</span>
                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold text-zinc-100">
                        ${r.rate.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-zinc-700 font-mono">
                        {new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last pipeline run */}
          <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-3">Last Pipeline Run</h2>
            {stats.reports.last_run ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stats.reports.last_run_status === "delivered"
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : stats.reports.last_run_status === "failed"
                    ? <XCircle size={14} className="text-red-400" />
                    : <AlertCircle size={14} className="text-yellow-400" />
                  }
                  <span className="text-sm text-zinc-500 font-mono">
                    {new Date(stats.reports.last_run).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>
                <Badge variant="outline" className={stats.reports.last_run_status === "delivered"
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px]"
                  : "border-red-500/30 text-red-400 bg-red-500/5 text-[10px]"}>
                  {stats.reports.last_run_status}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No pipeline runs yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-300">Recent Reports</h2>
          <Link href="/reports"
            className="text-xs text-zinc-600 hover:text-emerald-400 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {stats.recent_reports.length === 0 ? (
          <p className="text-sm text-zinc-600">No reports yet — run the pipeline to generate the first report</p>
        ) : (
          <div className="space-y-2">
            {stats.recent_reports.map((r) => (
              <div key={r.id}
                className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-300 font-mono">{r.client_id}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">{CORRIDOR_LABELS[r.corridor] ?? r.corridor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 font-mono">
                    {new Date(r.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <Badge variant="outline" className={r.status === "delivered"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px]"
                    : "border-red-500/30 text-red-400 bg-red-500/5 text-[10px]"}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}