"use client";

import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  IdentificationIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
  { label: "Tasks", href: "/tasks", icon: ChartBarIcon },
  { label: "Employees", href: "/admin", icon: UserGroupIcon },
  { label: "Attendance", href: "/attendance", icon: CalendarDaysIcon },
  { label: "Contacts", href: "/contacts", icon: IdentificationIcon },
  { label: "Employers", href: "/employers", icon: BriefcaseIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const isCollapsed = collapsed && !mobileOpen;
  const collapsedText = isCollapsed
    ? "md:hidden"
    : "whitespace-nowrap";

  const logout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to log out");
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={`relative z-20 flex shrink-0 flex-col bg-[#172554] text-white shadow-xl transition-[height,width] duration-300 md:sticky md:top-0 md:h-screen ${
        isCollapsed ? "md:w-14" : "md:w-64"
      } ${
        mobileOpen ? "h-screen" : "h-16"
      }`}
    >
      <div className={`relative flex shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-6 ${
        isCollapsed ? "h-16 md:h-20 md:flex-col md:justify-center md:gap-1 md:px-0" : "h-16 md:h-20"
      }`}>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="rounded-lg p-2 text-blue-200 hover:bg-white/10 hover:text-white md:hidden"
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-400 font-bold text-[#172554] shadow-lg shadow-blue-950/20 transition-all duration-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              isCollapsed ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg"
            }`}
          >
            H
          </button>
          <div className={`overflow-hidden ${collapsedText}`}>
            <p className="text-base font-bold tracking-tight">HRDB</p>
            <p className="text-xs text-blue-200">People workspace</p>
          </div>
        </div>
        <div className="w-10 md:hidden" aria-hidden="true" />
      </div>

      <nav
        aria-label="Primary navigation"
        className={`${mobileOpen ? "flex" : "hidden"} sidebar-scrollbar-hidden flex-1 flex-col overflow-y-auto py-6 md:flex ${isCollapsed ? "px-2" : "px-4"}`}
      >
        <p className={`mb-3 overflow-hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300 ${collapsedText}`}>
          Workspace
        </p>
        <div className="space-y-2">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href === "/tasks" && pathname.startsWith("/tasks/"));
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? label : undefined}
                className={`group/item flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition ${
                  active
                    ? isCollapsed
                      ? "mx-auto h-10 w-10 justify-center bg-white text-[#172554] shadow-lg shadow-blue-950/20"
                      : "px-3 bg-white text-[#172554] shadow-sm"
                    : isCollapsed
                      ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                      : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform ${active ? "text-blue-700" : "text-blue-300 group-hover:text-blue-100"} ${isCollapsed ? "group-hover/item:scale-110" : ""}`} />
                <span className={collapsedText}>{label}</span>
              </Link>
            );
          })}
        </div>

        <p className={`mb-3 mt-8 overflow-hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300 ${collapsedText}`}>
          Manage
        </p>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          title={isCollapsed ? "Settings" : undefined}
          className={`group/item flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
            pathname === "/settings"
              ? isCollapsed
                ? "mx-auto h-10 w-10 justify-center bg-white text-[#172554] shadow-lg shadow-blue-950/20"
                : "px-3 bg-white text-[#172554] shadow-sm"
              : isCollapsed
                ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Cog6ToothIcon className="h-5 w-5 shrink-0 text-blue-300 group-hover:text-blue-100" />
          <span className={collapsedText}>Settings</span>
        </Link>
      </nav>

      <div className={`${mobileOpen ? "block" : "hidden"} border-t border-white/10 p-4 md:block ${isCollapsed ? "md:p-3" : ""}`}>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          title={isCollapsed ? "Log-out" : undefined}
          className={`group/item flex w-full items-center gap-3 rounded-xl py-3 text-left text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${isCollapsed ? "md:mx-auto md:h-10 md:w-10 md:justify-center md:px-0" : "px-3"}`}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 text-blue-300" />
          <span className={collapsedText}>{loggingOut ? "Logging out..." : "Log-out"}</span>
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (publicRoute) return children;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] md:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
