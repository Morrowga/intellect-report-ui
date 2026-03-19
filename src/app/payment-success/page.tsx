"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Calendar, BarChart2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  // Try to get plan from URL if passed through
  const plan = searchParams.get("plan") || "starter";
  const name = searchParams.get("name") || "";

  const PLAN_PRICE: Record<string, string> = {
    starter:    "$49",
    growth:     "$89",
    pro:        "$119",
    enterprise: "$149",
  };

  const price = PLAN_PRICE[plan] || "$49";

  useEffect(() => {
    setTimeout(() => setShow(true), 80);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-md transition-all duration-500 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            CHAINIQ
          </span>
        </div>

        {/* Success card */}
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] overflow-hidden">

          {/* Top — icon + message */}
          <div className="px-8 py-8 text-center border-b border-[#1f1f1f]">
            <div className="flex justify-start mb-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100 mb-2 text-left">
              {name ? `Welcome, ${name}!` : "You're subscribed!"}
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed text-left">
              Your subscription is active. Your first intelligence
              report will arrive in your inbox this Monday.
            </p>
          </div>

        
          {/* Bottom — billing info */}
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Monthly subscription</p>
                <p className="text-zinc-300 text-sm font-medium mt-0.5 capitalize">
                  CHAINIQ {plan} plan
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-100 text-lg font-semibold">{price}</p>
                <p className="text-zinc-600 text-xs">per month</p>
              </div>
            </div>
            <p className="text-zinc-600 text-xs mt-4 leading-relaxed">
              You can cancel anytime by replying to any report email.
              Questions? Reply directly to your weekly report.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          CHAINIQ Supply Chain Intelligence
        </p>
      </div>
    </div>
  );
}