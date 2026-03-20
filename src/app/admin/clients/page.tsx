"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchClients, createClient, updateClient, toggleClientActive,
  runEmergencyPipeline, Client,
} from "@/store/slices/clientsSlice";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Power, PowerOff, Loader2, Zap } from "lucide-react";
import api from "@/lib/api";

// ---------------------------------------------------------------------------
// Corridors
// ---------------------------------------------------------------------------
const CORRIDORS_FBX = [
  "ASIA_NORTHEUROPE", "NORTHEUROPE_ASIA",
  "ASIA_MED",         "MED_ASIA",
  "ASIA_NAWEST",      "NAWEST_ASIA",
  "ASIA_NAEAST",      "NAEAST_ASIA",
  "NAEAST_NORTHEUROPE", "NORTHEUROPE_NAEAST",
  "EUROPE_SA_EAST",   "EUROPE_SA_WEST",
];

const CORRIDORS_MANUAL = ["ASIA_AU", "ASIA_ME", "ASIA_SEA", "ASIA_INDIA"];

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
  ASIA_NORTHEUROPE: "FBX11", NORTHEUROPE_ASIA: "FBX12",
  ASIA_MED: "FBX13",         MED_ASIA: "FBX14",
  ASIA_NAWEST: "FBX01",      NAWEST_ASIA: "FBX02",
  ASIA_NAEAST: "FBX03",      NAEAST_ASIA: "FBX04",
  NAEAST_NORTHEUROPE: "FBX21", NORTHEUROPE_NAEAST: "FBX22",
  EUROPE_SA_EAST: "FBX24",   EUROPE_SA_WEST: "FBX26",
  ASIA_AU: "Manual", ASIA_ME: "Manual", ASIA_SEA: "Manual", ASIA_INDIA: "Manual",
};

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const TIMEZONES = [
  { value: "Asia/Singapore",      label: "Singapore (UTC+8)"      },
  { value: "Asia/Shanghai",       label: "Shanghai (UTC+8)"       },
  { value: "Asia/Tokyo",          label: "Tokyo (UTC+9)"          },
  { value: "Asia/Bangkok",        label: "Bangkok (UTC+7)"        },
  { value: "Asia/Dubai",          label: "Dubai (UTC+4)"          },
  { value: "Asia/Kolkata",        label: "Mumbai (UTC+5:30)"      },
  { value: "Asia/Seoul",          label: "Seoul (UTC+9)"          },
  { value: "Asia/Hong_Kong",      label: "Hong Kong (UTC+8)"      },
  { value: "Asia/Kuala_Lumpur",   label: "Kuala Lumpur (UTC+8)"   },
  { value: "Europe/London",       label: "London (UTC+0/+1)"      },
  { value: "Europe/Amsterdam",    label: "Amsterdam (UTC+1/+2)"   },
  { value: "Europe/Berlin",       label: "Berlin (UTC+1/+2)"      },
  { value: "Europe/Paris",        label: "Paris (UTC+1/+2)"       },
  { value: "Europe/Madrid",       label: "Madrid (UTC+1/+2)"      },
  { value: "America/New_York",    label: "New York (UTC-5/-4)"    },
  { value: "America/Chicago",     label: "Chicago (UTC-6/-5)"     },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "America/Sao_Paulo",   label: "São Paulo (UTC-3)"      },
  { value: "Australia/Sydney",    label: "Sydney (UTC+10/+11)"    },
  { value: "Pacific/Auckland",    label: "Auckland (UTC+12/+13)"  },
  { value: "UTC",                 label: "UTC"                    },
];

const EMPTY_FORM = {
  id: "", name: "", email: "", industry: "supply_chain",
  segments: [] as string[], contract_rate: "",
  report_frequency: "weekly", active: true,
  timezone: "UTC", send_day: "monday", send_time: "09:00",
};

type FormState = typeof EMPTY_FORM;
const PAGE_LIMIT = 20;

// ---------------------------------------------------------------------------
// Emergency job state
// ---------------------------------------------------------------------------
interface EmergencyJob {
  jobId:      string;
  clientId:   string;
  clientName: string;
  status:     "queued" | "running" | "completed" | "failed";
  error?:     string;
}

export default function ClientsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: clients, loading, error, page, pages, total } = useSelector(
    (s: RootState) => s.clients
  );

  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState<Client | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [emergencyJob, setEmergencyJob] = useState<EmergencyJob | null>(null);

  function load(p: number) { dispatch(fetchClients({ page: p, limit: PAGE_LIMIT })); }
  useEffect(() => { load(1); }, [dispatch]);

  // ── Poll emergency job status ──────────────────────────────────────────
  useEffect(() => {
    if (!emergencyJob) return;
    if (emergencyJob.status === "completed" || emergencyJob.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pipeline/status/${emergencyJob.jobId}`);
        const s: EmergencyJob["status"] = res.data.status;
        setEmergencyJob((prev) => prev ? { ...prev, status: s } : null);

        if (s === "completed") {
          toast.success(`Emergency report sent to ${emergencyJob.clientName}`);
          clearInterval(interval);
        } else if (s === "failed") {
          toast.error(`Emergency pipeline failed: ${res.data.error || "unknown"}`);
          setEmergencyJob((prev) => prev ? { ...prev, error: res.data.error } : null);
          clearInterval(interval);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          toast.info("Emergency pipeline finished (server restarted during run)");
          setEmergencyJob((prev) => prev ? { ...prev, status: "completed" } : null);
        }
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [emergencyJob?.jobId, emergencyJob?.status]);

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setOpen(true); }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      id:               client.id,
      name:             client.name,
      email:            client.email,
      industry:         client.industry,
      segments:         client.segments,
      contract_rate:    client.contract_rate?.toString() ?? "",
      report_frequency: client.report_frequency,
      active:           client.active,
      timezone:         client.timezone  || "UTC",
      send_day:         client.send_day  || "monday",
      send_time:        client.send_time || "09:00",
    });
    setOpen(true);
  }

  function toggleCorridor(key: string) {
    setForm((f) => ({
      ...f,
      segments: f.segments.includes(key)
        ? f.segments.filter((s) => s !== key)
        : [...f.segments, key],
    }));
  }

  async function handleSubmit() {
    if (!form.id || !form.name || !form.email || form.segments.length === 0) {
      toast.error("ID, name, email and at least one corridor are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        id:               form.id.trim(),
        name:             form.name.trim(),
        email:            form.email.trim(),
        industry:         form.industry,
        segments:         form.segments,
        contract_rate:    form.contract_rate ? parseFloat(form.contract_rate) : null,
        report_frequency: form.report_frequency,
        active:           form.active,
        timezone:         form.timezone,
        send_day:         form.send_day,
        send_time:        form.send_time,
      };
      if (editing) {
        await dispatch(updateClient({ id: editing.id, data: payload })).unwrap();
        toast.success("Client updated");
      } else {
        await dispatch(createClient(payload)).unwrap();
        toast.success("Client created");
      }
      setOpen(false);
      load(editing ? page : 1);
    } catch (err: unknown) {
      toast.error(err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message) : "Something went wrong");
    } finally { setSubmitting(false); }
  }

  async function handleToggle(client: Client) {
    const action = client.active ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${client.name}?`)) return;
    try {
      await dispatch(toggleClientActive(client.id)).unwrap();
      toast.success(`${client.name} ${client.active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update client status");
    }
  }

  async function handleEmergency(client: Client) {
    if (!confirm(
      `Send emergency report to ${client.name} right now?\n\nThis will:\n` +
      `• Delete today's existing report records\n` +
      `• Run the pipeline immediately\n` +
      `• Send email regardless of environment setting`
    )) return;

    try {
      const result = await dispatch(runEmergencyPipeline(client.id)).unwrap();
      setEmergencyJob({
        jobId:      result.job_id,
        clientId:   client.id,
        clientName: client.name,
        status:     "queued",
      });
      toast.success(`Emergency pipeline started for ${client.name}`);
    } catch (err: unknown) {
      toast.error("Emergency pipeline failed", {
        description: err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message) : "Unknown error",
      });
    }
  }

  const emergencyRunning = emergencyJob !== null
    && emergencyJob.status !== "completed"
    && emergencyJob.status !== "failed";

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage clients and their corridor subscriptions"
        action={
          <Button onClick={openAdd} size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2">
            <Plus size={14} /> Add Client
          </Button>
        }
      />

      {/* Emergency pipeline status banner */}
      {emergencyJob && emergencyJob.status !== "completed" && emergencyJob.status !== "failed" && (
        <div className="mb-6 px-4 py-3 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Emergency pipeline {emergencyJob.status} for{" "}
          <span className="font-medium">{emergencyJob.clientName}</span>
          {" "}— checking every 3 seconds...
        </div>
      )}
      {emergencyJob?.status === "completed" && (
        <div className="mb-6 px-4 py-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <span>✓ Emergency report delivered to <span className="font-medium">{emergencyJob.clientName}</span></span>
          <button onClick={() => setEmergencyJob(null)}
            className="text-emerald-600 hover:text-emerald-400 text-xs underline">Dismiss</button>
        </div>
      )}
      {emergencyJob?.status === "failed" && (
        <div className="mb-6 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>✗ Emergency pipeline failed for <span className="font-medium">{emergencyJob.clientName}</span>
            {emergencyJob.error && `: ${emergencyJob.error}`}</span>
          <button onClick={() => setEmergencyJob(null)}
            className="text-red-600 hover:text-red-400 text-xs underline">Dismiss</button>
        </div>
      )}

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
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Corridors</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Schedule</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Contract Rate</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-600" size={20} />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-600 text-sm">
                  No clients yet — add your first client
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                  <TableCell>
                    <p className="text-zinc-100 font-medium text-sm">{client.name}</p>
                    <p className="text-zinc-600 text-xs font-mono mt-0.5">{client.id}</p>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{client.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.segments.map((s) => (
                        <Badge key={s} variant="outline"
                          className="text-[10px] border-zinc-700 text-zinc-400 bg-transparent">
                          {CORRIDOR_LABELS[s] ?? s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-zinc-400 text-xs capitalize">
                      {client.send_day || "monday"}s · {client.send_time || "09:00"}
                    </p>
                    <p className="text-zinc-600 text-xs font-mono">{client.timezone || "UTC"}</p>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm font-mono">
                    {client.contract_rate ? `$${client.contract_rate.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={client.active
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px]"
                      : "border-zinc-700 text-zinc-500 bg-transparent text-[10px]"}>
                      {client.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon"
                        className="h-7 w-7 text-zinc-500 hover:text-zinc-100 hover:bg-white/5"
                        onClick={() => openEdit(client)}>
                        <Pencil size={13} />
                      </Button>
                      <Button variant="ghost" size="icon"
                        title={client.active ? "Deactivate" : "Activate"}
                        className={`h-7 w-7 ${client.active
                          ? "text-zinc-500 hover:text-red-400 hover:bg-red-500/5"
                          : "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5"}`}
                        onClick={() => handleToggle(client)}>
                        {client.active ? <PowerOff size={13} /> : <Power size={13} />}
                      </Button>
                      <Button variant="ghost" size="icon"
                        title="Send emergency report now"
                        disabled={emergencyRunning}
                        className="h-7 w-7 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/5 disabled:opacity-40"
                        onClick={() => handleEmergency(client)}>
                        {emergencyJob?.clientId === client.id && emergencyRunning
                          ? <Loader2 size={13} className="animate-spin text-amber-400" />
                          : <Zap size={13} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pages={pages} total={total} limit={PAGE_LIMIT}
        onPageChange={(p) => load(p)} />

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-[#1f1f1f] text-zinc-100 min-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editing ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* Row 1 — ID, Name, Email */}
            <div className="grid grid-cols-3 gap-3">
              {!editing ? (
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Client ID</Label>
                  <Input placeholder="e.g. acme_corp" value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value.trim() })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm" />
                  <p className="text-[10px] text-zinc-600">Lowercase, no spaces.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Client ID</Label>
                  <div className="px-3 py-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-zinc-500 text-sm font-mono">
                    {form.id}
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Name</Label>
                <Input placeholder="Company name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Email</Label>
                <Input type="email" placeholder="manager@company.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm" />
              </div>
            </div>

            {/* Row 2 — Contract Rate, Frequency, Industry */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Contract Rate (USD / 40ft)</Label>
                <Input type="number" placeholder="e.g. 3100" value={form.contract_rate}
                  onChange={(e) => setForm({ ...form, contract_rate: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm" />
                <p className="text-[10px] text-zinc-600">Market benchmark in report</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Report Frequency</Label>
                <Select value={form.report_frequency}
                  onValueChange={(v) => setForm({ ...form, report_frequency: v })}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    <SelectItem value="weekly"   className="text-zinc-300">Weekly</SelectItem>
                    <SelectItem value="biweekly" className="text-zinc-300">Bi-weekly</SelectItem>
                    <SelectItem value="monthly"  className="text-zinc-300">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Industry</Label>
                <div className="px-3 py-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] text-zinc-500 text-sm">
                  Supply Chain
                </div>
              </div>
            </div>

            {/* Corridors */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Corridors</Label>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                FBX — Freightos Terminal (free weekly index)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CORRIDORS_FBX.map((key) => {
                  const active = form.segments.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleCorridor(key)}
                      className={`py-2 px-3 rounded-md text-xs font-medium border transition-all text-left
                        ${active
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                        }`}>
                      <span className="block text-[10px] font-mono text-zinc-600 mb-0.5">
                        {CORRIDOR_FBX[key]}
                      </span>
                      {CORRIDOR_LABELS[key]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-3">
                Manual — xeneta.com or forwarder quote
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CORRIDORS_MANUAL.map((key) => {
                  const active = form.segments.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleCorridor(key)}
                      className={`py-2 px-3 rounded-md text-xs font-medium border transition-all text-left
                        ${active
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                        }`}>
                      <span className="block text-[10px] font-mono text-zinc-600 mb-0.5">Manual</span>
                      {CORRIDOR_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t border-[#2a2a2a] pt-4">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
                Report Schedule
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Client Timezone</Label>
                  <Select value={form.timezone}
                    onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#2a2a2a] max-h-60">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value} className="text-zinc-300 text-sm">
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Send Day</Label>
                  <Select value={form.send_day}
                    onValueChange={(v) => setForm({ ...form, send_day: v })}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-[#2a2a2a]">
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d} className="text-zinc-300 text-sm capitalize">
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Send Time (24hr)</Label>
                  <Input type="time" value={form.send_time}
                    onChange={(e) => setForm({ ...form, send_time: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 text-sm" />
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">
                Report will arrive in the client&apos;s inbox at this local time
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
              {editing ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}