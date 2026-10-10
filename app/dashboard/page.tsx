"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AcademicCapIcon, ArrowPathIcon, BriefcaseIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CakeIcon, CalendarDaysIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentListIcon, DocumentChartBarIcon, EyeIcon, FlagIcon, IdentificationIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon, UsersIcon, PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
};

type DashboardReminders = {
  upcomingTasks: { id: number; title: string; dueDate: string; status: string; isFlagged: boolean }[];
  birthdayReminders: { firstName: string; lastName: string; photoUrl: string | null; birthDate: string; daysUntil: number; date: string }[];
  canViewBirthdays: boolean;
};

type DashboardStats = {
  totalEmployees: number | null;
  activeEmployees: number | null;
  inactiveEmployees: number | null;
  traineeEmployees: number | null;
  newlyHired: number | null;
  branches: number | null;
  employers: number | null;
  employeesMissingRequirements: number | null;
  recentEmployees: { id: number; firstName: string; lastName: string; branch: string | null }[] | null;
  canViewEmployees: boolean;
  canCreateTasks: boolean;
  canViewAttendance: boolean;
  canViewContacts: boolean;
  canViewEmployers: boolean;
  canViewReports: boolean;
};

export default function DashboardPage() {
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [error, setError] = useState("");
  const [refreshingReminders, setRefreshingReminders] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const birthdayListRef = useRef<HTMLDivElement>(null);
  const birthdayDragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [isDraggingBirthdays, setIsDraggingBirthdays] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ totalEmployees: null, activeEmployees: null, inactiveEmployees: null, traineeEmployees: null, newlyHired: null, branches: null, employers: null, employeesMissingRequirements: null, recentEmployees: null, canViewEmployees: false, canCreateTasks: false, canViewAttendance: false, canViewContacts: false, canViewEmployers: false, canViewReports: false });
  const [reminders, setReminders] = useState<DashboardReminders>({ upcomingTasks: [], birthdayReminders: [], canViewBirthdays: false });

  const loadStats = useCallback(() => (
    fetch("/api/dashboard/stats")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load dashboard statistics");
        setStats(data);
      })
  ), []);

  const refreshStats = useCallback(async () => {
    setRefreshingStats(true);
    try {
      await loadStats();
    } catch (statsError) {
      setError(statsError instanceof Error ? statsError.message : "Unable to load dashboard statistics");
    } finally {
      setRefreshingStats(false);
    }
  }, [loadStats]);

  useEffect(() => {
    loadStats()
      .catch((statsError: Error) => setError(statsError.message));
  }, [loadStats]);

  useEffect(() => {
    fetch("/api/tasks")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load tasks");
        const tasks = data.tasks as Task[];
        const overdue = tasks.filter(
          (task) =>
            (task.status === "PENDING" || task.status === "IN_PROGRESS") &&
            task.dueDate &&
            new Date(task.dueDate) < new Date()
        ).length;
        setTaskSummary({
          total: tasks.length,
          pending: tasks.filter((task) => task.status === "PENDING").length,
          inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
          completed: tasks.filter((task) => task.status === "COMPLETED").length,
          overdue,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const fetchReminders = useCallback(async () => {
    const response = await fetch("/api/dashboard/reminders", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load reminders");
    return data as DashboardReminders;
  }, []);

  const refreshReminders = useCallback(async () => {
    try {
      setReminders(await fetchReminders());
    } catch (reminderError) {
      setError(reminderError instanceof Error ? reminderError.message : "Unable to load reminders");
    }
  }, [fetchReminders]);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        setReminders(await fetchReminders());
      } catch (reminderError) {
        setError(reminderError instanceof Error ? reminderError.message : "Unable to load reminders");
      }
    };
    void loadReminders();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshReminders();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchReminders, refreshReminders]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {error && <p className="mb-4 text-red-600">{error}</p>}

        <div className="mb-4 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
          <section className="col-span-2 rounded-lg border border-blue-200 bg-white p-3 shadow-sm sm:p-5 lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Quick Access</h2>
            <div className="mt-3 grid grid-cols-3 items-start justify-items-start gap-x-2 gap-y-3 sm:grid-cols-4">
              {stats.canViewEmployees && (
                <Link href="/employees/new" aria-label="Add Employee" title="Add Employee" className="group flex w-20 flex-col items-center gap-1">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 text-blue-700 transition group-hover:bg-blue-50"><UserPlusIcon className="h-7 w-7" /></span>
                  <span className="text-center text-[11px] font-medium leading-tight text-gray-700">Add Employee</span>
                </Link>
              )}
              {stats.canCreateTasks && (
                <Link href="/tasks?create=1" aria-label="New Task" title="New Task" className="group flex w-20 flex-col items-center gap-1">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 text-green-700 transition group-hover:bg-green-50"><ClipboardDocumentListIcon className="h-7 w-7" /></span>
                  <span className="text-center text-[11px] font-medium leading-tight text-gray-700">New Task</span>
                </Link>
              )}
              {[
                { label: "Tasks", href: "/tasks", icon: ChartBarIcon, visible: stats.canCreateTasks, color: "text-sky-700", hover: "group-hover:bg-sky-50" },
                { label: "Employees", href: "/employees", icon: UserGroupIcon, visible: stats.canViewEmployees, color: "text-blue-700", hover: "group-hover:bg-blue-50" },
                { label: "Attendance", href: "/attendance", icon: CalendarDaysIcon, visible: stats.canViewAttendance, color: "text-teal-700", hover: "group-hover:bg-teal-50" },
                { label: "Reports", href: "/reports/sss", icon: DocumentChartBarIcon, visible: stats.canViewReports, color: "text-rose-700", hover: "group-hover:bg-rose-50" },
                { label: "Contacts", href: "/contacts", icon: IdentificationIcon, visible: stats.canViewContacts, color: "text-fuchsia-700", hover: "group-hover:bg-fuchsia-50" },
                { label: "Employers", href: "/employers", icon: BriefcaseIcon, visible: stats.canViewEmployers, color: "text-amber-700", hover: "group-hover:bg-amber-50" },
              ].filter((shortcut) => shortcut.visible).map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} aria-label={shortcut.label} title={shortcut.label} className="group flex w-20 flex-col items-center gap-1">
                  <span className={`inline-flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 transition ${shortcut.color} ${shortcut.hover}`}><shortcut.icon className="h-7 w-7" /></span>
                  <span className="text-center text-[11px] font-medium leading-tight text-gray-700">{shortcut.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {stats.canViewEmployees && (
            <section className="col-span-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5 lg:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base"><UsersIcon className="h-4 w-4 text-blue-700" />Recent Employees</h2>
                <button
                  type="button"
                  onClick={() => void refreshStats()}
                  disabled={refreshingStats}
                  aria-label="Refresh recent employees"
                  title="Refresh recent employees"
                  className="rounded-md p-2 text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${refreshingStats ? "animate-spin" : ""}`} />
                </button>
              </div>
              {stats.recentEmployees?.length ? (
                <ul className="mt-3 divide-y divide-gray-100">
                  {stats.recentEmployees.map((employee) => (
                    <li key={employee.id} className="flex items-center gap-2 py-2 first:pt-1 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                        {employee.branch && <p className="truncate text-xs text-gray-500">{employee.branch}</p>}
                      </div>
                      <Link
                        href={`/employees/${employee.id}`}
                        aria-label={`View ${employee.firstName} ${employee.lastName}`}
                        title="View employee"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 text-blue-700 transition hover:bg-blue-50"
                      >
                        <EyeIcon aria-hidden="true" className="h-5 w-5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-xs text-gray-500">No employees yet.</p>}
            </section>
          )}

        <section className="col-span-2 flex h-full min-h-[320px] min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:min-h-[360px] sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CakeIcon aria-hidden="true" className="h-4 w-4 text-blue-600" />
              Birthdays
            </h2>
            {reminders.canViewBirthdays && (
              <Link href="/employees" className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline">
                See all
              </Link>
            )}
          </div>
          {!reminders.canViewBirthdays ? (
            <p className="py-6 text-sm text-gray-500">Employees access is required to view birthday reminders.</p>
          ) : reminders.birthdayReminders.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">No upcoming birthdays this month.</p>
          ) : (
            <>
              <div
                ref={birthdayListRef}
                role="region"
                aria-label="Upcoming birthdays. Drag horizontally to browse, or use the navigation buttons."
                tabIndex={0}
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse" || event.button !== 0) return;
                  birthdayDragRef.current = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startScrollLeft: event.currentTarget.scrollLeft,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const drag = birthdayDragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  if (Math.abs(event.clientX - drag.startX) > 3) {
                    setIsDraggingBirthdays(true);
                    event.preventDefault();
                  }
                  event.currentTarget.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
                }}
                onPointerUp={(event) => {
                  if (birthdayDragRef.current?.pointerId === event.pointerId) {
                    birthdayDragRef.current = null;
                    setIsDraggingBirthdays(false);
                  }
                }}
                onPointerCancel={() => {
                  birthdayDragRef.current = null;
                  setIsDraggingBirthdays(false);
                }}
                onDragStart={(event) => event.preventDefault()}
                className={`mt-4 grid flex-1 grid-flow-col gap-3 overflow-x-auto pb-1 touch-pan-x select-none ${isDraggingBirthdays ? "cursor-grabbing" : "cursor-grab"}`}
                style={{ gridAutoColumns: "180px", scrollbarWidth: "none" }}
              >
                {reminders.birthdayReminders.map((birthday) => {
                  const firstName = birthday.firstName.trim().split(/\s+/)[0] || birthday.firstName;
                  const isBirthdayToday = birthday.daysUntil === 0;
                  const countdown = birthday.daysUntil === 0
                    ? "Today"
                    : birthday.daysUntil >= 7
                      ? `In ${Math.ceil(birthday.daysUntil / 7)}w`
                      : `In ${birthday.daysUntil}d`;

                  return (
                    <article
                      key={`${birthday.firstName}-${birthday.lastName}-${birthday.date}`}
                      className={`flex w-[180px] min-w-[180px] flex-col items-center rounded-lg border px-2 py-3 text-center ${
                        isBirthdayToday
                          ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200"
                          : "border-gray-100 bg-gray-50/70"
                      }`}
                    >
                      {birthday.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={birthday.photoUrl} alt="" className="h-20 w-20 rounded-full border border-gray-200 object-cover sm:h-[84px] sm:w-[84px]" />
                      ) : (
                        <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-semibold text-blue-700 sm:h-[84px] sm:w-[84px]">
                          {`${firstName[0] || ""}${birthday.lastName.trim()[0] || ""}`.toUpperCase()}
                        </div>
                      )}
                      <div className="mt-3 flex min-h-10 w-full flex-col items-center justify-center text-xs leading-5 text-gray-800 sm:text-sm">
                        <p className="w-full truncate font-semibold">{firstName}</p>
                        <p className="w-full truncate font-medium">{birthday.lastName}</p>
                      </div>
                      <time dateTime={birthday.date} className="mt-2 text-xs text-gray-500">
                        {countdown}
                      </time>
                      <time dateTime={birthday.birthDate} className="mt-1 text-[11px] text-gray-500">
                        {new Date(birthday.birthDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" })}
                      </time>
                    </article>
                  );
                })}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-600">
                  {reminders.birthdayReminders.length} upcoming {reminders.birthdayReminders.length === 1 ? "birthday" : "birthdays"}
                </p>
                <div className="flex shrink-0 items-center">
                  <div className="flex -space-x-2" aria-hidden="true">
                    {reminders.birthdayReminders.slice(0, 3).map((birthday) => (
                      birthday.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`${birthday.firstName}-${birthday.lastName}-${birthday.date}`} src={birthday.photoUrl} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                      ) : (
                        <span key={`${birthday.firstName}-${birthday.lastName}-${birthday.date}`} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-semibold text-blue-700">
                          {`${birthday.firstName.trim()[0] || ""}${birthday.lastName.trim()[0] || ""}`.toUpperCase()}
                        </span>
                      )
                    ))}
                  </div>
                  {reminders.birthdayReminders.length > 3 && (
                    <div className="ml-1 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => birthdayListRef.current?.scrollBy({ left: -birthdayListRef.current.clientWidth * 0.8, behavior: "smooth" })}
                        aria-label="Show previous birthdays"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => birthdayListRef.current?.scrollBy({ left: birthdayListRef.current.clientWidth * 0.8, behavior: "smooth" })}
                        aria-label="Show more upcoming birthdays"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
        </div>

        <div className="mb-4 grid grid-cols-2 items-stretch gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            { label: "Missing Requirement", value: stats.employeesMissingRequirements, icon: ClipboardDocumentListIcon, color: "text-rose-700", bg: "bg-rose-50", href: stats.canViewEmployees ? "/employees?status=ALL&requirements=missing&clearSearch=1" : null },
            { label: "Newly Hired", value: stats.newlyHired, icon: UserPlusIcon, color: "text-violet-700", bg: "bg-violet-50", href: stats.canViewEmployees ? "/employees?status=ALL&hiredWithin=30&clearSearch=1" : null },
            { label: "Trainee", value: stats.traineeEmployees, icon: AcademicCapIcon, color: "text-cyan-700", bg: "bg-cyan-50", href: stats.canViewEmployees ? "/employees?status=Trainee&clearSearch=1" : null },
            { label: "Active Employees", value: stats.activeEmployees, icon: UsersIcon, color: "text-green-700", bg: "bg-green-50", href: stats.canViewEmployees ? "/employees?status=ACTIVE&clearSearch=1" : null },
            { label: "Inactive Employees", value: stats.inactiveEmployees, icon: UserMinusIcon, color: "text-gray-700", bg: "bg-gray-100", href: stats.canViewEmployees ? "/employees?status=INACTIVE&clearSearch=1" : null },
            { label: "Total Employees", value: stats.totalEmployees, icon: UserGroupIcon, color: "text-blue-700", bg: "bg-blue-50", href: stats.canViewEmployees ? "/employees?status=ALL&clearSearch=1" : null },
            { label: "Employers", value: stats.employers, icon: BuildingStorefrontIcon, color: "text-cyan-700", bg: "bg-cyan-50", href: null },
            { label: "Branch", value: stats.branches, icon: BuildingOffice2Icon, color: "text-amber-700", bg: "bg-amber-50", href: null },
          ].map(({ label, value, icon: Icon, color, bg, href }) => {
            const cardContent = (
              <>
                <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 xl:h-14 xl:w-14 ${bg}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 xl:h-7 xl:w-7 ${color}`} aria-hidden="true" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 sm:text-2xl xl:text-3xl 2xl:text-4xl">{value ?? "—"}</p>
                </div>
                <h2 className="mt-2 text-xs font-medium leading-tight text-gray-600 sm:text-sm xl:mt-3">{label}</h2>
              </>
            );
            const cardClassName = "flex flex-col items-start rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5";
            return href ? (
              <Link key={label} href={href} aria-label={`View ${label.toLowerCase()} in Employee Directory`} className={`${cardClassName} cursor-pointer transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
                {cardContent}
              </Link>
            ) : (
              <section key={label} className={cardClassName}>
                {cardContent}
              </section>
            );
          })}
        </div>

        <div className="grid items-stretch gap-4">
          <section className="flex h-full flex-col rounded-lg bg-white p-5 shadow">
            <div className="grid h-full gap-6 lg:grid-cols-2">
            <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
              <div className="flex items-center gap-2">
                <Link href="/tasks" className="rounded-lg bg-[#172554] px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900">
                  Open tasks
                </Link>
                <Link
                  href="/tasks?create=1"
                  aria-label="Add a new task"
                  title="Add a new task"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  <PlusIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 2xl:grid-cols-4 2xl:gap-4">
            <div className="rounded-lg border border-gray-300 bg-white p-5 shadow">
              <p className="text-sm text-gray-600">Pending tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {taskSummary.pending}
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-5 shadow">
              <p className="text-sm text-gray-600">In progress</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {taskSummary.inProgress}
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-5 shadow">
              <p className="text-sm text-gray-600">Completed tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {taskSummary.completed}
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-5 shadow">
              <p className="text-sm text-gray-600">Overdue tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {taskSummary.overdue}
              </p>
            </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Completion progress</span>
                <span>
                  {taskSummary.total
                    ? Math.round((taskSummary.completed / taskSummary.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${
                      taskSummary.total
                        ? (taskSummary.completed / taskSummary.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            </div>
            <div className="flex min-h-48 flex-col border-t border-gray-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
                  <p className="mt-1 text-xs text-gray-500">Task due dates in the next 30 days</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRefreshingReminders(true);
                    void refreshReminders().finally(() => setRefreshingReminders(false));
                  }}
                  disabled={refreshingReminders}
                  aria-label="Refresh upcoming tasks"
                  title="Refresh upcoming tasks"
                  className="rounded-md p-2 text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${refreshingReminders ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex-1">
                {reminders.upcomingTasks.length === 0 ? (
                  <p className="py-4 text-sm text-gray-500">No upcoming tasks due in the next 30 days.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {reminders.upcomingTasks.map((event) => (
                      <li key={event.id} className="flex items-center justify-between gap-3 py-3 first:pt-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{new Date(event.dueDate).toLocaleDateString()} · {event.status === "IN_PROGRESS" ? "In progress" : "To do"}</p>
                        </div>
                        {event.isFlagged && <FlagIcon className="h-4 w-4 shrink-0 text-rose-600" aria-label="Flagged task" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </div>
        </section>
        </div>

      </div>
    </main>
  );
}
