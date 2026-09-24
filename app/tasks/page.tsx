"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string | null;
  dueDate: string | null;
  createdAt: string;
};

type TaskForm = {
  title: string;
  description: string;
  priority: Task["priority"];
  category: string;
  dueDate: string;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  category: "",
  dueDate: "",
};

const inputClass =
  "w-full rounded border border-gray-400 bg-white p-2 text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editing, setEditing] = useState<Task | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    return new URLSearchParams(window.location.search).get("filter") || "ALL";
  });
  const [sort, setSort] = useState("NEWEST");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load tasks");
        if (!cancelled) setTasks(data.tasks);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchTasks();
    return () => { cancelled = true; };
  }, []);

  const isOverdue = (task: Task) =>
    task.status === "PENDING" && !!task.dueDate && new Date(task.dueDate) < new Date();

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        const matchesQuery =
          !normalizedQuery ||
          task.title.toLowerCase().includes(normalizedQuery) ||
          task.description?.toLowerCase().includes(normalizedQuery) ||
          task.category?.toLowerCase().includes(normalizedQuery);
        const matchesFilter =
          filter === "ALL" ||
          (filter === "OVERDUE" && isOverdue(task)) ||
          (filter === "PENDING" && task.status === "PENDING") ||
          (filter === "COMPLETED" && task.status === "COMPLETED") ||
          (filter === "HIGH" && task.priority === "HIGH");
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "OLDEST") return +new Date(a.createdAt) - +new Date(b.createdAt);
        if (sort === "DUE_DATE") {
          return (a.dueDate ? +new Date(a.dueDate) : Infinity) - (b.dueDate ? +new Date(b.dueDate) : Infinity);
        }
        if (sort === "PRIORITY") {
          const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return rank[a.priority] - rank[b.priority];
        }
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [filter, query, sort, tasks]);

  const summary = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "PENDING").length,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    overdue: tasks.filter(isOverdue).length,
  };

  const submitTask = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to create task");
      setTasks((current) => [data.task, ...current]);
      setForm(emptyForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create task");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task) => {
    setBusyTaskId(task.id);
    const status = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update task");
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update task");
    } finally {
      setBusyTaskId(null);
    }
  };

  const deleteTask = async (id: number) => {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;
    setBusyTaskId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete task");
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete task");
    } finally {
      setBusyTaskId(null);
    }
  };

  const beginEdit = (task: Task) => {
    setEditing(task);
    setEditingForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to edit task");
      setTasks((current) => current.map((task) => task.id === editing.id ? { ...task, ...editingForm, description: editingForm.description || null, category: editingForm.category || null, dueDate: editingForm.dueDate ? new Date(`${editingForm.dueDate}T00:00:00`).toISOString() : null } : task));
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to edit task");
    } finally {
      setSaving(false);
    }
  };

  const renderFormFields = (values: TaskForm, setValues: (value: TaskForm) => void) => (
    <>
      <input value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="Task title" maxLength={120} required className={inputClass} />
      <textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Description (optional)" maxLength={500} rows={3} className={inputClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <select value={values.priority} onChange={(e) => setValues({ ...values, priority: e.target.value as Task["priority"] })} className={inputClass}>
          <option value="LOW">Low priority</option>
          <option value="MEDIUM">Medium priority</option>
          <option value="HIGH">High priority</option>
        </select>
        <input value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} placeholder="Category" maxLength={60} className={inputClass} />
        <input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} className={inputClass} />
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Back to dashboard</Link>
        <h1 className="mb-6 mt-2 text-3xl font-bold text-gray-900">Your tasks</h1>

        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total", summary.total, "text-gray-900"],
            ["Pending", summary.pending, "text-orange-600"],
            ["Completed", summary.completed, "text-green-600"],
            ["Overdue", summary.overdue, "text-red-600"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        <form onSubmit={submitTask} className="mb-8 space-y-3 rounded-lg bg-white p-5 text-gray-900 shadow">
          <h2 className="text-lg font-semibold">Create a task</h2>
          {renderFormFields(form, setForm)}
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : "Add task"}
          </button>
        </form>

        <section className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className={inputClass} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass}>
            <option value="ALL">All tasks</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="OVERDUE">Overdue</option><option value="HIGH">High priority</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass}>
            <option value="NEWEST">Newest</option><option value="OLDEST">Oldest</option><option value="DUE_DATE">Due date</option><option value="PRIORITY">Priority</option>
          </select>
        </section>

        {message && <p className="mb-4 text-red-600">{message}</p>}
        {loading ? <p className="text-gray-600">Loading tasks...</p> : visibleTasks.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-gray-600 shadow">No tasks match your current filters.</p>
        ) : (
          <ul className="space-y-3">
            {visibleTasks.map((task) => (
              <li key={task.id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className={`font-semibold ${task.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-900"}`}>{task.title}</h2>
                    {task.description && <p className="mt-1 text-sm text-gray-600">{task.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded px-2 py-1 ${task.priority === "HIGH" ? "bg-red-100 text-red-700" : task.priority === "LOW" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"}`}>{task.priority} priority</span>
                      {task.category && <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">{task.category}</span>}
                      {task.dueDate && <span className={isOverdue(task) ? "rounded bg-red-100 px-2 py-1 text-red-700" : "rounded bg-gray-100 px-2 py-1 text-gray-700"}>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <span className={task.status === "COMPLETED" ? "text-sm text-green-600" : "text-sm text-orange-600"}>{task.status === "COMPLETED" ? "Completed" : "Pending"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={busyTaskId === task.id} onClick={() => updateStatus(task)} className="rounded border border-blue-700 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busyTaskId === task.id ? "Updating..." : task.status === "COMPLETED" ? "Mark pending" : "Mark complete"}</button>
                  <button disabled={busyTaskId === task.id} onClick={() => beginEdit(task)} className="rounded border border-gray-500 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">Edit</button>
                  <button disabled={busyTaskId === task.id} onClick={() => deleteTask(task.id)} className="rounded border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{busyTaskId === task.id ? "Deleting..." : "Delete"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-lg space-y-3 rounded-lg bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="text-xl font-semibold">Edit task</h2>
            {renderFormFields(editingForm, setEditingForm)}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded border px-4 py-2">Cancel</button>
              <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
