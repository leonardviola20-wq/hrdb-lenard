"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowPathIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CakeIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentListIcon, FlagIcon, IdentificationIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon, UsersIcon, PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  status: "PENDING" | "COMPLETED";
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
  newlyHired: number | null;
  branches: number | null;
  employers: number | null;
  employeesMissingRequirements: number | null;
  recentEmployees: { id: number; firstName: string; lastName: string; branch: string | null }[] | null;
  canViewEmployees: boolean;
  canCreateTasks: boolean;
  canAddContact: boolean;
};

export default function DashboardPage() {
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [error, setError] = useState("");
  const [refreshingReminders, setRefreshingReminders] = useState(false);
  const birthdayListRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalEmployees: null, activeEmployees: null, inactiveEmployees: null, newlyHired: null, branches: null, employers: null, employeesMissingRequirements: null, recentEmployees: null, canViewEmployees: false, canCreateTasks: false, canAddContact: false });
  const [reminders, setReminders] = useState<DashboardReminders>({ upcomingTasks: [], birthdayReminders: [], canViewBirthdays: false });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load dashboard statistics");
        setStats(data);
      })
      .catch((statsError: Error) => setError(statsError.message));
  }, []);

  useEffect(() => {
    fetch("/api/tasks")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load tasks");
        const tasks = data.tasks as Task[];
        const overdue = tasks.filter(
          (task) =>
            task.status === "PENDING" &&
            task.dueDate &&
            new Date(task.dueDate) < new Date()
        ).length;
        setTaskSummary({
          total: tasks.length,
          pending: tasks.filter((task) => task.status === "PENDING").length,
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

        <div className="mb-4 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <section className="col-span-2 rounded-lg border border-blue-200 bg-white p-3 shadow-sm sm:p-5 lg:col-span-3 xl:col-span-2 xl:row-span-2">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Quick Access</h2>
            <div className="mt-3 grid gap-2 xl:grid-cols-3">
              {stats.canViewEmployees && <Link href="/employees/new" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"><UserPlusIcon className="h-4 w-4 text-blue-700" />Add Employee</Link>}
              {stats.canAddContact && <Link href="/admin/contacts" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"><IdentificationIcon className="h-4 w-4 text-violet-700" />New Contact</Link>}
              {stats.canCreateTasks && <Link href="/tasks?create=1" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"><ClipboardDocumentListIcon className="h-4 w-4 text-green-700" />New Task</Link>}
            </div>
            {stats.canViewEmployees && <div className="mt-4 border-t border-gray-100 pt-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800"><UsersIcon className="h-4 w-4 text-blue-700" />Recent Employees</h3>
              {stats.recentEmployees?.length ? (
                <ul className="mt-2 divide-y divide-gray-100">
                  {stats.recentEmployees.map((employee) => (
                    <li key={employee.id} className="py-2 first:pt-1 last:pb-0">
                      <p className="truncate text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                      {employee.branch && <p className="truncate text-xs text-gray-500">{employee.branch}</p>}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-xs text-gray-500">No employees yet.</p>}
            </div>}
          </section>
          {[
            { label: "Total Employees", value: stats.totalEmployees, icon: UserGroupIcon, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Active Employees", value: stats.activeEmployees, icon: UsersIcon, color: "text-green-700", bg: "bg-green-50" },
            { label: "Inactive Employees", value: stats.inactiveEmployees, icon: UserMinusIcon, color: "text-gray-700", bg: "bg-gray-100" },
            { label: "Newly Hired (30d)", value: stats.newlyHired, icon: UserPlusIcon, color: "text-violet-700", bg: "bg-violet-50" },
            { label: "Branch", value: stats.branches, icon: BuildingOffice2Icon, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Employers", value: stats.employers, icon: BuildingStorefrontIcon, color: "text-cyan-700", bg: "bg-cyan-50" },
            { label: "Employees Missing Requirements", value: stats.employeesMissingRequirements, icon: ClipboardDocumentListIcon, color: "text-rose-700", bg: "bg-rose-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <section key={label} className="flex flex-col items-start rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 xl:h-14 xl:w-14 ${bg}`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 xl:h-7 xl:w-7 ${color}`} aria-hidden="true" />
                </div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl xl:text-3xl 2xl:text-4xl">{value ?? "—"}</p>
              </div>
              <h2 className="mt-2 text-xs font-medium leading-tight text-gray-600 sm:text-sm xl:mt-3">{label}</h2>
            </section>
          ))}
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <section className="order-2 flex h-full flex-col rounded-lg bg-white p-5 shadow lg:col-span-2">
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
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-300 bg-white p-5 shadow">
              <p className="text-sm text-gray-600">Pending tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {taskSummary.pending}
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
                  <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
                  <p className="mt-1 text-xs text-gray-500">Task due dates in the next 30 days</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRefreshingReminders(true);
                    void refreshReminders().finally(() => setRefreshingReminders(false));
                  }}
                  disabled={refreshingReminders}
                  aria-label="Refresh upcoming events"
                  title="Refresh upcoming events"
                  className="rounded-md p-2 text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${refreshingReminders ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex-1">
                {reminders.upcomingTasks.length === 0 ? (
                  <p className="py-4 text-sm text-gray-500">No upcoming task due dates.</p>
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

        <section className="order-1 flex h-full min-h-[320px] min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:min-h-[360px] sm:p-5">
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
                aria-label="Upcoming birthdays"
                tabIndex={0}
                className="mt-4 grid flex-1 grid-flow-col snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
                style={{ gridAutoColumns: "calc((100% - 1.5rem) / 3)", scrollbarWidth: "none" }}
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
                      className={`flex min-w-0 snap-start flex-col items-center rounded-lg border px-2 py-3 text-center ${
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

      </div>
    </main>
  );
}
