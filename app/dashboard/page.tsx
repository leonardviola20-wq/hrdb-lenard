"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string | null;
  dueDate: string | null;
  createdAt: string;
};

type TaskFilter = "PENDING" | "COMPLETED" | "OVERDUE";

type TaskForm = {
  title: string;
  description: string;
  priority: Task["priority"];
  category: string;
  dueDate: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
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

  const reorderTasks = async (taskId: number) => {
    if (draggedTaskId === null || draggedTaskId === taskId) return;
    const draggedIndex = selectedTasks.findIndex((task) => task.id === draggedTaskId);
    const targetIndex = selectedTasks.findIndex((task) => task.id === taskId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const reorderedSelected = [...selectedTasks];
    const [draggedTask] = reorderedSelected.splice(draggedIndex, 1);
    reorderedSelected.splice(targetIndex, 0, draggedTask);
    let selectedIndex = 0;
    const reorderedTasks = tasks.map((task) =>
      selectedTasks.some((selected) => selected.id === task.id)
        ? reorderedSelected[selectedIndex++]
        : task
    );
    setTasks(reorderedTasks);
    setDraggedTaskId(null);
    setDragOverTaskId(null);

    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: reorderedTasks.map((task) => task.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save task order");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Unable to save task order");
    }
  };

  const taskCardClass = (filter: TaskFilter) => {
    return `rounded-lg border border-gray-300 bg-white p-5 text-left shadow transition hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-700 ${
      selectedFilter === filter ? "ring-2 ring-gray-700" : ""
    }`;
  };

  const updateTask = async (task: Task, changes: Partial<Task>) => {
    setBusyTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update task");
      const updatedTask = { ...task, ...changes } as Task;
      setTasks((current) => {
        const nextTasks = current.map((item) => (item.id === task.id ? updatedTask : item));
        setTaskSummary({
          total: nextTasks.length,
          pending: nextTasks.filter((item) => item.status === "PENDING").length,
          completed: nextTasks.filter((item) => item.status === "COMPLETED").length,
          overdue: nextTasks.filter(
            (item) =>
              item.status === "PENDING" &&
              !!item.dueDate &&
              new Date(item.dueDate) < new Date()
          ).length,
        });
        return nextTasks;
      });
      setSelectedTask(updatedTask);
      return true;
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task");
      return false;
    } finally {
      setBusyTaskId(null);
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
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
    if (!editingTask || !editingForm) return;
    const changes = {
      ...editingForm,
      description: editingForm.description || null,
      category: editingForm.category || null,
      dueDate: editingForm.dueDate
        ? new Date(`${editingForm.dueDate}T00:00:00`).toISOString()
        : null,
    };
    if (await updateTask(editingTask, changes)) {
      setEditingTask(null);
      setEditingForm(null);
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;
    setBusyTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete task");
      setTasks((current) => {
        const nextTasks = current.filter((item) => item.id !== task.id);
        setTaskSummary({
          total: nextTasks.length,
          pending: nextTasks.filter((item) => item.status === "PENDING").length,
          completed: nextTasks.filter((item) => item.status === "COMPLETED").length,
          overdue: nextTasks.filter(
            (item) =>
              item.status === "PENDING" &&
              !!item.dueDate &&
              new Date(item.dueDate) < new Date()
          ).length,
        });
        return nextTasks;
      });
      setSelectedTask(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete task");
    } finally {
      setBusyTaskId(null);
    }
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
            href="/tasks#add-task"
            className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100"
          >
            Add task
          </Link>
          <Link
            href="/contacts"
            className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100"
          >
            Office contacts
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
            className={taskCardClass("PENDING")}
          >
            <p className="text-sm text-gray-600">Pending tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskSummary.pending}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("COMPLETED")}
            className={taskCardClass("COMPLETED")}
          >
            <p className="text-sm text-gray-600">Completed tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskSummary.completed}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("OVERDUE")}
            className={taskCardClass("OVERDUE")}
          >
            <p className="text-sm text-gray-600">Overdue tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
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
                  <li
                    key={task.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedTaskId !== task.id) setDragOverTaskId(task.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverTaskId === task.id) setDragOverTaskId(null);
                    }}
                    onDrop={() => reorderTasks(task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverTaskId(null);
                    }}
                    className={`py-3 first:pt-0 last:pb-0 ${
                      selectedTask?.id === task.id ? "rounded-lg bg-gray-50" : ""
                    } ${
                      draggedTaskId === task.id ? "opacity-50" : ""
                    }`}
                  >
                    {dragOverTaskId === task.id && draggedTaskId !== task.id && (
                      <div
                        aria-hidden="true"
                        className="mb-2 h-1 rounded-full bg-gray-700 animate-pulse"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        draggable
                        role="button"
                        tabIndex={0}
                        aria-label={`Drag ${task.title}`}
                        title="Drag to reorder"
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverTaskId(null);
                        }}
                        className="flex shrink-0 cursor-grab touch-none rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
                      >
                        <svg
                          aria-hidden="true"
                          width="16"
                          height="18"
                          viewBox="0 0 16 18"
                          fill="currentColor"
                        >
                          <circle cx="4" cy="3" r="1.5" />
                          <circle cx="12" cy="3" r="1.5" />
                          <circle cx="4" cy="9" r="1.5" />
                          <circle cx="12" cy="9" r="1.5" />
                          <circle cx="4" cy="15" r="1.5" />
                          <circle cx="12" cy="15" r="1.5" />
                        </svg>
                      </span>
                      <button
                        type="button"
                        aria-expanded={selectedTask?.id === task.id}
                        onClick={() =>
                          setSelectedTask((current) =>
                            current?.id === task.id ? null : task
                          )
                        }
                        className="min-w-0 flex-1 rounded p-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-700"
                      >
                        <p
                          className={`font-medium ${
                            task.status === "COMPLETED"
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </p>
                      </button>
                    </div>
                    {selectedTask?.id === task.id && (
                      <div className="border-t border-gray-200 px-3 pb-3 pt-4">
                        <p className="text-sm text-gray-500">Task details</p>
                        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-gray-500">Status</dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {task.status === "COMPLETED" ? "Completed" : "Pending"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Priority</dt>
                            <dd className="mt-1 font-medium text-gray-900">{task.priority}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Category</dt>
                            <dd className="mt-1 text-gray-900">{task.category || "None"}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Due date</dt>
                            <dd className="mt-1 text-gray-900">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "No due date"}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500">Description</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-gray-900">
                              {task.description || "No description"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Created</dt>
                            <dd className="mt-1 text-gray-900">
                              {new Date(task.createdAt).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyTaskId === task.id}
                            onClick={() =>
                              updateTask(task, {
                                status:
                                  task.status === "COMPLETED" ? "PENDING" : "COMPLETED",
                              })
                            }
                            className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                          >
                            {task.status === "COMPLETED"
                              ? "Mark pending"
                              : "Mark complete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(task)}
                            className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyTaskId === task.id}
                            onClick={() => deleteTask(task)}
                            className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {selectedTasks.length > 1 && (
              <p className="mt-4 text-xs text-gray-500">
                Drag the six-dot handle to change the order.
              </p>
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
            {editingTask && editingForm && (
              <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
                <form onSubmit={saveEdit} className="grid w-full max-w-lg gap-3 rounded-lg bg-white p-6 shadow-xl">
                  <h2 className="text-xl font-semibold text-gray-900">Edit task</h2>
                  <input required value={editingForm.title} onChange={(event) => setEditingForm({ ...editingForm, title: event.target.value })} className="w-full rounded border border-gray-400 p-2 text-gray-900" />
                  <textarea value={editingForm.description} onChange={(event) => setEditingForm({ ...editingForm, description: event.target.value })} rows={3} placeholder="Description" className="w-full rounded border border-gray-400 p-2 text-gray-900" />
                  <select value={editingForm.priority} onChange={(event) => setEditingForm({ ...editingForm, priority: event.target.value as Task["priority"] })} className="w-full rounded border border-gray-400 p-2 text-gray-900">
                    <option value="LOW">Low priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="HIGH">High priority</option>
                  </select>
                  <input value={editingForm.category} onChange={(event) => setEditingForm({ ...editingForm, category: event.target.value })} placeholder="Category" className="w-full rounded border border-gray-400 p-2 text-gray-900" />
                  <input type="date" value={editingForm.dueDate} onChange={(event) => setEditingForm({ ...editingForm, dueDate: event.target.value })} className="w-full rounded border border-gray-400 p-2 text-gray-900" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setEditingTask(null); setEditingForm(null); }} className="rounded border border-gray-500 bg-white px-4 py-2 text-gray-900 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100">Save changes</button>
                  </div>
                </form>
              </div>
            )}
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
