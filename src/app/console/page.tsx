"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Verify key against API health endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/health`,
        { headers: { "X-API-Key": key.trim() } }
      );

      if (res.ok) {
        // Set cookie — middleware reads this to protect routes
        document.cookie = `api_key=${key.trim()}; path=/; max-age=${60 * 60 * 24 * 30}`;
        // Also store in localStorage for axios instance
        localStorage.setItem("api_key", key.trim());
        router.push("/admin/dashboard");
      } else {
        setError("Invalid API key");
      }
    } catch {
      setError("Cannot reach API — make sure backend is running");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-2 h-2 rounded-full bg-[#99e7fa] shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="text-sm font-semibold tracking-widest uppercase text-zinc-100">
            INTELLECT
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-8">
          <h1 className="text-zinc-100 text-base font-medium mb-1">Access</h1>
          <p className="text-zinc-600 text-xs mb-6">Enter your API key to continue</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="API key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-zinc-100 placeholder:text-zinc-700 text-sm"
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full bg-[#99e7fa] hover:bg-emerald-400 text-black font-medium"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : "Enter"
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}