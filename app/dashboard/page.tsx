"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  username: string | null;
  name: string | null;
  email: string;
  role: string;
};

type Task = {
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load dashboard");
        setUser(data.user);
      })
      .catch((err: Error) => setError(err.message));

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

  const displayName = user?.name || user?.username || user?.email || "there";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">HRDB-Lenard</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Welcome, {displayName}
            </h1>
            <p className="mt-2 text-gray-600">
              Your personal workspace and task overview.
            </p>
          </div>
          <Link
            href="/tasks"
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            View tasks
          </Link>
        </header>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Account</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {user?.username || "Loading..."}
            </p>
            <p className="mt-1 truncate text-sm text-gray-600">
              {user?.email || ""}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-5 shadow">
            <p className="text-sm text-blue-700">Pending tasks</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {taskSummary.pending}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-5 shadow">
            <p className="text-sm text-green-700">Completed tasks</p>
            <p className="mt-2 text-3xl font-bold text-green-900">
              {taskSummary.completed}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-5 shadow">
            <p className="text-sm text-red-700">Overdue tasks</p>
            <p className="mt-2 text-3xl font-bold text-red-900">
              {taskSummary.overdue}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-white p-5 shadow">
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
        </section>

        <section className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">Your account</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-1 text-gray-900">{user?.email || "Loading..."}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="mt-1 text-gray-900">{user?.role || "Loading..."}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
