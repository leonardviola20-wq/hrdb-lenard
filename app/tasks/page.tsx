"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
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
  const [sort, setSort] = useState("MANUAL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("create") === "1";
  });

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

  useEffect(() => {
    if (openMenuTaskId === null) return;
    const closeMenu = () => setOpenMenuTaskId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuTaskId]);

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
          (filter === "IN_PROGRESS" && task.status === "IN_PROGRESS") ||
          (filter === "COMPLETED" && task.status === "COMPLETED") ||
          (filter === "HIGH" && task.priority === "HIGH");
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "MANUAL") return 0;
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
      setShowCreateForm(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create task");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task, nextStatus?: Task["status"]) => {
    setBusyTaskId(task.id);
    const status = nextStatus || (task.status === "COMPLETED" ? "PENDING" : "COMPLETED");
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

  const reorderTodo = async (task: Task, direction: "up" | "down", pendingTasks: Task[]) => {
    const currentIndex = pendingTasks.findIndex((item) => item.id === task.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= pendingTasks.length) return;

    const reorderedColumn = [...pendingTasks];
    const [movedTask] = reorderedColumn.splice(currentIndex, 1);
    reorderedColumn.splice(targetIndex, 0, movedTask);
    let pendingIndex = 0;
    const reorderedTasks = tasks.map((item) =>
      item.status === "PENDING" ? reorderedColumn[pendingIndex++] : item
    );

    setTasks(reorderedTasks);
    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: reorderedTasks.map((item) => item.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save task order");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save task order");
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

  const columns: {
    status: Task["status"];
    title: string;
    description: string;
    color: string;
    dot: string;
  }[] = [
    { status: "PENDING", title: "To do", description: "Tasks waiting to be started", color: "bg-slate-100", dot: "bg-slate-500" },
    { status: "IN_PROGRESS", title: "In progress", description: "Tasks currently being worked on", color: "bg-blue-50", dot: "bg-blue-500" },
    { status: "COMPLETED", title: "Completed", description: "Finished tasks", color: "bg-emerald-50", dot: "bg-emerald-500" },
  ];

  const priorityStyle = {
    HIGH: "bg-rose-100 text-rose-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-indigo-100 text-indigo-700",
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">Back to dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Tasks</h1>
            <p className="mt-1 text-sm text-slate-500">Plan, prioritize, and keep your work moving.</p>
          </div>
          <button type="button" onClick={() => setShowCreateForm((current) => !current)} className="inline-flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900">
            <PlusIcon className="h-4 w-4" /> Add task
          </button>
        </header>

        {showCreateForm && (
          <form id="add-task" onSubmit={submitTask} className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Create a task</h2>
              <button type="button" onClick={() => setShowCreateForm(false)} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Cancel
              </button>
            </div>
            {renderFormFields(form, setForm)}
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Add task"}
            </button>
          </form>
        )}

        <section className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className={inputClass} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass}>
            <option value="ALL">All tasks</option><option value="PENDING">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="OVERDUE">Overdue</option><option value="HIGH">High priority</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass}>
            <option value="MANUAL">My order</option><option value="NEWEST">Newest</option><option value="OLDEST">Oldest</option><option value="DUE_DATE">Due date</option><option value="PRIORITY">Priority</option>
          </select>
        </section>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-500">Quick filters:</span>
          {[
            { value: "ALL", label: "All tasks" },
            { value: "OVERDUE", label: "Overdue" },
            { value: "HIGH", label: "High priority" },
          ].map((quickFilter) => (
            <button
              key={quickFilter.value}
              type="button"
              onClick={() => setFilter(quickFilter.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === quickFilter.value
                  ? quickFilter.value === "OVERDUE"
                    ? "border-rose-200 bg-rose-100 text-rose-700"
                    : quickFilter.value === "HIGH"
                      ? "border-amber-200 bg-amber-100 text-amber-700"
                      : "border-blue-200 bg-blue-100 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {quickFilter.label}
            </button>
          ))}
          {filter !== "ALL" && (
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className="text-xs font-medium text-slate-400 hover:text-slate-700"
            >
              Clear filter
            </button>
          )}
        </div>

        {message && <p className="mb-4 text-red-600">{message}</p>}
        {loading ? <p className="text-slate-600">Loading tasks...</p> : (
          <div className="grid items-start gap-5 xl:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = visibleTasks.filter((task) => task.status === column.status);
              const pendingTasks = tasks.filter((task) => task.status === "PENDING");
              return (
                <section key={column.status} className={`rounded-2xl p-3 ${column.color}`}>
                  <div className="mb-3 flex items-start justify-between px-2 pt-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                        <h2 className="font-semibold text-slate-800">{column.title}</h2>
                        <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-xs font-semibold text-slate-500">{columnTasks.length}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{column.description}</p>
                    </div>
                    <button type="button" aria-label={`Add task to ${column.title}`} onClick={() => setShowCreateForm(true)} className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-slate-800">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/40 p-5 text-center text-sm text-slate-500">No tasks here</div>
                    ) : columnTasks.map((task) => (
                      <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${priorityStyle[task.priority]}`}>{task.priority}</span>
                          {task.category && <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-[11px] font-semibold text-fuchsia-700">{task.category}</span>}
                          {task.dueDate && <span className={isOverdue(task) ? "rounded-md bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700" : "rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"}>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                          {task.status === "PENDING" && (
                            <div className="ml-auto flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                              <button
                                type="button"
                                aria-label="Move task up"
                                disabled={busyTaskId === task.id || pendingTasks.findIndex((item) => item.id === task.id) === 0}
                                onClick={() => { setSort("MANUAL"); void reorderTodo(task, "up", pendingTasks); }}
                                className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ChevronUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Move task down"
                                disabled={busyTaskId === task.id || pendingTasks.findIndex((item) => item.id === task.id) === pendingTasks.length - 1}
                                onClick={() => { setSort("MANUAL"); void reorderTodo(task, "down", pendingTasks); }}
                                className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold leading-6 ${task.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.title}</h3>
                          <div className="flex shrink-0 items-center gap-1">
                            <div className="relative">
                              <button type="button" aria-expanded={openMenuTaskId === task.id} onClick={(event) => { event.stopPropagation(); setOpenMenuTaskId((current) => current === task.id ? null : task.id); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><EllipsisHorizontalIcon className="h-5 w-5" /></button>
                              {openMenuTaskId === task.id && <div onClick={(event) => event.stopPropagation()} className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg">
                                <button type="button" disabled={busyTaskId === task.id} onClick={() => { setOpenMenuTaskId(null); beginEdit(task); }} className="w-full rounded px-2 py-1.5 text-left font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50">Edit</button>
                                <button type="button" disabled={busyTaskId === task.id} onClick={() => { setOpenMenuTaskId(null); void deleteTask(task.id); }} className="w-full rounded px-2 py-1.5 text-left font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                              </div>}
                            </div>
                          </div>
                        </div>
                        {task.description && <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">{task.description}</p>}
                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs font-medium text-slate-500"><span>Progress</span><span>{task.status === "COMPLETED" ? "100%" : task.status === "IN_PROGRESS" ? "50%" : "0%"}</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full transition-all ${task.status === "COMPLETED" ? "w-full bg-emerald-500" : task.status === "IN_PROGRESS" ? "w-1/2 bg-blue-500" : "w-0"}`} /></div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            {task.status === "PENDING" && <button type="button" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "IN_PROGRESS")} className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">Start</button>}
                            {task.status === "IN_PROGRESS" && (
                              <>
                                <button type="button" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "PENDING")} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
                                <button type="button" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "COMPLETED")} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"><CheckCircleIcon className="h-4 w-4" /> Complete</button>
                              </>
                            )}
                            {task.status === "COMPLETED" && <button type="button" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "PENDING")} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">Reopen</button>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-lg space-y-3 rounded-lg bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="text-xl font-semibold">Edit task</h2>
            {renderFormFields(editingForm, setEditingForm)}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded border px-4 py-2">Cancel</button>
              <button type="submit" disabled={saving} className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
