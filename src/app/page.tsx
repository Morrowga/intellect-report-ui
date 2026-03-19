/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { submitInquiry, resetInquiry } from "@/store/slices/inquirySlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Triangle } from "lucide-react";

const SYNE  = "'Syne', sans-serif";
const DMONO = "'DM Mono', monospace";

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={cn("transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6", className)}>
      {children}
    </div>
  );
}

// ─── Glowing ring stat ────────────────────────────────────────────────────────
function GlowRing({ value, label, sublabel, progress }: {
  value: string; label: string; sublabel?: string; progress: number;
}) {
  const { ref, visible } = useReveal(0.3);
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const dash = visible ? circ * (1 - progress) : circ;

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full"
          style={{ boxShadow: visible ? "0 0 32px rgba(0,194,168,0.22)" : "none",
                   transition: "box-shadow 1s ease" }} />
        <svg width="112" height="112" viewBox="0 0 112 112"
             className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="56" cy="56" r={r} fill="none" stroke="#1e2530" strokeWidth="3" />
          <circle cx="56" cy="56" r={r} fill="none" stroke="url(#rg)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="40%" stopColor="#99e7fa" />
              <stop offset="100%" stopColor="#00c2a8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative z-10 text-center">
          <div className="font-extrabold text-white leading-none"
               style={{ fontFamily: SYNE, fontSize: "20px" }}>{value}</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[12px] text-slate-300 tracking-wide">{label}</div>
        {sublabel && <div className="text-[10px] text-slate-600 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Inquiry dialog ───────────────────────────────────────────────────────────
function InquiryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { status, error } = useSelector((s: RootState) => s.inquiry);
  const [errors, setErrors] = useState<{ company?: string; email?: string }>({});
  const [company, setCompany] = useState("");
  const [email,   setEmail]   = useState("");
  const handleClose = () => { dispatch(resetInquiry()); setCompany(""); setEmail(""); onClose(); };
  const handleSubmit = () => {
    const newErrors: { company?: string; email?: string } = {};
    if (!company.trim()) newErrors.company = "Company name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = "Enter a valid email address";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    dispatch(submitInquiry({ company_name: company.trim(), email: email.trim() }));
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0f1318] border border-[#1e2530] text-white max-w-md rounded-none p-8">
        <DialogHeader>
          <p className="text-[11px] tracking-[0.2em] text-[#00c2a8] mb-2"
             style={{ fontFamily: DMONO }}>REQUEST ACCESS</p>
          <DialogTitle className="text-2xl font-extrabold tracking-tight"
                       style={{ fontFamily: SYNE }}>
            Start Your Intelligence Feed
          </DialogTitle>
        </DialogHeader>
        {status === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-4 py-8">
            {/* <div className="w-14 h-14 rounded-full border-2 border-[#00c2a8] flex items-center justify-center text-[#00c2a8] text-2xl">✓</div> */}
            <p className="text-left text-slate-400 text-sm leading-relaxed">
              Inquiry received.<br />We'll be in touch within 24 hours.
            </p>
            <Button onClick={handleClose} variant="outline"
              className="mt-2 border-[#1e2530] text-slate-300 text-xs rounded-none hover:border-[#00c2a8] hover:text-[#00c2a8] self-end">
              Close
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Input
                placeholder="Company Name"
                value={company}
                onChange={e => { setCompany(e.target.value); setErrors(p => ({ ...p, company: undefined })); }}
                className={cn(
                  "bg-[#0a0c0f] rounded-none text-white placeholder:text-slate-600 focus-visible:ring-0 h-12",
                  errors.company ? "border-red-500" : "border-[#1e2530] focus-visible:border-[#00c2a8]"
                )}
              />
              {errors.company && <p className="text-red-400 text-[11px]">{errors.company}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Input
                type="email"
                placeholder="Business Email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                className={cn(
                  "bg-[#0a0c0f] rounded-none text-white placeholder:text-slate-600 focus-visible:ring-0 h-12",
                  errors.email ? "border-red-500" : "border-[#1e2530] focus-visible:border-[#00c2a8]"
                )}
              />
              {errors.email && <p className="text-red-400 text-[11px]">{errors.email}</p>}
            </div>
            <Button onClick={handleSubmit} disabled={status === "loading"}
              className="mt-2 h-12 rounded-none bg-[#00c2a8] hover:bg-[#e8ff6e] text-black
                         text-sm font-medium tracking-widest transition-colors">
              {status === "loading" ? "Sending…" : "SUBMIT INQUIRY"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { num: "01", title: "Live Rate Tracking",
    desc: "Real freight rates updated every Friday from Freightos Baltic Index across 12 active trade corridors. WoW movement, 30-day average, and 90-day trend calculated automatically — know exactly where the market stands before your next booking." },
  { num: "02", title: "Fuel Price Intelligence",
    desc: "Brent crude current spot price and 30-day EIA STEO forecast automatically integrated into every report. Know whether fuel costs are heading up or down next month before your competitors do." },
  { num: "03", title: "Disruption Alert System",
    desc: "Real-time monitoring of MarineLink, FreightWaves, and Maritime Executive RSS feeds. Hormuz blockades, Red Sea attacks, port strikes — corridor-specific disruption alerts land in your report within hours, with alternative routing automatically calculated." },
  { num: "04", title: "Transit & Routing Intelligence",
    desc: "Standard transit days per corridor, live disruption detection, and alternative routing recommendations. When Hormuz is blocked, your report tells you exactly: reroute via Cape of Good Hope, add 10 days." },
  { num: "05", title: "Carrier Reliability Rankings",
    desc: "On-time performance per carrier per corridor, updated monthly from Sea-Intelligence Global Liner Performance data. IMPROVING, STABLE, or DECLINING trend signals. The best carrier for your corridor this week, with a specific reason why." },
  { num: "06", title: "Port & Weather Risk",
    desc: "Congestion levels across 15 global ports plus live weather risk scoring for every origin and destination city. Never be caught off guard by a port closure, storm delay, or typhoon season." },
  { num: "07", title: "Market Benchmark",
    desc: "Your contract rate vs live market rate, side by side, every week. Know instantly whether you are overpaying or holding a competitive advantage — with a direct recommendation to renegotiate or hold." },
  { num: "08", title: "Trade Flow Context",
    desc: "UN Comtrade bilateral export values per corridor — the demand-side story behind every rate movement. Understand whether a rate spike is driven by real volume or temporary disruption before you commit to a booking." },
  { num: "09", title: "30-Day Rate Outlook",
    desc: "A specific percentage forecast for where your corridor rate is heading — fall 2-4%, rise 1-3%, hold 0-2% — based on fuel forecasts, trade flow data, and current rate direction. Never a vague 'rates may increase'." },
  { num: "10", title: "Carbon Footprint Tracking",
    desc: "Estimated CO2 per 40ft container per corridor using standard maritime emission factors, benchmarked against industry average. Report on sustainability without building a separate tracking system." },
];

const CORRIDORS = [
  { from: "Shanghai",  to: "Rotterdam",   days: 28, code: "FBX11" },
  { from: "Rotterdam", to: "Shanghai",    days: 28, code: "FBX12" },
  { from: "Shanghai",  to: "Barcelona",   days: 30, code: "FBX13" },
  { from: "Barcelona", to: "Shanghai",    days: 30, code: "FBX14" },
  { from: "Shanghai",  to: "Los Angeles", days: 14, code: "FBX01" },
  { from: "Los Angeles", to: "Shanghai",  days: 14, code: "FBX02" },
  { from: "Shanghai",  to: "New York",    days: 30, code: "FBX03" },
  { from: "New York",  to: "Shanghai",    days: 30, code: "FBX04" },
  { from: "New York",  to: "Rotterdam",   days: 10, code: "FBX21" },
  { from: "Rotterdam", to: "New York",    days: 10, code: "FBX22" },
  { from: "Rotterdam", to: "Santos",      days: 14, code: "FBX24" },
  { from: "Rotterdam", to: "Callao",      days: 18, code: "FBX26" },
];

const REPORT_SECTIONS = [
  { name: "Executive Summary",      score: 9  },
  { name: "Rate Trend Analysis",    score: 9  },
  { name: "Transit & Routing",      score: 9  }, 
  { name: "Risk Alerts",            score: 9  }, 
  { name: "30-Day Outlook",         score: 9  }, 
  { name: "Carrier Recommendation", score: 9  },
  { name: "Recommended Action",     score: 9  },
  { name: "Market Benchmark",       score: 10 },
  { name: "Carbon Footprint",       score: 9  },
];

const STATS = [
  { value: "12",   label: "Trade Corridors",  sublabel: "FBX active lanes",  progress: 0.92 },
  { value: "15+",  label: "Ports Monitored",  sublabel: "live congestion",   progress: 0.75 },
  { value: "9/10", label: "Report Quality",   sublabel: "avg section score", progress: 0.90 },
  { value: "7",    label: "Data Sources",     sublabel: "live APIs + feeds",  progress: 0.70 },
];

// ─── Fullscreen feature section ───────────────────────────────────────────────
function FeatureSection({ onExitBottom, onExitTop }: {
  onExitBottom: () => void;
  onExitTop: () => void;
}) {
  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [active,    setActive]    = useState(false);
  const containerRef  = useRef<HTMLDivElement>(null);
  const lastWheelRef  = useRef<number>(0);
  const transitionRef = useRef(false);
  const currentRef    = useRef(0);

  useEffect(() => { currentRef.current = current; }, [current]);

  const goTo = useCallback((next: number, dir: "up" | "down") => {
    if (transitionRef.current) return;
    transitionRef.current = true;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(next);
      setAnimating(false);
      setTimeout(() => { transitionRef.current = false; }, 250);
    }, 480);
  }, []);

  // Activate only when section is 95% visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio >= 0.95);
      },
      { threshold: 0.95 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Lock body scroll + handle wheel only while active
  useEffect(() => {
    if (!active) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current < 900) return;
      if (Math.abs(e.deltaY) < 15) return;
      lastWheelRef.current = now;

      const cur = currentRef.current;
      if (e.deltaY > 0) {
        if (cur < FEATURES.length - 1) {
          goTo(cur + 1, "up");
        } else {
          setActive(false);
          onExitBottom();
        }
      } else {
        if (cur > 0) {
          goTo(cur - 1, "down");
        } else {
          setActive(false);
          onExitTop();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
    };
  }, [active, goTo, onExitBottom, onExitTop]);

  const f = FEATURES[current];

  return (
    <div ref={containerRef}
      className="relative w-full bg-[#0a0c0f] overflow-hidden select-none"
      style={{ height: "100vh" }}>

      {/* Top accent */}
      {/* <div className="absolute top-0 left-0 right-0 h-[2px]
                      bg-gradient-to-r from-[#00c2a8] to-[#e8ff6e]" /> */}

      {/* Big watermark number */}
      <div className="absolute inset-0 flex items-center justify-end
                      pr-16 pointer-events-none overflow-hidden">
        <span className="font-extrabold select-none"
          style={{ fontFamily: SYNE,
                   fontSize: "clamp(180px,28vw,320px)",
                   lineHeight: 1,
                   color: "#0d1117",
                   transition: "color 0.3s" }}>
          {f.num}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full max-w-6xl mx-auto px-8
                      flex flex-col justify-center">
        <div key={current}
          className="transition-all duration-480 ease-out"
          style={{
            opacity:   animating ? 0 : 1,
            transform: animating
              ? direction === "up" ? "translateY(-32px)" : "translateY(32px)"
              : "translateY(0)",
            transition: "opacity 0.48s ease, transform 0.48s ease",
          }}>

          <div className="text-[11px] font-bold tracking-[.3em] text-[#99e7fa] mb-6"
               style={{ fontFamily: DMONO }}>
            FEATURE {f.num} / {String(FEATURES.length).padStart(2, "0")}
          </div>

          <h2 className="font-extrabold text-white mb-8 leading-tight"
              style={{ fontFamily: SYNE,
                       fontSize: "clamp(36px,5vw,70px)",
                       maxWidth: "780px" }}>
            {f.title}
          </h2>

          <div className="w-16 h-[2px] bg-[#99e7fa] mb-8" />

          <p className="text-slate-400 leading-[2] max-w-2xl"
             style={{ fontSize: "clamp(15px,1.5vw,18px)" }}>
            {f.desc}
          </p>

          <div className="mt-12 text-[11px] tracking-[.2em] text-slate-700"
               style={{ fontFamily: DMONO }}>
            {current < FEATURES.length - 1 ? "SCROLL DOWN TO CONTINUE" : "SCROLL DOWN TO NEXT SECTION"}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {FEATURES.map((_, i) => (
          <button key={i}
            onClick={() => !transitionRef.current && goTo(i, i > current ? "up" : "down")}
            className={cn(
              "rounded-full transition-all duration-300 border-none cursor-pointer",
              i === current
                ? "w-1.5 h-6 bg-[#99e7fa]"
                : "w-1.5 h-1.5 bg-[#1e2530] hover:bg-[#2a3440]"
            )} />
        ))}
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-8 left-8 text-[10px] tracking-[.2em] text-slate-700"
           style={{ fontFamily: DMONO }}>
        WHAT&apos;S INSIDE — INTELLIGENCE REPORT
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [year, setYear] = useState("2026");

  useEffect(() => { setYear(String(new Date().getFullYear())); }, []);

  const heroRef          = useRef<HTMLDivElement>(null);
  const afterFeaturesRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const exitBottom = useCallback(() => {
    afterFeaturesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const exitTop = useCallback(() => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        html { scrollbar-width: none; }
        html::-webkit-scrollbar { display: none; }
        @keyframes ticker     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes glow-pulse { 0%,100%{opacity:.10} 50%{opacity:.18} }
        @keyframes bounce-y   { 0%,100%{transform:translateY(0) rotate(45deg)} 50%{transform:translateY(7px) rotate(45deg)} }
        @keyframes fade-up    { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        .ticker-track { animation: ticker 28s linear infinite; }
        .hero-glow    { animation: glow-pulse 4s ease-in-out infinite; }
        .bounce-arrow { animation: bounce-y 1.7s ease-in-out infinite; }
        .h1 { animation: fade-up .7s .00s ease both; }
        .h2 { animation: fade-up .7s .12s ease both; }
        .h3 { animation: fade-up .7s .24s ease both; }
        .h4 { animation: fade-up .7s .38s ease both; }
        .h5 { animation: fade-up .7s .52s ease both; }
      `}</style>

      <div className="bg-[#0a0c0f] text-slate-200 min-h-screen overflow-x-hidden"
           style={{ fontFamily: DMONO }}>

        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                        px-8 py-4 bg-[#0a0c0f]/85 backdrop-blur-md border-b border-[#1e2530]">
          <a href="/">
            <span style={{ fontFamily: SYNE }} className="font-extrabold text-base tracking-tight">
              INTELL<span className="text-[#99e7fa]">ECT</span>
            </span>
          </a>
          <Button onClick={() => setDialogOpen(true)}
            className="rounded-none bg-[#99e7fa] hover:bg-[#00c2a8] text-black
                       text-xs font-medium tracking-widest h-9 px-5 transition-colors">
            REQUEST ACCESS
          </Button>
        </nav>

        {/* ── TICKER — sits right below nav with correct top offset ── */}
        <div className="border-b border-[#1e2530] bg-[#0d1117] py-2.5 overflow-hidden"
             style={{ marginTop: "73px" }}> {/* nav height */}
          <div className="ticker-track flex gap-16 whitespace-nowrap w-max">
            {[...CORRIDORS, ...CORRIDORS].map((c, i) => (
              <span key={i} className="text-[10px] text-slate-600 tracking-wider">
                <span className="text-[#99e7fa]">{c.code}</span>{"  "}
                {c.from} → {c.to}{"  ·  "}{c.days}d
              </span>
            ))}
          </div>
        </div>

        {/* ── HERO ── */}
        <section ref={heroRef}
          className="relative flex flex-col justify-center overflow-hidden"
          style={{ minHeight: "calc(100vh - 73px - 37px)" }}>
          {/* grid */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: "linear-gradient(#1e2530 1px,transparent 1px),linear-gradient(90deg,#1e2530 1px,transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)",
            }} />
          {/* glow */}
          <div className="hero-glow absolute w-175 h-175 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(0,194,168,.18) 0%,transparent 70%)",
                     top: "50%", left: "30%", transform: "translate(-50%,-50%)" }} />

          <div className="relative z-10 max-w-6xl mx-auto px-8 w-full py-20
                          grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT */}
            <div>
              <h1 className="h2 font-extrabold leading-[1.05] tracking-tight text-white mb-6"
                  style={{ fontFamily: SYNE, fontSize: "clamp(34px,4.5vw,64px)" }}>
                Stop Guessing.{" "}
                <span className="text-[#99e7fa]">Start Knowing.</span>
              </h1>

              <p className="h3 text-slate-400 leading-[1.9] mb-10 max-w-md"
                 style={{ fontSize: "clamp(14px,1.3vw,16px)" }}>
                Automated weekly intelligence reports for your freight corridors —
                rates, risks, carrier performance, and market benchmarks
                delivered to your inbox on your schedule, every week.
              </p>

              <div className="h4 flex flex-wrap gap-3">
                <Button onClick={() => setDialogOpen(true)}
                  className="rounded-none h-12 px-8 bg-[#99e7fa] hover:bg-[#00c2a8] text-black
                             text-sm font-medium tracking-widest transition-colors">
                  GET STARTED
                </Button>
                <Button variant="outline" onClick={() => scrollTo("features-section")}
                  className="rounded-none h-12 px-8 border-[#1e2530] text-slate-300
                             text-sm tracking-wider hover:border-[#00c2a8] hover:text-[#99e7fa]
                             bg-transparent transition-colors">
                  SEE FEATURES ↓
                </Button>
              </div>

              {/* <button onClick={() => scrollTo("features-section")}
                className="h5 mt-16 flex items-center gap-3 text-[11px] tracking-[.15em]
                           text-slate-600 hover:text-[#00c2a8] transition-colors
                           bg-transparent border-none cursor-pointer">
                <div className="bounce-arrow w-4 h-4 border-r border-b border-current" />
                <span>SCROLL</span>
              </button> */}
            </div>

            {/* RIGHT — glowing rings */}
            <div className="h5 grid grid-cols-2 gap-10 place-items-center">
              {STATS.map((s) => (
                <GlowRing key={s.label} value={s.value} label={s.label}
                          sublabel={s.sublabel} progress={s.progress} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <div id="features-section">
          <FeatureSection onExitBottom={exitBottom} onExitTop={exitTop} />
        </div>

        {/* ── CORRIDORS ── */}
        <div ref={afterFeaturesRef}>
          <section className="border-t border-[#1e2530] bg-[#0d1117]">
            <div className="max-w-6xl mx-auto px-8 py-28">
              <Reveal>
                <p className="text-[11px] tracking-[.2em] text-[#99e7fa] mb-5">COVERAGE</p>
                <h2 className="font-extrabold tracking-tight leading-tight text-white mb-5"
                    style={{ fontFamily: SYNE, fontSize: "clamp(28px,4vw,46px)" }}>
                  12 Active Trade Corridors
                </h2>
                <p className="text-slate-400 leading-[1.9] max-w-xl mb-14"
                   style={{ fontSize: "clamp(13px,1.3vw,15px)" }}>
                  Each corridor has its own live rate index, disruption monitoring, port congestion tracking,
                  and alternative routing — fully personalized, not a generic report copy-pasted across lanes.
                </p>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
                {CORRIDORS.map((c, i) => (
                  <Reveal key={c.code} delay={i * 50}>
                    <div className="border border-[#1e2530] bg-[#0a0c0f] p-6
                                    hover:border-[#99e7fa] transition-all hover:-translate-y-0.5
                                    group cursor-default">
                      <Badge variant="outline"
                        className="rounded-none border-white/40 text-[#99e7fa]
                                   text-[10px] tracking-widest mb-4 px-2 py-0.5">
                        {c.code}
                      </Badge>
                      <div className="font-bold text-[14px] text-white leading-snug mb-2
                                      group-hover:text-[#99e7fa] transition-colors"
                           style={{ fontFamily: SYNE }}>
                        {c.from}<span className="text-slate-600 mx-2">→</span>{c.to}
                      </div>
                      <div className="text-[12px] text-slate-600 mt-1">{c.days} day transit</div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal className="flex justify-center">
                <Button onClick={() => setDialogOpen(true)}
                  className="rounded-none h-12 px-10 bg-transparent border border-[#99e7fa]
                             text-[#99e7fa] hover:bg-[#99e7fa] hover:text-black
                             text-sm tracking-widest transition-colors">
                  REQUEST ACCESS →
                </Button>
              </Reveal>
            </div>
          </section>
        </div>

        {/* ── REPORT BREAKDOWN ── */}
        <section className="max-w-6xl mx-auto px-8 py-28">
          <Reveal>
            <p className="text-[11px] tracking-[.2em] text-[#99e7fa] mb-5">THE REPORT</p>
            <h2 className="font-extrabold tracking-tight leading-tight text-white mb-5"
                style={{ fontFamily: SYNE, fontSize: "clamp(28px,4vw,46px)" }}>
              9 sections. Every week.<br />
              <span className="text-[#99e7fa]">Delivered to your inbox.</span>
            </h2>
            <p className="text-slate-400 leading-[1.9] max-w-xl mb-14"
               style={{ fontSize: "clamp(13px,1.3vw,15px)" }}>
              AI-generated from real market data, reviewed section-by-section for accuracy.
              Overall quality score: 9/10.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1e2530]
                          border border-[#1e2530] mb-10">
            {REPORT_SECTIONS.map((s, i) => (
              <Reveal key={s.name} delay={i * 40}>
                <div className="bg-[#0d1117] p-7 hover:bg-[#111820] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-[15px] text-white"
                          style={{ fontFamily: SYNE }}>{s.name}</span>
                    <span className="text-[13px] text-[#99e7fa] tabular-nums">{s.score}/10</span>
                  </div>
                  <div className="h-0.5 bg-[#1e2530] rounded-full">
                    <div className="h-0.5 bg-linear-to-r from-[#00c2a8] to-[#99e7fa]
                                    rounded-full transition-all duration-1000"
                         style={{ width: `${s.score * 10}%` }} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Sample + PDF download */}
          {/* <Reveal>
            <div className="border border-[#1e2530] bg-[#0d1117] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px]
                              bg-gradient-to-r from-[#00c2a8] to-[#e8ff6e]" />
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <p className="text-[11px] tracking-[.18em] text-slate-500">
                  SAMPLE REPORT — ASIA (SHANGHAI) → EUROPE (ROTTERDAM)
                </p>
                <Button variant="outline"
                  onClick={() => { }}
                  className="rounded-none border-[#1e2530] text-slate-400 text-[11px]
                             tracking-widest hover:border-[#00c2a8] hover:text-[#00c2a8]
                             h-8 px-4 transition-colors">
                  ↓ DOWNLOAD SAMPLE PDF
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1e2530]
                              border border-[#1e2530]">
                {[
                  { label: "CURRENT RATE (40FT)", value: "$2,883",  sub: "USD"          },
                  { label: "WEEK ON WEEK",         value: "STABLE",  sub: "vs last week" },
                  { label: "BRENT CRUDE",          value: "$85.28",  sub: "per barrel"   },
                  { label: "PORT RISK",            value: "MEDIUM",  sub: "Rotterdam"    },
                ].map(m => (
                  <div key={m.label} className="bg-[#0a0c0f] p-6">
                    <div className="text-[9px] tracking-widest text-slate-600 mb-3">{m.label}</div>
                    <div className="font-extrabold text-xl text-white"
                         style={{ fontFamily: SYNE }}>{m.value}</div>
                    <div className="text-[11px] text-slate-600 mt-2">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal> */}

          <Reveal className="flex justify-center gap-4 mt-12">
            <Button
              variant="outline"
              onClick={() => window.open('/pdf/sample.pdf', '_blank')}
              className="rounded-none h-12 px-10 bg-transparent border border-[#1e2530]
                        text-slate-400 hover:border-[#99e7fa] hover:text-[#99e7fa]
                        text-sm tracking-widest transition-colors">
              ↓ SAMPLE PDF
            </Button>
            <Button onClick={() => setDialogOpen(true)}
              className="rounded-none h-12 px-10 bg-transparent border border-[#99e7fa]
                        text-[#99e7fa] hover:bg-[#99e7fa] hover:text-black
                        text-sm tracking-widest transition-colors">
              REQUEST ACCESS →
            </Button>
          </Reveal>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="border-t border-[#1e2530] bg-[#0d1117]">
          <div className="max-w-2xl mx-auto px-8 py-32 text-center">
            <Reveal>
              <p className="text-[11px] tracking-[.2em] text-[#99e7fa] mb-6">GET STARTED</p>
              <h2 className="font-extrabold tracking-tight leading-tight text-white mb-6"
                  style={{ fontFamily: SYNE, fontSize: "clamp(30px,5vw,52px)" }}>
                Your corridor.<br />
                <span className="text-[#99e7fa]">Your report.</span><br />
                Every week.
              </h2>
              <p className="text-slate-400 leading-[1.9] mb-12 max-w-md mx-auto"
                 style={{ fontSize: "clamp(13px,1.3vw,15px)" }}>
                Tell us your company and email. We&apos;ll reach out to set up your first
                corridor and get your weekly intelligence feed running.
              </p>
              <Button onClick={() => setDialogOpen(true)}
                className="rounded-none h-14 px-12 bg-[#99e7fa] hover:bg-[#00c2a8]
                           text-black text-sm font-medium tracking-widest transition-colors">
                REQUEST ACCESS →
              </Button>
            </Reveal>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#1e2530] px-8 py-6
                           flex items-center justify-between flex-wrap gap-4">
          <span className="font-extrabold text-sm tracking-tight" style={{ fontFamily: SYNE }}>
            INTELL<span className="text-[#99e7fa]">ECT</span>
          </span>
          <p className="text-[11px] text-slate-600">© {year} ChainIQ. All rights reserved.</p>
        </footer>
      </div>

      <InquiryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center
                  border border-[#1e2530] bg-[#0d1117] text-[#00c2a8]
                  hover:border-[#00c2a8] hover:bg-[#00c2a8] hover:text-black
                  transition-colors duration-200"
        style={{ fontFamily: DMONO, fontSize: "16px" }}
        aria-label="Scroll to top"
      >
        <Triangle size={12} />
      </motion.button>
    </>
  );
}