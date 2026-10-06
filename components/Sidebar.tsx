"use client";

import {
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE_ACCESS, type PageAccessHref } from "@/lib/pageAccess";

type CurrentUser = {
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  accessiblePages: PageAccessHref[];
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
  { label: "Tasks", href: "/tasks", icon: ChartBarIcon },
  { label: "Employees", href: "/employees", icon: UserGroupIcon },
  { label: "Attendance", href: "/attendance", icon: CalendarDaysIcon },
  { label: "Contacts", href: "/contacts", icon: IdentificationIcon },
  { label: "Employers", href: "/employers", icon: BriefcaseIcon },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  user: CurrentUser | null;
};

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const isCollapsed = collapsed && !mobileOpen;
  const collapsedText = isCollapsed
    ? "md:hidden"
    : "whitespace-nowrap";
  const isAdmin = user?.role === "ADMIN";
  const accessiblePages = user?.accessiblePages || DEFAULT_PAGE_ACCESS;

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
      className={`${mobileOpen ? "fixed inset-x-0 top-[76px] flex h-[calc(100dvh-76px)]" : "relative hidden md:sticky md:top-0 md:flex md:h-screen"} z-20 shrink-0 flex-col bg-[#172554] text-white shadow-xl transition-[height,width] duration-300 ${
        isCollapsed ? "md:w-[65px]" : "md:w-64"
      }`}
    >
      <div className={`relative hidden shrink-0 items-center justify-between border-b border-white/10 px-4 md:flex md:px-6 ${
        isCollapsed ? "h-16 md:h-20 md:flex-col md:justify-center md:gap-1 md:px-0" : "h-16 md:h-20"
      }`}>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3 md:static md:translate-x-0">
          <button
            type="button"
            aria-label="HRDB home"
            className={`flex shrink-0 cursor-default items-center justify-center rounded-xl bg-blue-400 font-bold text-[#172554] shadow-lg shadow-blue-950/20 ${
              "h-10 w-10 text-lg"
            }`}
          >
            H
          </button>
          <div className={`overflow-hidden ${collapsedText}`}>
            <p className="text-base font-bold tracking-tight">HRDB-Lenard</p>
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
          {navigation.filter((item) => isAdmin || accessiblePages.includes(item.href as PageAccessHref)).map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href === "/tasks" && pathname.startsWith("/tasks/"));
            return (
              <Link
                key={label}
                href={href}
                onClick={onMobileToggle}
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
          Account
        </p>
        {(isAdmin || accessiblePages.includes("/settings")) && <Link
            href="/settings"
            onClick={onMobileToggle}
            title={isCollapsed ? "Account Settings" : undefined}
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
            <span className={collapsedText}>Account Settings</span>
          </Link>}
      </nav>

      <div className={`${mobileOpen ? "block" : "hidden"} px-4 py-3 md:block ${isCollapsed ? "md:px-2" : ""}`}>
        <div className={`mb-3 px-3 ${collapsedText}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Welcome</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{user?.name || user?.username || user?.email || "Loading profile..."}</p>
          <p className="mt-0.5 text-xs text-blue-200">{user?.role === "ADMIN" ? "Admin" : user ? "User" : ""}</p>
        </div>
      </div>
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

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 z-30 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/40 bg-blue-400 text-[#172554] shadow-md transition hover:bg-blue-300 md:flex"
      >
        {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
      </button>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const pageTitle = getPageTitle(pathname);
  const pageSubtitle = getPageSubtitle(pathname);
  const showDashboardBack = pathname !== "/dashboard" && !pathname.startsWith("/tasks") && pathname !== "/employees";
  const dateTimeValue = currentDateTime?.toISOString();
  const dateLabel = currentDateTime?.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeLabel = currentDateTime?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(new Date());
    updateDateTime();
    const interval = window.setInterval(updateDateTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const openMobileSidebar = () => setMobileOpen(true);
    window.addEventListener("hrdb-open-sidebar", openMobileSidebar);
    return () => window.removeEventListener("hrdb-open-sidebar", openMobileSidebar);
  }, []);

  useEffect(() => {
    if (publicRoute) return;

    const loadUser = () => {
      fetch("/api/me")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Unable to load profile");
          setUser(data.user);
        })
        .catch(() => setUser(null));
    };

    loadUser();
    window.addEventListener("hrdb-profile-updated", loadUser);
    return () => window.removeEventListener("hrdb-profile-updated", loadUser);
  }, [publicRoute]);

  if (publicRoute) return children;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] md:flex-row">
      <header className="sticky top-0 z-40 flex h-[76px] shrink-0 items-center border-b border-white/10 bg-[#172554] text-white shadow-sm md:hidden" style={{ backgroundColor: "#172554" }}>
        <div className="flex h-full w-14 shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            title={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-400 text-[#172554] shadow-md transition hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {mobileOpen ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="flex min-w-0 items-center gap-2 px-3">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400 text-base font-bold text-[#172554]">H</span>
            <span className="truncate text-base font-bold tracking-tight">HRDB-Lenard</span>
          </div>
        ) : (
          <div className="min-w-0 flex-1 px-3">
            <h1 className="truncate text-lg font-bold">{pageTitle}</h1>
            {pageSubtitle && <p className="mt-0.5 truncate text-xs text-blue-100">{pageSubtitle}</p>}
          </div>
        )}
        <time dateTime={dateTimeValue} className="ml-auto shrink-0 px-2 text-right text-[10px] leading-tight text-blue-100">
          {dateLabel && <span className="block">{dateLabel}</span>}
          {timeLabel && <span className="mt-1 block text-xs font-semibold text-white">{timeLabel}</span>}
        </time>
      </header>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(false)}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 hidden h-20 shrink-0 items-center border-b border-white/10 bg-[#172554] text-white shadow-sm md:flex">
          <div className="min-w-0 px-5 md:px-7">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{pageTitle}</h1>
            {pageSubtitle && <p className="mt-0.5 max-w-full truncate text-xs text-blue-100 sm:text-sm">{pageSubtitle}</p>}
          </div>
          <time dateTime={dateTimeValue} className="ml-auto shrink-0 px-5 text-right text-sm text-blue-100 md:px-7">
            {dateLabel && <span className="block">{dateLabel}</span>}
            {timeLabel && <span className="mt-1 block text-base font-semibold text-white">{timeLabel}</span>}
          </time>
        </header>
        {showDashboardBack && <div className="px-4 pt-3 sm:px-6">
          <Link
            href="/dashboard"
            onClick={(event) => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                event.preventDefault();
                setMobileOpen(true);
              }
            }}
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Link>
        </div>}
        {children}
        <footer className={`${mobileOpen ? "hidden md:flex" : "flex"} sticky bottom-0 z-20 mt-auto items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 text-xs text-gray-500 shadow-[0_-3px_10px_rgba(15,23,42,0.04)] backdrop-blur sm:px-6`}>
          <span>© {new Date().getFullYear()} HRDB-Lenard</span>
          <span className="hidden sm:inline">Human Resources Management</span>
        </footer>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/tasks")) return "Tasks";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/employees/new") return "Add New Employee";
  if (pathname.startsWith("/employees/")) return "Employee Profile";
  if (pathname === "/employees") return "Employee Directory";
  if (pathname === "/attendance") return "Attendance";
  if (pathname === "/contacts") return "Contacts";
  if (pathname === "/employers") return "Employers";
  if (pathname === "/settings") return "Account Settings";
  if (pathname === "/admin/contacts") return "Manage Office Contacts";
  if (pathname === "/admin") return "Admin Dashboard";
  return "HRDB-Lenard";
}

function getPageSubtitle(pathname: string) {
  if (pathname.startsWith("/tasks")) return "Plan, prioritize, and keep your work moving.";
  if (pathname === "/dashboard") return "Your personal workspace and task overview.";
  if (pathname === "/employees/new") return "Create an employee profile and record their work information.";
  if (pathname.startsWith("/employees/")) return "Employee details and work information.";
  if (pathname === "/employees") return "Employee directory and assignment details.";
  if (pathname === "/attendance") return "Attendance tracking and records.";
  if (pathname === "/contacts") return "Suppliers, contractors, and office service providers.";
  if (pathname === "/employers") return "Manage employer, branch, and government information.";
  if (pathname === "/settings") return "Profile details and account security.";
  if (pathname === "/admin/contacts") return "Manage office contacts and service providers.";
  if (pathname === "/admin") return "Manage user access and account verification.";
  return "";
}
