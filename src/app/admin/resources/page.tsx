"use client";

import { PageHeader } from "@/components/PageHeader";
import { ExternalLink } from "lucide-react";

interface Resource {
  label:       string;
  url:         string;
  description: string;
  task:        string;
  frequency:   string;
}

interface ResourceGroup {
  title:     string;
  color:     string;
  resources: Resource[];
}

const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    title: "Freight Rates",
    color: "emerald",
    resources: [
      {
        label:       "Freightos Terminal",
        url:         "https://terminal.freightos.com",
        description: "FBX11 (Asia–Europe), FBX01 (Asia–US West), FBX03 (Asia–US East), FBX62 (Asia–AU), FBX57 (Asia–ME), FBX13 (Europe–US), FBX31 (Asia–SEA), FBX41 (Asia–India)",
        task:        "Copy latest rate per corridor → Rates page → Add Rate",
        frequency:   "Every Friday",
      },
    ],
  },
  {
    title: "Carrier Reliability",
    color: "blue",
    resources: [
      {
        label:       "Sea-Intelligence Press Room",
        url:         "https://sea-intelligence.com/press-room",
        description: "Global Liner Performance (GLP) monthly report — on-time % per carrier per corridor",
        task:        "Update on-time %, trend, note per carrier → Carriers page → Add Carrier",
        frequency:   "Every month (1st–5th)",
      },
      {
        label:       "Sea-Intelligence GLP Report",
        url:         "https://sea-intelligence.com/products/global-liner-performance",
        description: "Full GLP report — detailed carrier reliability breakdown",
        task:        "Reference for detailed carrier performance data",
        frequency:   "Every month",
      },
    ],
  },
  {
    title: "Market Intelligence",
    color: "violet",
    resources: [
      {
        label:       "Freightos Baltic Index (FBX)",
        url:         "https://fbx.freightos.com",
        description: "Real-time container shipping rates and market trends",
        task:        "Market context and rate trend analysis",
        frequency:   "Weekly reference",
      },
      {
        label:       "Drewry World Container Index",
        url:         "https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry",
        description: "Weekly composite index across 8 major corridors",
        task:        "Cross-reference with Freightos rates",
        frequency:   "Weekly reference",
      },
      {
        label:       "Xeneta Ocean Freight Rates",
        url:         "https://www.xeneta.com/ocean-freight-rates",
        description: "Market rate benchmarks and trend analysis",
        task:        "Rate benchmark reference",
        frequency:   "Weekly reference",
      },
    ],
  },
  {
    title: "Disruption & Port News",
    color: "orange",
    resources: [
      {
        label:       "MarineLink News",
        url:         "https://www.marinelink.com/news",
        description: "Real-time shipping and port disruption news",
        task:        "Monitor for urgent disruption alerts",
        frequency:   "As needed",
      },
      {
        label:       "Maritime Executive",
        url:         "https://maritime-executive.com",
        description: "Industry news — port closures, strikes, route disruptions",
        task:        "Monitor for corridor-impacting events",
        frequency:   "As needed",
      },
      {
        label:       "FreightWaves",
        url:         "https://www.freightwaves.com",
        description: "Real-time freight market news and analytics",
        task:        "Market news and disruption monitoring",
        frequency:   "As needed",
      },
      {
        label:       "Lloyd's List",
        url:         "https://lloydslist.com",
        description: "Authoritative maritime industry news",
        task:        "Major disruption and regulatory news",
        frequency:   "As needed",
      },
    ],
  },
  {
    title: "Tariff & Regulatory",
    color: "red",
    resources: [
      {
        label:       "US Federal Register",
        url:         "https://www.federalregister.gov",
        description: "US government trade regulations, tariff notices, customs rules",
        task:        "Automatic via API — manual reference only",
        frequency:   "Automatic",
      },
      {
        label:       "USTR Trade Policy",
        url:         "https://ustr.gov/trade-agreements/trade-policy",
        description: "US trade policy updates, Section 301 tariffs, trade agreements",
        task:        "Monitor for new tariff announcements",
        frequency:   "As needed",
      },
      {
        label:       "WTO Trade News",
        url:         "https://www.wto.org/english/news_e/news_e.htm",
        description: "Global trade policy news and dispute updates",
        task:        "Global trade regulatory monitoring",
        frequency:   "As needed",
      },
    ],
  },
  {
    title: "Data APIs",
    color: "zinc",
    resources: [
      {
        label:       "EIA Open Data",
        url:         "https://www.eia.gov/opendata",
        description: "US Energy Information Administration — Brent crude API key management",
        task:        "API key registration and management",
        frequency:   "One-time setup",
      },
      {
        label:       "OpenWeatherMap",
        url:         "https://home.openweathermap.org/api_keys",
        description: "Weather API key management dashboard",
        task:        "API key registration and management",
        frequency:   "One-time setup",
      },
      {
        label:       "UN Comtrade",
        url:         "https://comtradeapi.un.org",
        description: "UN trade flow data API — key management",
        task:        "API key registration and management",
        frequency:   "One-time setup",
      },
      {
        label:       "MarineTraffic API",
        url:         "https://www.marinetraffic.com/en/online-services/plans",
        description: "Port congestion API — pricing and subscription plans",
        task:        "Purchase API key for live port congestion data",
        frequency:   "One-time purchase",
      },
    ],
  },
];

const COLOR_MAP: Record<string, { border: string; badge: string; dot: string; link: string }> = {
  emerald: {
    border: "border-emerald-500/20",
    badge:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot:    "bg-emerald-500",
    link:   "text-emerald-400 hover:text-emerald-300",
  },
  blue: {
    border: "border-blue-500/20",
    badge:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot:    "bg-blue-500",
    link:   "text-blue-400 hover:text-blue-300",
  },
  violet: {
    border: "border-violet-500/20",
    badge:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot:    "bg-violet-500",
    link:   "text-violet-400 hover:text-violet-300",
  },
  orange: {
    border: "border-orange-500/20",
    badge:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dot:    "bg-orange-500",
    link:   "text-orange-400 hover:text-orange-300",
  },
  red: {
    border: "border-red-500/20",
    badge:  "bg-red-500/10 text-red-400 border-red-500/20",
    dot:    "bg-red-500",
    link:   "text-red-400 hover:text-red-300",
  },
  zinc: {
    border: "border-zinc-700",
    badge:  "bg-zinc-800 text-zinc-400 border-zinc-700",
    dot:    "bg-zinc-500",
    link:   "text-zinc-400 hover:text-zinc-300",
  },
};

export default function ResourcesPage() {
  return (
    <div>
      <PageHeader
        title="Resources"
        description="External data sources — rates, carriers, market intelligence"
      />

      <div className="space-y-6">
        {RESOURCE_GROUPS.map((group) => {
          const c = COLOR_MAP[group.color];
          return (
            <div key={group.title}
              className={`rounded-lg border ${c.border} bg-[#0d0d0d] overflow-hidden`}>

              {/* Group header */}
              <div className="px-5 py-3 border-b border-[#1f1f1f] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                <h2 className="text-sm font-medium text-zinc-300">{group.title}</h2>
              </div>

              {/* Resources */}
              <div className="divide-y divide-[#1a1a1a]">
                {group.resources.map((resource) => (
                  <div key={resource.url}
                    className="px-5 py-4 flex items-start justify-between gap-6 hover:bg-white/[0.02] transition-colors">

                    <div className="flex-1 min-w-0">
                      {/* Label + frequency badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-100 text-sm font-medium">
                          {resource.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.badge}`}>
                          {resource.frequency}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-zinc-500 text-xs mb-2">
                        {resource.description}
                      </p>

                      {/* Task */}
                      <p className="text-zinc-600 text-xs">
                        → {resource.task}
                      </p>

                      {/* URL */}
                      <p className="text-zinc-700 text-xs font-mono mt-1 truncate">
                        {resource.url}
                      </p>
                    </div>

                    {/* Open button */}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs
                        border border-[#2a2a2a] font-medium shrink-0
                        transition-all hover:border-[#3a3a3a] hover:bg-white/5
                        ${c.link}
                      `}
                    >
                      <ExternalLink size={12} />
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}