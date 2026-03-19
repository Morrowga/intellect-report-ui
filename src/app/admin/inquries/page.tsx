"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchInquiries, updateInquiryStatus } from "@/store/slices/inquirySlice";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const STATUS_FILTERS = ["ALL", "new", "contacted", "closed"];

const STATUS_STYLES: Record<string, string> = {
  new:       "border-[#00c2a8]/40 text-[#00c2a8] bg-transparent",
  contacted: "border-yellow-500/40 text-yellow-400 bg-transparent",
  closed:    "border-zinc-700 text-zinc-500 bg-transparent",
};

const PAGE_LIMIT = 20;

export default function InquiriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, listLoading, listError, page, pages, total } = useSelector(
    (s: RootState) => s.inquiry
  );

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updating, setUpdating]         = useState<number | null>(null);

  function load(p: number) {
    dispatch(fetchInquiries({
      page:   p,
      limit:  PAGE_LIMIT,
      status: filterStatus === "ALL" ? undefined : filterStatus,
    }));
  }

  useEffect(() => { load(1); }, [dispatch, filterStatus]);

  async function handleStatusChange(id: number, status: string) {
    setUpdating(id);
    try {
      await dispatch(updateInquiryStatus({ id, status })).unwrap();
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Landing page inquiry submissions"
      />

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize
              ${filterStatus === s
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-transparent border-[#2a2a2a] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}>
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {listError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {listError}
        </div>
      )}

      <div className="rounded-lg border border-[#1f1f1f] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1f1f1f] hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Company</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Received</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <Loader2 className="mx-auto animate-spin text-zinc-400" size={20} />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-zinc-400 text-sm">
                  No inquiries yet
                </TableCell>
              </TableRow>
            ) : (
              items.map((inquiry) => (
                <TableRow key={inquiry.id} className="border-[#1f1f1f] hover:bg-white/[0.02]">
                  <TableCell className="text-zinc-100 font-medium text-sm">
                    {inquiry.company_name}
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${inquiry.email}`}
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-[#00c2a8] transition-colors text-sm">
                      <Mail size={12} />
                      {inquiry.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline"
                      className={`text-[10px] capitalize ${STATUS_STYLES[inquiry.status] ?? STATUS_STYLES.closed}`}>
                      {inquiry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {new Date(inquiry.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {updating === inquiry.id ? (
                      <Loader2 size={14} className="animate-spin text-zinc-400" />
                    ) : (
                      <Select value={inquiry.status}
                        onValueChange={(val) => handleStatusChange(inquiry.id, val)}>
                        <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-300 text-xs h-7 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#2a2a2a]">
                          <SelectItem value="new"       className="text-zinc-300 text-xs">New</SelectItem>
                          <SelectItem value="contacted" className="text-zinc-300 text-xs">Contacted</SelectItem>
                          <SelectItem value="closed"    className="text-zinc-300 text-xs">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
    </div>
  );
}