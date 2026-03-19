"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchClients } from "@/store/slices/clientsSlice";
import { fetchPayments, createSubscription, Payment } from "@/store/slices/paymentsSlice";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, Copy, Check, Loader2, CreditCard } from "lucide-react";

const PLANS = [
  { value: "starter",    label: "Starter",    price: "$49/mo",  corridors: "1 corridor"   },
  { value: "growth",     label: "Growth",     price: "$89/mo",  corridors: "2 corridors"  },
  { value: "pro",        label: "Pro",        price: "$119/mo", corridors: "3 corridors"  },
  { value: "enterprise", label: "Enterprise", price: "$149/mo", corridors: "4+ corridors" },
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

export default function PaymentsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { items: clients, loading: clientsLoading } = useSelector(
    (s: RootState) => s.clients
  );
  const { items: payments, loading: paymentsLoading } = useSelector(
    (s: RootState) => s.payments
  );

  const [open, setOpen]                     = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPlan, setSelectedPlan]     = useState("starter");
  const [generating, setGenerating]         = useState(false);
  const [generatedUrl, setGeneratedUrl]     = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  useEffect(() => {
    dispatch(fetchClients({ page: 1, limit: 100 }));
    dispatch(fetchPayments());
  }, [dispatch]);

  function openGenerateDialog(client: any) {
    setSelectedClient(client);
    const count = client.segments?.length || 1;
    if (count >= 4)       setSelectedPlan("enterprise");
    else if (count === 3) setSelectedPlan("pro");
    else if (count === 2) setSelectedPlan("growth");
    else                  setSelectedPlan("starter");
    setGeneratedUrl(null);
    setCopied(false);
    setOpen(true);
  }

  async function handleGenerate() {
    if (!selectedClient) return;
    setGenerating(true);
    try {
      const result = await dispatch(
        createSubscription({ client_id: selectedClient.id, plan: selectedPlan })
      ).unwrap();
      setGeneratedUrl(result.checkout_url);
      toast.success("Payment link generated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate payment link");
    } finally {
      setGenerating(false);
    }
  }

  async function copyUrl() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function statusColor(status: string) {
    switch (status) {
      case "succeeded": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
      case "failed":    return "border-red-500/30 text-red-400 bg-red-500/5";
      case "active":    return "border-blue-500/30 text-blue-400 bg-blue-500/5";
      case "cancelled": return "border-zinc-600 text-zinc-500 bg-transparent";
      default:          return "border-zinc-600 text-zinc-500 bg-transparent";
    }
  }

  function eventLabel(type: string) {
    switch (type) {
      case "payment_succeeded":      return "Payment";
      case "payment_failed":         return "Failed";
      case "subscription_created":   return "Subscribed";
      case "subscription_updated":   return "Updated";
      case "subscription_cancelled": return "Cancelled";
      default: return type;
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Generate payment links and view payment history"
      />

      {/* Generate section */}
      <div className="mb-8">
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
          Generate payment link
        </p>
        <div className="rounded-lg border border-[#1f1f1f] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1f1f1f] hover:bg-transparent">
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Corridors</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="mx-auto animate-spin text-zinc-600" size={20} />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-600 text-sm">
                    No clients yet
                  </TableCell>
                </TableRow>
              ) : clients.map((client) => (
                <TableRow key={client.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                  <TableCell>
                    <p className="text-zinc-100 font-medium text-sm">{client.name}</p>
                    <p className="text-zinc-600 text-xs font-mono mt-0.5">{client.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.segments.map((s: string) => (
                        <Badge key={s} variant="outline"
                          className="text-[10px] border-zinc-700 text-zinc-400 bg-transparent">
                          {CORRIDOR_LABELS[s] ?? s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400 text-sm capitalize">
                      {(client as any).plan || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={client.active
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[10px]"
                      : "border-zinc-700 text-zinc-500 bg-transparent text-[10px]"}>
                      {client.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"
                      onClick={() => openGenerateDialog(client)}
                      className="h-7 px-3 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 gap-1.5">
                      <Link2 size={12} />
                      Generate Link
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* History section */}
      <div>
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
          Payment history
        </p>
        <div className="rounded-lg border border-[#1f1f1f] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1f1f1f] hover:bg-transparent">
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Event</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="mx-auto animate-spin text-zinc-600" size={20} />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-600 text-sm">
                    No payment history yet
                  </TableCell>
                </TableRow>
              ) : payments.map((p: Payment) => (
                <TableRow key={p.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                  <TableCell className="text-zinc-300 text-sm font-medium">
                    {p.client_id || "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {eventLabel(p.event_type)}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm capitalize">
                    {p.plan || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300 text-sm">
                    {p.amount ? `$${p.amount.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(p.status)}`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111] border-[#1f1f1f] text-zinc-100 max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-400" />
              Generate Payment Link
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4 py-2">
              <div className="px-3 py-2.5 rounded-md bg-[#0a0a0a] border border-[#2a2a2a]">
                <p className="text-zinc-100 text-sm font-medium">{selectedClient.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{selectedClient.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs">Plan</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#2a2a2a]">
                    {PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value} className="text-zinc-300">
                        <div className="flex items-center justify-between gap-8">
                          <span>{plan.label}</span>
                          <span className="text-zinc-500 text-xs">
                            {plan.price} · {plan.corridors}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-600">
                  {selectedClient.segments?.length || 1} corridor(s) on this client
                </p>
              </div>

              <div className="px-3 py-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-emerald-400 text-xs">
                  Send this link on day 30. Billing starts immediately when they pay.
                </p>
              </div>

              {generatedUrl && (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs">Payment link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 rounded-md bg-[#0a0a0a] border border-[#2a2a2a] text-zinc-400 text-xs font-mono break-all">
                      {generatedUrl}
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyUrl}
                      className="h-9 w-9 border border-[#2a2a2a] hover:border-emerald-500/30 hover:text-emerald-400 flex-shrink-0">
                      {copied
                        ? <Check size={14} className="text-emerald-400" />
                        : <Copy size={14} />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Send to {selectedClient.name} via email or DM
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300">
              Close
            </Button>
            {!generatedUrl ? (
              <Button onClick={handleGenerate} disabled={generating}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium">
                {generating && <Loader2 size={14} className="animate-spin mr-2" />}
                Generate Link
              </Button>
            ) : (
              <Button onClick={copyUrl}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium gap-2">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}