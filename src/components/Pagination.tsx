"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-zinc-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-100 hover:bg-white/5 disabled:opacity-30"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </Button>

        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="text-zinc-400 text-xs px-1">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant="ghost"
                size="icon"
                className={`h-7 w-7 text-xs font-mono transition-all ${
                  p === page
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-zinc-100 hover:bg-white/5"
                }`}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-100 hover:bg-white/5 disabled:opacity-30"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}