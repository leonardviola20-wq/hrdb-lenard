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
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "COMPLETED";
  dueDate: string | null;
};

type TaskFilter = "PENDING" | "COMPLETED" | "OVERDUE";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter | null>(null);
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
        setTasks(tasks);
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
  const selectedTasks = tasks.filter((task) => {
    if (selectedFilter === "OVERDUE") {
      return (
        task.status === "PENDING" &&
        task.dueDate &&
        new Date(task.dueDate) < new Date()
      );
    }
    return selectedFilter ? task.status === selectedFilter : false;
  });

  const taskCardClass = (filter: TaskFilter) => {
    const selectedClass =
      filter === "PENDING"
        ? "ring-blue-500"
        : filter === "COMPLETED"
          ? "ring-green-500"
          : "ring-red-500";
    return `rounded-lg p-5 text-left shadow transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:${selectedClass} ${
      selectedFilter === filter ? `ring-2 ${selectedClass}` : ""
    }`;
  };

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
          <button
            type="button"
            onClick={() => setSelectedFilter("PENDING")}
            className={taskCardClass("PENDING") + " bg-blue-50"}
          >
            <p className="text-sm text-blue-700">Pending tasks</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {taskSummary.pending}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("COMPLETED")}
            className={taskCardClass("COMPLETED") + " bg-green-50"}
          >
            <p className="text-sm text-green-700">Completed tasks</p>
            <p className="mt-2 text-3xl font-bold text-green-900">
              {taskSummary.completed}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("OVERDUE")}
            className={taskCardClass("OVERDUE") + " bg-red-50"}
          >
            <p className="text-sm text-red-700">Overdue tasks</p>
            <p className="mt-2 text-3xl font-bold text-red-900">
              {taskSummary.overdue}
            </p>
          </button>
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

        {selectedFilter && (
          <section className="mt-8 rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedFilter === "PENDING"
                  ? "Pending tasks"
                  : selectedFilter === "COMPLETED"
                    ? "Completed tasks"
                    : "Overdue tasks"}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedFilter(null)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
            {selectedTasks.length === 0 ? (
              <p className="mt-4 text-gray-600">No tasks in this category.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-200">
                {selectedTasks.map((task) => (
                  <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`font-medium ${
                            task.status === "COMPLETED"
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="shrink-0 text-sm text-gray-500">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={
                selectedFilter === "PENDING"
                  ? "/tasks/pending"
                  : selectedFilter === "COMPLETED"
                    ? "/tasks/completed"
                    : "/tasks/overdue"
              }
              className="mt-5 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Open full list
            </Link>
          </section>
        )}

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
