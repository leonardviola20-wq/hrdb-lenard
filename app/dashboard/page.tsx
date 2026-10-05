"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowPathIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CakeIcon, ClipboardDocumentListIcon, FlagIcon, IdentificationIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon, UsersIcon, PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
};

type DashboardReminders = {
  upcomingTasks: { id: number; title: string; dueDate: string; status: string; isFlagged: boolean }[];
  birthdayReminders: { name: string; branch: string | null; day: string; date: string }[];
  canViewBirthdays: boolean;
};

type DashboardStats = {
  totalEmployees: number | null;
  activeEmployees: number | null;
  inactiveEmployees: number | null;
  newlyHired: number | null;
  branches: number | null;
  employers: number | null;
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
  const [stats, setStats] = useState<DashboardStats>({ totalEmployees: null, activeEmployees: null, inactiveEmployees: null, newlyHired: null, branches: null, employers: null, recentEmployees: null, canViewEmployees: false, canCreateTasks: false, canAddContact: false });
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

  useEffect(() => {
    fetch("/api/dashboard/reminders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load reminders");
        setReminders(data);
      })
      .catch((reminderError: Error) => setError(reminderError.message));
  }, []);

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
          <section className="order-2 flex h-full flex-col rounded-lg bg-white p-5 shadow">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
              <Link
                href="/tasks?create=1"
                aria-label="Add a new task"
                title="Add a new task"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <PlusIcon className="h-5 w-5" />
              </Link>
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
            <Link href="/tasks" className="mt-5 inline-flex w-fit items-center rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900">
              Open tasks
            </Link>
        </section>

        <section className="order-1 flex h-full flex-col rounded-lg border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Birthday Notifications</h2>
              <p className="mt-1 text-xs text-gray-600">Employee birthdays this month</p>
            </div>
            <CakeIcon className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            {!reminders.canViewBirthdays ? (
              <p className="py-4 text-sm text-gray-600">Employees access is required to view birthday reminders.</p>
            ) : reminders.birthdayReminders.length === 0 ? (
              <p className="py-4 text-sm text-gray-600">No upcoming birthdays this month.</p>
            ) : (
              <div className="mt-3 max-h-[190px] overflow-y-auto pr-4">
                <div className="grid grid-cols-[minmax(0,1fr)_max-content] gap-x-3 text-xs md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_42px_76px]">
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 font-semibold text-gray-600">Name</div>
                  <div className="sticky top-0 z-10 hidden border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 font-semibold text-gray-600 md:block">Branch</div>
                  <div className="sticky top-0 z-10 hidden border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 text-center font-semibold text-gray-600 md:block">Day</div>
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 text-center font-semibold text-gray-600">Date</div>
                  {reminders.birthdayReminders.map((birthday) => (
                    <div key={`${birthday.name}-${birthday.date}`} className="contents">
                      <span className="truncate border-b border-amber-200/70 py-2 font-medium text-gray-900">{birthday.name}</span>
                      <span className="hidden truncate border-b border-amber-200/70 py-2 text-gray-700 md:block">{birthday.branch || "Not set"}</span>
                      <span className="hidden border-b border-amber-200/70 py-2 text-center text-gray-700 md:block">{birthday.day}</span>
                      <time dateTime={birthday.date} className="whitespace-nowrap border-b border-amber-200/70 py-2 text-center text-amber-900">{new Date(birthday.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" })}</time>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {reminders.canViewBirthdays && <Link href="/employees" className="mt-auto pt-3 text-sm font-semibold text-amber-900 hover:underline">Open employees</Link>}
        </section>

        <section className="order-3 flex min-h-48 h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
                <p className="mt-1 text-xs text-gray-500">Task due dates in the next 30 days</p>
              </div>
              <ArrowPathIcon className="h-5 w-5 text-blue-700" />
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
            <Link href="/tasks" className="mt-auto pt-3 text-sm font-semibold text-blue-800 hover:underline">Open tasks</Link>
        </section>
        </div>

      </div>
    </main>
  );
}
