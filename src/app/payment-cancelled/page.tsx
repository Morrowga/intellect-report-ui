"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className={`
        text-center max-w-md transition-all duration-500
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}>
        {/* Icon */}
        <div className="flex justify-start mb-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
            <XCircle size={32} className="text-zinc-500" />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-semibold text-zinc-100 mb-3 text-left">
          Payment cancelled
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8 text-left">
          No charge was made. If you have any questions or need a different plan,
          reply to the email we sent you and we will sort it out.
        </p>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
            CHAINIQ
          </span>
        </div>
      </div>
    </div>
  );
}