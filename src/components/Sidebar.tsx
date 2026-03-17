"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, BarChart2, Ship, FileText, Activity, BookOpen, LogOut } from "lucide-react";
import { Button } from "./ui/button";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: Activity  },
  { href: "/admin/clients",   label: "Clients",    icon: Users     },
  { href: "/admin/rates",     label: "Rates",      icon: BarChart2 },
  { href: "/admin/carriers",  label: "Carriers",   icon: Ship      },
  { href: "/admin/reports",   label: "Reports",    icon: FileText  },
  { href: "/admin/resources", label: "Resources",  icon: BookOpen  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    localStorage.removeItem("api_key");
    document.cookie = "api_key=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="text-sm font-semibold tracking-widest uppercase text-zinc-100">
            SC Intel
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1 tracking-wider uppercase">
          Supply Chain
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                transition-all duration-150
                ${active
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }
              `}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span className="tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1f1f1f]">
        <Button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full
            text-zinc-600 hover:text-red-400 hover:bg-red-500/5 border border-transparent
            transition-all duration-150"
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span className="tracking-wide">Logout</span>
        </Button>
      </div>
    </aside>
  );
}