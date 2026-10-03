"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowPathIcon, CakeIcon, FlagIcon, PlusIcon } from "@heroicons/react/24/outline";

type Task = {
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
};

type DashboardReminders = {
  upcomingTasks: { id: number; title: string; dueDate: string; status: string; isFlagged: boolean }[];
  birthdayReminders: { name: string; branch: string | null; day: string; date: string }[];
  canViewBirthdays: boolean;
};

export default function DashboardPage() {
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [error, setError] = useState("");
  const [reminders, setReminders] = useState<DashboardReminders>({ upcomingTasks: [], birthdayReminders: [], canViewBirthdays: false });

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
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_42px_76px] gap-x-3 text-xs">
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 font-semibold text-gray-600">Name</div>
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 font-semibold text-gray-600">Branch</div>
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 text-center font-semibold text-gray-600">Day</div>
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-[#fffbeb] pb-2 pt-1 text-center font-semibold text-gray-600">Date</div>
                  {reminders.birthdayReminders.map((birthday) => (
                    <div key={`${birthday.name}-${birthday.date}`} className="contents">
                      <span className="truncate border-b border-amber-200/70 py-2 font-medium text-gray-900">{birthday.name}</span>
                      <span className="truncate border-b border-amber-200/70 py-2 text-gray-700">{birthday.branch || "Not set"}</span>
                      <span className="border-b border-amber-200/70 py-2 text-center text-gray-700">{birthday.day}</span>
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
