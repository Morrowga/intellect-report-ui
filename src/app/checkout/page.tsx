"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck, Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorBackground:      "#111111",
    colorSurface:         "#0a0a0a",
    colorText:            "#e4e4e7",
    colorTextSecondary:   "#71717a",
    colorTextPlaceholder: "#52525b",
    colorPrimary:         "#10b981",
    colorDanger:          "#ef4444",
    borderRadius:         "8px",
    fontSizeBase:         "14px",
    fontFamily:           "ui-monospace, monospace",
  },
  rules: {
    ".Input": {
      backgroundColor: "#0a0a0a",
      border:          "1px solid #27272a",
      color:           "#e4e4e7",
      padding:         "10px 12px",
    },
    ".Input:focus": {
      border:    "1px solid #10b981",
      boxShadow: "none",
    },
    ".Input--invalid": {
      border: "1px solid #ef4444",
    },
    ".Label": {
      color:         "#71717a",
      fontSize:      "11px",
      fontWeight:    "500",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    },
    ".Tab": {
      backgroundColor: "#0a0a0a",
      border:          "1px solid #27272a",
      color:           "#71717a",
    },
    ".Tab:hover": {
      color:  "#e4e4e7",
      border: "1px solid #3f3f46",
    },
    ".Tab--selected": {
      backgroundColor: "#10b981",
      border:          "1px solid #10b981",
      color:           "#000000",
    },
    ".Block": {
      backgroundColor: "#0a0a0a",
      border:          "1px solid #1f1f1f",
    },
    ".Error": {
      color: "#ef4444",
    },
  },
};

const PLAN_DETAILS: Record<string, {
  label: string; price: string; corridors: string; features: string[];
}> = {
  starter: {
    label:     "Starter",
    price:     "$49",
    corridors: "1 corridor",
    features: [
      "Weekly intelligence report every Monday",
      "Freight rate trend + WoW change",
      "Carrier reliability ranking",
      "Port & weather risk alerts",
      "Market benchmark vs your contract rate",
    ],
  },
  growth: {
    label:     "Growth",
    price:     "$89",
    corridors: "2 corridors",
    features: [
      "Everything in Starter",
      "2 corridor reports per week",
      "Cross-corridor comparison",
      "Priority disruption alerts",
    ],
  },
  pro: {
    label:     "Pro",
    price:     "$119",
    corridors: "3 corridors",
    features: [
      "Everything in Growth",
      "3 corridor reports per week",
      "30-day rate outlook per corridor",
      "Dedicated carrier recommendation",
    ],
  },
  enterprise: {
    label:     "Enterprise",
    price:     "$149",
    corridors: "4+ corridors",
    features: [
      "Everything in Pro",
      "All 8 corridors covered",
      "Custom delivery schedule",
      "Full global market coverage",
    ],
  },
};

// ---------------------------------------------------------------------------
// Payment form
// ---------------------------------------------------------------------------
function PaymentForm({
  price,
  plan,
  clientName,
  clientEmail,
}: {
  price: string;
  plan: string;
  clientName: string;
  clientEmail: string;
}) {
  const stripe   = useStripe();
  const elements = useElements();

  const [paying, setPaying] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setPaying(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?plan=${plan}&name=${encodeURIComponent(clientName)}`,
      },
    });


    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setPaying(false);
    }
    // On success Stripe redirects to return_url automatically
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <p className="text-red-400 text-xs px-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400
          disabled:opacity-50 disabled:cursor-not-allowed
          text-black text-sm font-semibold transition-colors
          flex items-center justify-center gap-2"
      >
        {paying
          ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
          : `Subscribe · ${price}/mo`
        }
      </button>

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-zinc-600" />
          <span className="text-zinc-600 text-xs">Secured by Stripe</span>
        </div>
        <div className="w-px h-3 bg-[#2a2a2a]" />
        <span className="text-zinc-600 text-xs">Cancel anytime</span>
        <div className="w-px h-3 bg-[#2a2a2a]" />
        <span className="text-zinc-600 text-xs">No hidden fees</span>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CheckoutPage() {
  const searchParams   = useSearchParams();
  const clientSecret   = searchParams.get("client_secret");
  const plan           = searchParams.get("plan") || "starter";
  const clientName     = searchParams.get("name") || "";
  const clientEmail    = searchParams.get("email") || "";

  const [error, setError] = useState<string | null>(null);

  const planDetails = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;

  useEffect(() => {
    if (!clientSecret) setError("Invalid payment link.");
  }, [clientSecret]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
              CHAINIQ
            </span>
          </div>
          <p className="text-zinc-400 text-sm">{error}</p>
          <p className="text-zinc-600 text-xs mt-2">
            Contact us if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">

        {/* Two column layout — centered on page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left — logo + plan info */}
          <div className="flex flex-col gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              <span className="text-sm font-semibold tracking-widest uppercase text-zinc-300">
                CHAINIQ
              </span>
            </div>

            {/* Plan card */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#111] overflow-hidden">

              {/* Plan header */}
              <div className="px-6 py-5 border-b border-[#1f1f1f]">
                {clientName && (
                  <p className="text-zinc-500 text-xs mb-2">For {clientName}</p>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-semibold text-zinc-100">
                      {planDetails.label} Plan
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                      {planDetails.corridors} · Billed monthly
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-zinc-100">
                      {planDetails.price}
                    </p>
                    <p className="text-zinc-600 text-xs mt-0.5">per month</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 py-5">
                <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
                  Included every week
                </p>
                <div className="space-y-2.5">
                  {planDetails.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <p className="text-zinc-400 text-sm">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — payment form */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-6">
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-5">
              Payment details
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: STRIPE_APPEARANCE,
              }}
            >
              <PaymentForm
                price={planDetails.price}
                plan={plan}
                clientName={clientName}
                clientEmail={clientEmail}
              />
            </Elements>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-8">
          Payments processed by Stripe · CHAINIQ Supply Chain Intelligence
        </p>

      </div>
    </div>
  );
}