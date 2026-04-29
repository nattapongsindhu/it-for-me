'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hospital,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Stethoscope,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    note: "Portfolio mission, progress, and delivery roadmap",
  },
  {
    name: "Biomedical & Device",
    href: "/jobs/biomedical-device",
    icon: Stethoscope,
    note: "Hospital equipment and healthcare device roles",
  },
  {
    name: "IT & Helpdesk",
    href: "/jobs/it-helpdesk",
    icon: MonitorCog,
    note: "IT support, endpoint, and healthcare systems work",
  },
  {
    name: "Facilities & Tech",
    href: "/jobs/facilities-tech",
    icon: Wrench,
    note: "Maintenance, technician, and field operations pathways",
  },
  {
    name: "Hospital Careers",
    href: "/jobs/hospital-careers",
    icon: Hospital,
    note: "Direct hospital career sources across Greater Los Angeles",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function renderNavigation() {
    return (
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-panel border px-4 py-3 transition ${
                isActive
                  ? "border-slate-600 bg-slate-800 text-white shadow-[inset_3px_0_0_rgba(96,165,250,0.9)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-2 ${
                    isActive ? "bg-white/10" : "bg-slate-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.name}</span>
                    {isActive ? (
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Open
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.note}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="border-b border-slate-800 bg-shell text-white md:min-h-screen md:border-b-0 md:border-r md:border-slate-800">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-shell p-4 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Career Portfolio
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-tight">it-for-me</h1>
          </Link>
          <button
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            className="rounded-full border border-slate-700 bg-slate-900 p-3 text-slate-200 transition hover:bg-slate-800"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {isOpen ? <div className="mt-4">{renderNavigation()}</div> : null}
      </div>

      <div className="sticky top-0 hidden p-4 md:block md:p-5">
        <div className="rounded-panel border border-slate-800 bg-slate-950/80 p-5 shadow-card">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Career Portfolio
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">it-for-me</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            A practical portfolio shell for me to grow from maintenance into biomedical,
            healthcare IT, and technical support work.
          </p>
        </div>

        <div className="mt-4 rounded-panel border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Current Focus
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            Phase 5 - Stable & Automated
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The portfolio is fully automated with a multi-source medical network scraper,
            twice-daily sync, salary normalization, and production security guardrails.
          </p>
        </div>

        <div className="mt-4">{renderNavigation()}</div>
      </div>
    </aside>
  );
}
