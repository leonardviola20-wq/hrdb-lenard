"use client";

import {
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentChartBarIcon,
  IdentificationIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppNavigationHistoryTracker } from "@/components/AppNavigationHistoryTracker";
import { DirectMessageWidget } from "@/components/chat/DirectMessageWidget";
import { resetAppRouteHistory } from "@/lib/appNavigationHistory";
import { DEFAULT_PAGE_ACCESS, type PageAccessHref } from "@/lib/pageAccess";

function createPresenceSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

type CurrentUser = {
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  accessiblePages: PageAccessHref[];
};

function getProfileDisplayName(user: CurrentUser | null) {
  return (user?.name || user?.username || user?.email || "Loading profile...").toUpperCase();
}

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon },
  { label: "Tasks", href: "/tasks", icon: ChartBarIcon },
  { label: "201 File", href: "/employees", icon: UserGroupIcon },
  { label: "Attendance", href: "/attendance", icon: CalendarDaysIcon },
  { label: "Reports", href: "/reports", accessHref: "/reports/sss", icon: DocumentChartBarIcon },
  { label: "Contacts", href: "/contacts", icon: IdentificationIcon },
  { label: "Employers", href: "/employers", icon: BriefcaseIcon },
];

const reportNavigation = [
  { label: "Contributions", href: "/reports/contributions", kind: "CONTRIBUTION", icon: DocumentChartBarIcon },
  { label: "Loan", href: "/reports/sss?kind=LOAN", kind: "LOAN", icon: BanknotesIcon },
] as const;

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onBeforeLogout: () => Promise<void>;
  user: CurrentUser | null;
};

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileToggle, onBeforeLogout, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [reportsExpandedOverride, setReportsExpandedOverride] = useState<boolean | null>(null);
  const [settingsExpandedOverride, setSettingsExpandedOverride] = useState<boolean | null>(null);
  const isCollapsed = collapsed && !mobileOpen;
  const collapsedText = isCollapsed
    ? "md:hidden"
    : "whitespace-nowrap";
  const isAdmin = user?.role === "ADMIN";
  const accessiblePages = user?.accessiblePages || DEFAULT_PAGE_ACCESS;
  const onReportsPage = pathname === "/reports" || pathname.startsWith("/reports/");
  const reportsExpanded = reportsExpandedOverride ?? onReportsPage;
  const onSettingsPage = pathname === "/settings" || pathname === "/management/system-configuration";
  const settingsExpanded = settingsExpandedOverride ?? onSettingsPage;
  const profileDisplayName = getProfileDisplayName(user);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await onBeforeLogout();
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to log out");
      window.dispatchEvent(new Event("hrdb-clear-employee-profile-cache"));
      // The signed-in route trail must not leak into the next session.
      resetAppRouteHistory();
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
          {navigation.filter((item) => ("adminOnly" in item && item.adminOnly ? isAdmin : isAdmin || accessiblePages.includes(("accessHref" in item ? item.accessHref : item.href) as PageAccessHref))).map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/tasks" && pathname.startsWith("/tasks/")) ||
              (href === "/reports" && pathname.startsWith("/reports/"));
            const className = `group/item flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition ${
              active
                ? isCollapsed
                  ? "mx-auto h-10 w-10 justify-center bg-white text-[#172554] shadow-lg shadow-blue-950/20"
                  : "px-3 bg-white text-[#172554] shadow-sm"
                : isCollapsed
                  ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                  : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
            }`;
            const content = <span className="flex min-w-0 items-center gap-3"><Icon className={`h-5 w-5 shrink-0 transition-transform ${active ? "text-blue-700" : "text-blue-300 group-hover:text-blue-100"} ${isCollapsed ? "group-hover/item:scale-110" : ""}`} /><span className={collapsedText}>{label}</span></span>;
            if (href !== "/reports") {
              return <Link key={label} href={href} onClick={onMobileToggle} title={isCollapsed ? label : undefined} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
            }

            return (
              <div key={label} className="space-y-1">
                <button
                  type="button"
                  title={isCollapsed ? label : undefined}
                  aria-label={isCollapsed ? `${label}: ${reportsExpanded ? "collapse" : "expand"} links` : undefined}
                  aria-expanded={reportsExpanded}
                  aria-controls="reports-subnavigation"
                  onClick={() => {
                    if (pathname === "/reports") {
                      setReportsExpandedOverride(!reportsExpanded);
                      return;
                    }
                    setReportsExpandedOverride(true);
                    router.push("/reports");
                    onMobileToggle();
                  }}
                  className={`${className} ${isCollapsed ? "w-10 self-center" : "w-full justify-between"}`}
                >
                  {content}
                  {!isCollapsed && (
                    <ChevronRightIcon className={`h-4 w-4 shrink-0 transition-transform ${reportsExpanded ? "rotate-90" : ""}`} />
                  )}
                </button>
                <div
                  id="reports-subnavigation"
                  hidden={!reportsExpanded}
                  className={`space-y-1 ${isCollapsed ? "pl-1" : "ml-5 border-l border-white/15 pl-3"}`}
                >
                  {reportNavigation.map(({ label: reportLabel, href: reportHref, kind, icon: ReportIcon }) => {
                    const reportActive = pathname === reportHref || pathname.startsWith(`${reportHref}/`);
                    return (
                      <Link
                        key={kind}
                        href={reportHref}
                        onClick={onMobileToggle}
                        title={isCollapsed ? reportLabel : undefined}
                        aria-current={reportActive ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
                          reportActive
                            ? isCollapsed ? "mx-auto h-10 w-10 justify-center bg-white text-[#172554]" : "bg-white/10 px-3 text-white"
                            : isCollapsed
                              ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                              : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <ReportIcon className="h-5 w-5 shrink-0 text-blue-300" />
                        <span className={collapsedText}>{reportLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {(isAdmin || accessiblePages.includes("/settings")) && (
          <div className="mt-auto space-y-1 pt-8">
            <button
              type="button"
              title={isCollapsed ? "Settings" : undefined}
              aria-label={isCollapsed ? `Settings: ${settingsExpanded ? "collapse" : "expand"} links` : undefined}
              aria-expanded={settingsExpanded}
              aria-controls="settings-subnavigation"
              aria-current={onSettingsPage ? "page" : undefined}
              onClick={() => {
                if (onSettingsPage) {
                  setSettingsExpandedOverride(!settingsExpanded);
                  return;
                }
                setSettingsExpandedOverride(true);
                router.push("/settings");
                onMobileToggle();
              }}
              className={`group/item flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition ${
                onSettingsPage
                  ? isCollapsed
                    ? "mx-auto h-10 w-10 justify-center bg-white text-[#172554] shadow-lg shadow-blue-950/20"
                    : "px-3 bg-white text-[#172554] shadow-sm"
                  : isCollapsed
                    ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                    : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
              } ${isCollapsed ? "w-10 self-center" : "w-full justify-between"}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Cog6ToothIcon className="h-5 w-5 shrink-0 text-blue-300 group-hover:text-blue-100" />
                <span className={collapsedText}>Settings</span>
              </span>
              {!isCollapsed && (
                <ChevronRightIcon className={`h-4 w-4 shrink-0 transition-transform ${settingsExpanded ? "rotate-90" : ""}`} />
              )}
            </button>
            <div
              id="settings-subnavigation"
              hidden={!settingsExpanded}
              className={`space-y-1 ${isCollapsed ? "pl-1" : "ml-5 border-l border-white/15 pl-3"}`}
            >
              <Link
                href="/settings"
                onClick={onMobileToggle}
                title={isCollapsed ? "Account" : undefined}
                aria-current={pathname === "/settings" ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
                  pathname === "/settings"
                    ? isCollapsed ? "mx-auto h-10 w-10 justify-center bg-white/10 text-white" : "bg-white/10 px-3 text-white"
                    : isCollapsed
                      ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                      : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCircleIcon className="h-5 w-5 shrink-0 text-blue-300" />
                <span className={collapsedText}>Account</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/management/system-configuration"
                  onClick={onMobileToggle}
                  title={isCollapsed ? "System Config" : undefined}
                  aria-current={pathname === "/management/system-configuration" ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
                    pathname === "/management/system-configuration"
                      ? isCollapsed ? "mx-auto h-10 w-10 justify-center bg-white/10 text-white" : "bg-white/10 px-3 text-white"
                      : isCollapsed
                        ? "mx-auto h-10 w-10 justify-center text-blue-200 hover:bg-white/10 hover:text-white"
                        : "px-3 text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Cog6ToothIcon className="h-5 w-5 shrink-0 text-blue-300" />
                  <span className={collapsedText}>System Config</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className={`${mobileOpen ? "block" : "hidden"} border-t border-white/10 p-4 md:block ${isCollapsed ? "md:p-3" : ""}`}>
        <div className={`flex items-center justify-between gap-3 rounded-xl border border-blue-300/20 bg-blue-400/10 px-3 py-3 shadow-inner shadow-blue-950/20 ${isCollapsed ? "md:mx-auto md:h-11 md:w-11 md:justify-center md:px-0 md:py-0" : ""}`}>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold uppercase tracking-wide text-white">
                {profileDisplayName}
              </span>
              {user && (
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-200">
                  <span>{user.role === "ADMIN" ? "Administrator" : "User"}</span>
                  <span className="rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-100">
                    {user.role === "ADMIN" ? "Admin" : "User"}
                  </span>
                </span>
              )}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Log out"
            aria-label={loggingOut ? "Logging out" : "Log out"}
            className="group/item flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowRightOnRectangleIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
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
  const isLoansDashboard = pathname === "/loans";
  const isSssLoansPage = pathname === "/loans/sss";
  const isViewportBoundedLoansPage = isLoansDashboard || isSssLoansPage;
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const chatPresenceCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const canUseChat = Boolean(user);
  const profileDisplayName = getProfileDisplayName(user);
  const profileRole = user?.role === "ADMIN" ? "ADMIN" : "USER";
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

  useEffect(() => {
    if (publicRoute || !canUseChat) return;

    const sessionId = createPresenceSessionId();
    let active = true;
    let timer = 0;
    let heartbeatInFlight: Promise<void> | null = null;
    let cleanupRequest: Promise<void> | null = null;
    const heartbeat = async () => {
      if (!active) return;
      const request = (async () => {
        try {
          const response = await fetch("/api/chat/presence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "heartbeat", sessionId }),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => null) as { error?: string } | null;
            throw new Error(data?.error || "Unable to update chat presence");
          }
        } catch (error) {
          console.error("Chat presence heartbeat failed:", error);
        }
      })();
      heartbeatInFlight = request;
      await request;
      if (heartbeatInFlight === request) heartbeatInFlight = null;
      if (active) timer = window.setTimeout(() => { void heartbeat(); }, 15_000);
    };

    const leavePresence = () => {
      if (cleanupRequest) return cleanupRequest;
      active = false;
      window.clearTimeout(timer);
      cleanupRequest = (async () => {
        await heartbeatInFlight;
        const response = await fetch("/api/chat/presence", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          keepalive: true,
        });
        if (!response.ok && response.status !== 401) {
          console.error("Chat presence cleanup failed:", response.status);
        }
      })().catch((error: unknown) => console.error("Chat presence cleanup failed:", error));
      return cleanupRequest;
    };

    chatPresenceCleanupRef.current = leavePresence;
    void heartbeat();
    return () => {
      if (chatPresenceCleanupRef.current === leavePresence) {
        chatPresenceCleanupRef.current = null;
      }
      void leavePresence();
    };
  }, [publicRoute, canUseChat]);

  if (publicRoute) return <><AppNavigationHistoryTracker />{children}</>;

  return (
    <>
      <AppNavigationHistoryTracker />
      <div className={`flex ${isViewportBoundedLoansPage ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen"} flex-col bg-[#f8fafc] md:flex-row`}>
        <header className="page-header-surface z-50 flex h-[76px] shrink-0 items-center border-b border-slate-200 bg-white text-black shadow-sm md:hidden">
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
        <div className="min-w-0 flex-1 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400 text-sm font-bold text-black">H</span>
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight text-slate-600">
                <span className="text-base font-semibold">Welcome!</span>{" "}
                <span className="text-base font-bold text-slate-950">{profileDisplayName}</span>
                {user && (
                  <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-blue-800">
                    {profileRole}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <time dateTime={dateTimeValue} className="ml-auto hidden shrink-0 px-2 text-right text-[10px] leading-tight">
          {dateLabel && <span className="block">{dateLabel}</span>}
          {timeLabel && <span className="mt-1 block text-xs font-semibold">{timeLabel}</span>}
        </time>
      </header>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(false)}
        onBeforeLogout={() => chatPresenceCleanupRef.current?.() ?? Promise.resolve()}
        user={user}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="page-header-surface z-10 hidden h-20 shrink-0 items-center border-b border-slate-200 bg-white text-black shadow-sm md:flex">
          <div className="min-w-0 px-5 md:px-7">
            <p className="truncate text-sm leading-tight text-slate-600">
              <span className="text-lg font-semibold">Welcome!</span>{" "}
              <span className="text-lg font-bold text-slate-950">{profileDisplayName}</span>
              {user && (
                <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2.5 py-1 align-middle text-[10px] font-bold uppercase tracking-wide text-blue-800">
                  {profileRole}
                </span>
              )}
            </p>
          </div>
          <time dateTime={dateTimeValue} className="ml-auto shrink-0 px-5 text-right text-sm md:px-7">
            {dateLabel && <span className="block">{dateLabel}</span>}
            {timeLabel && <span className="mt-1 block text-base font-semibold">{timeLabel}</span>}
          </time>
        </header>
        <div id="app-page-card" className={`app-page-card mx-2 my-2 flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm sm:m-4 ${isViewportBoundedLoansPage ? "overflow-hidden" : ""}`}>
          {children}
        </div>
        <footer className={`${mobileOpen ? "hidden md:flex" : "flex"} sticky bottom-0 z-20 mt-auto items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 text-xs text-gray-500 shadow-[0_-3px_10px_rgba(15,23,42,0.04)] backdrop-blur sm:px-6`}>
          <span>© {new Date().getFullYear()} HRDB-Lenard</span>
          <span className="hidden sm:inline">Human Resources Management</span>
        </footer>
        </div>
      </div>
      {canUseChat && <DirectMessageWidget />}
    </>
  );
}
