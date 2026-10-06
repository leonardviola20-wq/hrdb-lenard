"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  PlayIcon,
  XMarkIcon,
  CalendarDaysIcon,
  FlagIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { RECURRENCE_OPTIONS, type TaskRecurrence } from "@/lib/taskRecurrence";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string | null;
  notes: string | null;
  recurrence: TaskRecurrence;
  recurrenceAnchor: string | null;
  isFlagged: boolean;
  dueDate: string | null;
  createdAt: string;
  rescheduleHistory: TaskReschedule[];
  prerequisites: TaskPrerequisite[];
};

type TaskReschedule = {
  id: number;
  previousDueDate: string | null;
  newDueDate: string | null;
  reason: string;
  createdAt: string;
};

type TaskPrerequisite = { id: number; title: string; isCompleted: boolean; createdAt: string };

type TaskForm = {
  title: string;
  description: string;
  priority: Task["priority"];
  category: string;
  notes: string;
  recurrence: TaskRecurrence;
  repeatDay: string;
  repeatMonth: string;
  isFlagged: boolean;
  dueDate: string;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  category: "",
  notes: "",
  recurrence: "NONE",
  repeatDay: "",
  repeatMonth: "",
  isFlagged: false,
  dueDate: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function describeRecurrence(task: Task) {
  const anchor = task.recurrenceAnchor ? new Date(task.recurrenceAnchor) : task.dueDate ? new Date(task.dueDate) : null;
  if (task.recurrence === "NONE") return "Does not repeat";
  if (task.recurrence === "DAILY") return "Daily";
  if (task.recurrence === "WEEKLY") {
    const weekday = anchor ? new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(anchor) : "same weekday";
    return `Weekly on ${weekday}`;
  }
  if (task.recurrence === "MONTHLY") return `Monthly on day ${anchor?.getUTCDate() ?? "not set"}`;
  const month = anchor ? new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(anchor) : "month not set";
  return `Yearly on ${month} ${anchor?.getUTCDate() ?? ""}`.trim();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editing, setEditing] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm>(emptyForm);
  const [editRescheduleReason, setEditRescheduleReason] = useState("");
  const [postponingTask, setPostponingTask] = useState<Task | null>(null);
  const [postponeDate, setPostponeDate] = useState("");
  const [postponeReason, setPostponeReason] = useState("");
  const [prerequisiteDraft, setPrerequisiteDraft] = useState("");
  const [pendingPrerequisites, setPendingPrerequisites] = useState<string[]>([]);
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
        if (!cancelled) setTasks(data.tasks.map((task: Task) => ({
          ...task,
          notes: task.notes || null,
          recurrence: task.recurrence || "NONE",
          isFlagged: Boolean(task.isFlagged),
          rescheduleHistory: task.rescheduleHistory || [],
          prerequisites: task.prerequisites || [],
        })));
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
          task.notes?.toLowerCase().includes(normalizedQuery) ||
          task.category?.toLowerCase().includes(normalizedQuery);
        const matchesFilter =
          filter === "ALL" ||
          (filter === "OVERDUE" && isOverdue(task)) ||
          (filter === "PENDING" && task.status === "PENDING") ||
          (filter === "IN_PROGRESS" && task.status === "IN_PROGRESS") ||
          (filter === "COMPLETED" && task.status === "COMPLETED") ||
          (filter === "HIGH" && task.priority === "HIGH") ||
          (filter === "FLAGGED" && task.isFlagged);
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
      setTasks((current) => [{ ...data.task, rescheduleHistory: [], prerequisites: [] }, ...current]);
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
      if (status !== task.status && filter === task.status) setFilter("ALL");
      setTasks((current) => [
        ...current.map((item) => item.id === task.id
          ? { ...item, status }
          : item),
        ...(data.nextTask ? [{ ...data.nextTask, rescheduleHistory: [], prerequisites: [] } as Task] : []),
      ]);
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
      setTasks((current) => current
        .filter((task) => task.id !== id)
        .map((task) => ({ ...task, prerequisites: task.prerequisites.filter((prerequisite) => prerequisite.id !== id) })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete task");
    } finally {
      setBusyTaskId(null);
    }
  };

  const reorderTasks = async (task: Task, direction: "up" | "down", orderedGroup: Task[]) => {
    const currentIndex = orderedGroup.findIndex((item) => item.id === task.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedGroup.length) return;

    const reorderedGroup = [...orderedGroup];
    const [movedTask] = reorderedGroup.splice(currentIndex, 1);
    reorderedGroup.splice(targetIndex, 0, movedTask);
    const reorderedIds = new Set(orderedGroup.map((item) => item.id));
    let groupIndex = 0;
    const reorderedTasks = tasks.map((item) =>
      reorderedIds.has(item.id) ? reorderedGroup[groupIndex++] : item
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
    setEditRescheduleReason("");
    setEditingForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      notes: task.notes || "",
      recurrence: task.recurrence || "NONE",
      repeatDay: task.recurrenceAnchor || task.dueDate ? String(new Date(task.recurrenceAnchor || task.dueDate!).getUTCDate()) : "",
      repeatMonth: task.recurrenceAnchor || task.dueDate ? String(new Date(task.recurrenceAnchor || task.dueDate!).getUTCMonth() + 1) : "",
      isFlagged: Boolean(task.isFlagged),
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const dueDateChanged = editingForm.dueDate !== (editing.dueDate ? editing.dueDate.slice(0, 10) : "");
    if (dueDateChanged && !editRescheduleReason.trim()) {
      setMessage("Add a reason when changing the due date.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingForm,
          ...(dueDateChanged ? { rescheduleReason: editRescheduleReason.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to edit task");
      setTasks((current) => current.map((task) => task.id === editing.id ? {
        ...task,
        title: editingForm.title,
        priority: editingForm.priority,
        recurrence: editingForm.recurrence,
        isFlagged: editingForm.isFlagged,
        description: editingForm.description || null,
        notes: editingForm.notes || null,
        category: editingForm.category || null,
        dueDate: editingForm.dueDate ? new Date(editingForm.dueDate).toISOString() : null,
        recurrenceAnchor: data.task.recurrenceAnchor,
        rescheduleHistory: data.reschedule ? [data.reschedule, ...task.rescheduleHistory] : task.rescheduleHistory,
      } : task));
      setEditing(null);
      setEditRescheduleReason("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to edit task");
    } finally {
      setSaving(false);
    }
  };

  const beginPostpone = (task: Task) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let newDueDate = tomorrow;
    if (task.dueDate) {
      const currentDueDate = new Date(task.dueDate);
      if (dateInputValue(currentDueDate) >= dateInputValue(tomorrow)) {
        newDueDate = new Date(currentDueDate);
        newDueDate.setDate(newDueDate.getDate() + 1);
      }
    }
    setPostponingTask(task);
    setPostponeDate(dateInputValue(newDueDate));
    setPostponeReason("");
    setPrerequisiteDraft("");
    setPendingPrerequisites([]);
    setMessage("");
  };

  const savePostponement = async (event: FormEvent) => {
    event.preventDefault();
    if (!postponingTask) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${postponingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: postponeDate,
          rescheduleReason: postponeReason.trim(),
          preserveRecurrenceSchedule: true,
          prerequisitesToAdd: [
            ...pendingPrerequisites,
            ...(prerequisiteDraft.trim() ? [prerequisiteDraft.trim()] : []),
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to postpone task");
      setTasks((current) => current.map((task) => task.id === postponingTask.id ? {
        ...task,
        dueDate: data.task.dueDate,
        rescheduleHistory: data.reschedule ? [data.reschedule, ...task.rescheduleHistory] : task.rescheduleHistory,
        prerequisites: [...task.prerequisites, ...(data.addedPrerequisites || [])],
      } : task));
      setPostponingTask(null);
      setPostponeReason("");
      setPendingPrerequisites([]);
      setPrerequisiteDraft("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to postpone task");
    } finally {
      setSaving(false);
    }
  };

  const updatePrerequisite = async (task: Task, prerequisite: TaskPrerequisite, isCompleted: boolean) => {
    setBusyTaskId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}/prerequisites/${prerequisite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update prerequisite");
      const updatedPrerequisite = data.prerequisite as TaskPrerequisite;
      setTasks((current) => current.map((item) => item.id === task.id
        ? { ...item, prerequisites: item.prerequisites.map((step) => step.id === prerequisite.id ? updatedPrerequisite : step) }
        : item));
      setPostponingTask((current) => current?.id === task.id
        ? { ...current, prerequisites: current.prerequisites.map((step) => step.id === prerequisite.id ? updatedPrerequisite : step) }
        : current);
      setEditing((current) => current?.id === task.id
        ? { ...current, prerequisites: current.prerequisites.map((step) => step.id === prerequisite.id ? updatedPrerequisite : step) }
        : current);
      setViewingTask((current) => current?.id === task.id
        ? { ...current, prerequisites: current.prerequisites.map((step) => step.id === prerequisite.id ? updatedPrerequisite : step) }
        : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update prerequisite");
    } finally {
      setBusyTaskId(null);
    }
  };

  const renderScheduleFields = (values: TaskForm, setValues: (value: TaskForm) => void) => {
    const dueDateForAnchor = values.dueDate ? new Date(`${values.dueDate}T00:00:00Z`) : new Date();
    const repeatDay = values.repeatDay || String(dueDateForAnchor.getUTCDate());
    const repeatMonth = values.repeatMonth || String(dueDateForAnchor.getUTCMonth() + 1);
    const monthDayCount = new Date(Date.UTC(2000, Number(repeatMonth), 0)).getUTCDate();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1);

    return <section className="space-y-4 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-800">Schedule</h3>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Priority</span>
          <select value={values.priority} onChange={(e) => setValues({ ...values, priority: e.target.value as Task["priority"] })} className={inputClass}>
            <option value="LOW">Low priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="HIGH">High priority</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Category</span>
          <input value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} placeholder="e.g. Office" maxLength={60} className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 min-[420px]:col-span-2">
          <span>{values.recurrence === "NONE" ? "Due date" : "First due date"}</span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(e) => {
              const nextDueDate = e.target.value;
              const anchorDate = nextDueDate ? new Date(`${nextDueDate}T00:00:00Z`) : null;
              setValues({
                ...values,
                dueDate: nextDueDate,
                repeatDay: values.repeatDay || (anchorDate ? String(anchorDate.getUTCDate()) : ""),
                repeatMonth: values.repeatMonth || (anchorDate ? String(anchorDate.getUTCMonth() + 1) : ""),
              });
            }}
            required={values.recurrence !== "NONE"}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Repeat</span>
          <select value={values.recurrence} onChange={(e) => {
            const recurrence = e.target.value as TaskRecurrence;
            const firstDueDate = values.dueDate ? new Date(`${values.dueDate}T00:00:00Z`) : null;
            setValues({
              ...values,
              recurrence,
              repeatDay: values.repeatDay || (firstDueDate ? String(firstDueDate.getUTCDate()) : ""),
              repeatMonth: values.repeatMonth || (firstDueDate ? String(firstDueDate.getUTCMonth() + 1) : ""),
            });
          }} className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
            {RECURRENCE_OPTIONS.map((option) => <option key={option} value={option}>{option === "NONE" ? "Does not repeat" : option.charAt(0) + option.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
          <input type="checkbox" checked={values.isFlagged} onChange={(e) => setValues({ ...values, isFlagged: e.target.checked })} className="h-4 w-4 accent-blue-700" />
          <FlagIcon className="h-4 w-4 text-rose-600" /> Flag task
        </label>
      </div>
      {values.recurrence === "DAILY" && <p className="text-xs text-slate-500">Repeats every day after the first due date.</p>}
      {values.recurrence === "WEEKLY" && <p className="text-xs text-slate-500">Repeats weekly on the same weekday as the first due date.</p>}
      {values.recurrence === "MONTHLY" && <div className="rounded-lg border border-slate-200 bg-white p-3">
        <label className="grid max-w-48 gap-1.5 text-sm font-medium text-slate-700">
          <span>Repeat on day</span>
          <select value={repeatDay} onChange={(e) => setValues({ ...values, repeatDay: e.target.value })} className={inputClass}>
            {dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </label>
        <p className="mt-1.5 text-xs text-slate-500">Shorter months use their last day.</p>
      </div>}
      {values.recurrence === "YEARLY" && <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Repeat every year in</span>
            <select value={repeatMonth} onChange={(e) => {
              const nextMonth = e.target.value;
              const maxDay = new Date(Date.UTC(2000, Number(nextMonth), 0)).getUTCDate();
              setValues({ ...values, repeatMonth: nextMonth, repeatDay: String(Math.min(Number(repeatDay), maxDay)) });
            }} className={inputClass}>
              {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Day</span>
            <select value={repeatDay} onChange={(e) => setValues({ ...values, repeatDay: e.target.value })} className={inputClass}>
              {dayOptions.slice(0, monthDayCount).map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            {repeatMonth === "2" && repeatDay === "29" && <span className="text-xs font-normal text-slate-500">Non-leap years use February 28.</span>}
          </label>
        </div>
      </div>}
    </section>;
  };

  const renderFormFields = (values: TaskForm, setValues: (value: TaskForm) => void, showNotes = true, showSchedule = true) => (
    <>
      <input value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="Task title" maxLength={120} required className={inputClass} />
      <textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Description (optional)" maxLength={500} rows={3} className={inputClass} />
      {showNotes && <textarea value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} placeholder="Notes (optional)" maxLength={2000} rows={2} className={inputClass} />}
      {showSchedule && renderScheduleFields(values, setValues)}
    </>
  );

  const columns: {
    status: Task["status"];
    title: string;
    description: string;
    color: string;
    dot: string;
  }[] = [
    { status: "IN_PROGRESS", title: "In progress", description: "Tasks currently being worked on", color: "bg-blue-50", dot: "bg-blue-500" },
    { status: "PENDING", title: "To do", description: "Tasks waiting to be started", color: "bg-slate-100", dot: "bg-slate-500" },
    { status: "COMPLETED", title: "Completed", description: "Finished tasks", color: "bg-emerald-50", dot: "bg-emerald-500" },
  ];

  const priorityStyle = {
    HIGH: "bg-rose-100 text-rose-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-indigo-100 text-indigo-700",
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 sm:p-5">
      <div className="w-full min-w-0">
        <div className="mb-4 grid grid-cols-2 items-center gap-2 md:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]">
          <Link
            href="/dashboard"
            onClick={(event) => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                event.preventDefault();
                window.dispatchEvent(new Event("hrdb-open-sidebar"));
              }
            }}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </Link>
          <button type="button" onClick={() => setShowCreateForm((current) => !current)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900">
            <PlusIcon className="h-4 w-4" /> Add task
          </button>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." className={`${inputClass} h-10 col-span-2 md:col-span-1`} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputClass} h-10`}>
            <option value="ALL">All tasks</option><option value="PENDING">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="OVERDUE">Overdue</option><option value="HIGH">High priority</option><option value="FLAGGED">Flagged</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputClass} h-10`}>
            <option value="MANUAL">My order</option><option value="NEWEST">Newest</option><option value="OLDEST">Oldest</option><option value="DUE_DATE">Due date</option><option value="PRIORITY">Priority</option>
          </select>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setShowCreateForm(false)}>
          <form id="add-task" role="dialog" aria-modal="true" aria-labelledby="create-task-title" onClick={(event) => event.stopPropagation()} onSubmit={submitTask} className="my-auto max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 text-slate-900 shadow-xl sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <h2 id="create-task-title" className="text-lg font-semibold">Create a task</h2>
                <button type="button" aria-label="Close create task dialog" onClick={() => setShowCreateForm(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              {renderFormFields(form, setForm)}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Saving..." : "Add task"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-slate-500">Quick filters:</span>
          {[
            { value: "ALL", label: "All tasks" },
            { value: "PENDING", label: "To do" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "OVERDUE", label: "Overdue" },
            { value: "HIGH", label: "High priority" },
            { value: "FLAGGED", label: "Flagged" },
          ].map((quickFilter) => (
            <button
              key={quickFilter.value}
              type="button"
              onClick={() => setFilter(quickFilter.value)}
              className={`${filter !== "ALL" && filter !== quickFilter.value ? "hidden" : "inline-flex"} rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === quickFilter.value
                  ? quickFilter.value === "OVERDUE"
                    ? "border-rose-200 bg-rose-100 text-rose-700"
                    : quickFilter.value === "HIGH"
                      ? "border-amber-200 bg-amber-100 text-amber-700"
                      : quickFilter.value === "FLAGGED"
                        ? "border-rose-200 bg-rose-100 text-rose-700"
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
        {loading ? <p className="text-slate-600">Loading tasks...</p> : visibleTasks.length === 0 && filter !== "ALL" ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No tasks match this filter.</p>
        ) : (
          <div className="space-y-3">
            {columns.map((column) => {
              const columnTasks = visibleTasks.filter((task) => task.status === column.status);
              if (filter !== "ALL" && columnTasks.length === 0) return null;
              return (
                <section key={column.status} className={`rounded-xl p-2.5 ${column.color}`}>
                  <div className="mb-2 flex items-start justify-between px-1.5 pt-0.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                        <h2 className="font-semibold text-slate-800">{column.title}</h2>
                        <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-xs font-semibold text-slate-500">{columnTasks.length}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{column.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/40 p-5 text-center text-sm text-slate-500">No tasks here</div>
                    ) : columnTasks.map((task) => {
                      const completedPrerequisites = task.prerequisites.filter((prerequisite) => prerequisite.isCompleted).length;
                      const incompletePrerequisites = task.prerequisites.length - completedPrerequisites;
                      const prerequisiteProgress = task.prerequisites.length > 0
                        ? Math.round((completedPrerequisites / task.prerequisites.length) * 50)
                        : 0;
                      const progress = task.status === "COMPLETED"
                        ? 100
                        : task.status === "IN_PROGRESS"
                          ? 50 + prerequisiteProgress
                          : prerequisiteProgress;
                      return (
                      <article key={task.id} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${priorityStyle[task.priority]}`}>{task.priority}</span>
                          {task.isFlagged && <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700"><FlagIcon className="h-3 w-3" /> Flagged</span>}
                          {task.recurrence && task.recurrence !== "NONE" && <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">{task.recurrence.charAt(0) + task.recurrence.slice(1).toLowerCase()}</span>}
                          {task.category && <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-[11px] font-semibold text-fuchsia-700">{task.category}</span>}
                          {task.dueDate && <span className={isOverdue(task) ? "rounded-md bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700" : "rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"}>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                          {task.rescheduleHistory.length > 0 && <span title={task.rescheduleHistory[0].reason} className="rounded-md bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">Rescheduled</span>}
                          {incompletePrerequisites > 0 && <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">Prerequisites</span>}
                          {task.status !== "COMPLETED" && (
                            <div className="ml-auto flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
                              <button
                                type="button"
                                aria-label="Move task up"
                                disabled={busyTaskId === task.id || columnTasks.findIndex((item) => item.id === task.id) === 0}
                                onClick={() => { setSort("MANUAL"); void reorderTasks(task, "up", columnTasks); }}
                                className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ChevronUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Move task down"
                                disabled={busyTaskId === task.id || columnTasks.findIndex((item) => item.id === task.id) === columnTasks.length - 1}
                                onClick={() => { setSort("MANUAL"); void reorderTasks(task, "down", columnTasks); }}
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
                                <button type="button" disabled={busyTaskId === task.id} onClick={() => { setOpenMenuTaskId(null); void deleteTask(task.id); }} className="w-full rounded px-2 py-1.5 text-left font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                              </div>}
                            </div>
                          </div>
                        </div>
                        {task.prerequisites.length > 0 && <p className={`mt-1 text-xs ${incompletePrerequisites > 0 ? "text-amber-800" : "text-slate-500"}`}>
                          Prerequisites: {completedPrerequisites}/{task.prerequisites.length} complete
                        </p>}
                        {task.description && <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">{task.description}</p>}
                        {task.notes && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">Note: {task.notes}</p>}
                        <div className="mt-auto pt-3">
                          <div className="mb-1 flex justify-between text-xs font-medium text-slate-500"><span>Progress</span><span>{progress}%</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} /></div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <span className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            <button type="button" aria-label="View task" title="View task" onClick={() => setViewingTask(task)} className="rounded-md p-1 text-blue-600 hover:bg-blue-50">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button type="button" aria-label="Update task" title="Update task" disabled={busyTaskId === task.id} onClick={() => beginEdit(task)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            {task.status !== "COMPLETED" && <>
                              <button type="button" aria-label="Update task" title="Update task" disabled={busyTaskId === task.id} onClick={() => beginPostpone(task)} className="rounded-md p-1 text-amber-700 hover:bg-amber-50 disabled:opacity-50"><CalendarDaysIcon className="h-4 w-4" /></button>
                            </>}
                            {task.status === "PENDING" && <button type="button" aria-label="Start task" title="Start task" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "IN_PROGRESS")} className="rounded-md p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-30"><PlayIcon className="h-4 w-4" /></button>}
                            {task.status === "IN_PROGRESS" && (
                              <>
                                <button type="button" aria-label="Cancel task" title="Cancel task" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "PENDING")} className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><XMarkIcon className="h-4 w-4" /></button>
                                <button type="button" aria-label="Complete task" title={incompletePrerequisites > 0 ? "Complete prerequisites first" : "Complete task"} disabled={busyTaskId === task.id || incompletePrerequisites > 0} onClick={() => updateStatus(task, "COMPLETED")} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"><CheckCircleIcon className="h-4 w-4" /></button>
                              </>
                            )}
                            {task.status === "COMPLETED" && <button type="button" aria-label="Reopen task" title="Reopen task" disabled={busyTaskId === task.id} onClick={() => updateStatus(task, "PENDING")} className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><ArrowUturnLeftIcon className="h-4 w-4" /></button>}
                          </div>
                        </div>
                      </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {viewingTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewingTask(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="view-task-title" onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 text-slate-900 shadow-xl sm:p-6">
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="min-w-0">
              <h2 id="view-task-title" className="break-words text-xl font-semibold">{viewingTask.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Task details</p>
            </div>
            <button type="button" aria-label="Close task details" onClick={() => setViewingTask(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><XMarkIcon className="h-5 w-5" /></button>
          </header>
          <dl className="mt-4 grid gap-x-5 gap-y-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt><dd className="mt-1 font-medium">{viewingTask.status === "PENDING" ? "To do" : viewingTask.status === "IN_PROGRESS" ? "In progress" : "Completed"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</dt><dd className="mt-1 font-medium">{viewingTask.priority}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt><dd className="mt-1 font-medium">{viewingTask.category || "Not set"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</dt><dd className="mt-1 font-medium">{viewingTask.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString() : "Not set"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repeat</dt><dd className="mt-1 font-medium">{describeRecurrence(viewingTask)}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flagged</dt><dd className="mt-1 font-medium">{viewingTask.isFlagged ? "Yes" : "No"}</dd></div>
            {viewingTask.description && <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap break-words">{viewingTask.description}</dd></div>}
            {viewingTask.notes && <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap break-words">{viewingTask.notes}</dd></div>}
          </dl>
          {viewingTask.rescheduleHistory.length > 0 && <details className="mt-4 rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Reschedule history ({viewingTask.rescheduleHistory.length})</summary>
            <ul className="mt-2 space-y-3">
              {viewingTask.rescheduleHistory.map((entry) => <li key={entry.id} className="border-t border-slate-100 pt-2 text-sm text-slate-600">
                <p className="font-medium">{entry.previousDueDate ? new Date(entry.previousDueDate).toLocaleDateString() : "No due date"} → {entry.newDueDate ? new Date(entry.newDueDate).toLocaleDateString() : "No due date"}</p>
                <p className="mt-0.5 text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
                <p className="mt-1 whitespace-pre-wrap">{entry.reason}</p>
              </li>)}
            </ul>
          </details>}
          {viewingTask.prerequisites.length > 0 && <section className="mt-4 rounded-lg border border-slate-200 p-3">
            <h3 className="text-sm font-semibold">Prerequisites</h3>
            <ul className="mt-2 space-y-2">
              {viewingTask.prerequisites.map((prerequisite) => <li key={prerequisite.id} className="flex items-start gap-2 text-sm">
                <span aria-hidden="true" className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${prerequisite.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{prerequisite.isCompleted ? "✓" : "•"}</span>
                <span className={prerequisite.isCompleted ? "text-slate-500 line-through" : "text-slate-800"}>{prerequisite.title}</span>
              </li>)}
            </ul>
          </section>}
          <footer className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setViewingTask(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Close</button>
            <button type="button" onClick={() => { beginEdit(viewingTask); setViewingTask(null); }} className="ml-2 rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Update</button>
          </footer>
        </section>
      </div>}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveEdit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 text-slate-900 shadow-xl sm:p-6">
            <h2 className="border-b border-slate-100 pb-3 text-xl font-semibold">Edit task</h2>
            {renderFormFields(editingForm, setEditingForm, false, false)}
            {editingForm.dueDate !== (editing.dueDate ? editing.dueDate.slice(0, 10) : "") && <label className="grid gap-1 text-sm font-medium text-gray-700">
              <span>Reason for changing due date</span>
              <textarea value={editRescheduleReason} onChange={(event) => setEditRescheduleReason(event.target.value)} maxLength={500} required rows={2} placeholder="Why does this task need a new due date?" className={inputClass} />
            </label>}
            <section className="space-y-2 rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-700">Status</h3>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {editing.status === "PENDING" ? "To do" : editing.status === "IN_PROGRESS" ? "In progress" : "Completed"}
              </span>
              {editing.rescheduleHistory.length > 0 && <details>
                <summary className="cursor-pointer pt-1 text-sm font-semibold text-slate-700">Reschedule history ({editing.rescheduleHistory.length})</summary>
                <ul className="mt-2 space-y-2">
                  {editing.rescheduleHistory.map((entry) => <li key={entry.id} className="border-t border-slate-100 pt-2 text-xs text-slate-600">
                    <p className="font-medium">{entry.previousDueDate ? new Date(entry.previousDueDate).toLocaleDateString() : "No due date"} → {entry.newDueDate ? new Date(entry.newDueDate).toLocaleDateString() : "No due date"} · {new Date(entry.createdAt).toLocaleString()}</p>
                    <p className="mt-1">{entry.reason}</p>
                  </li>)}
                </ul>
              </details>}
              {editing.prerequisites.length > 0 && <div className="border-t border-slate-100 pt-2">
                <h4 className="text-sm font-semibold text-slate-700">Prerequisites</h4>
                <ul className="mt-2 space-y-2">
                  {editing.prerequisites.map((prerequisite) => <li key={prerequisite.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={prerequisite.isCompleted}
                      disabled={busyTaskId === editing.id}
                      onChange={(event) => void updatePrerequisite(editing, prerequisite, event.target.checked)}
                      aria-label={`Mark prerequisite ${prerequisite.title} as ${prerequisite.isCompleted ? "incomplete" : "complete"}`}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <span className={prerequisite.isCompleted ? "text-slate-500 line-through" : "text-slate-700"}>{prerequisite.title}</span>
                  </li>)}
                </ul>
              </div>}
            </section>
            {renderScheduleFields(editingForm, setEditingForm)}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {postponingTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <form onSubmit={savePostponement} className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 text-slate-900 shadow-xl">
          <div>
            <h2 className="text-lg font-semibold">Update task</h2>
            <p className="mt-1 text-sm text-slate-500">{postponingTask.title}</p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            <span>New due date</span>
            <input type="date" value={postponeDate} onChange={(event) => setPostponeDate(event.target.value)} required className={inputClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            <span>Reason for postponing</span>
            <textarea value={postponeReason} onChange={(event) => setPostponeReason(event.target.value)} maxLength={500} required rows={3} placeholder="Why does this task need to move?" className={inputClass} />
          </label>
          <section className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Prerequisites before resuming</h3>
              <p className="mt-1 text-xs text-slate-500">Add steps needed before continuing this task. They count toward its progress.</p>
            </div>
            {postponingTask.prerequisites.length > 0 && <ul className="space-y-2">
              {postponingTask.prerequisites.map((prerequisite) => <li key={prerequisite.id} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={prerequisite.isCompleted}
                  onChange={(event) => void updatePrerequisite(postponingTask, prerequisite, event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue-700"
                />
                <span className={prerequisite.isCompleted ? "text-slate-400 line-through" : ""}>{prerequisite.title}</span>
              </li>)}
            </ul>}
            {pendingPrerequisites.length > 0 && <ul className="space-y-1 border-t border-slate-100 pt-2">
              {pendingPrerequisites.map((title, index) => <li key={`${title}-${index}`} className="text-sm text-slate-600">• {title} <span className="text-xs text-slate-400">(will be added)</span></li>)}
            </ul>}
            <div className="flex gap-2">
              <input
                value={prerequisiteDraft}
                onChange={(event) => setPrerequisiteDraft(event.target.value)}
                maxLength={200}
                placeholder="Add a required step"
                className={inputClass}
              />
              <button
                type="button"
                disabled={!prerequisiteDraft.trim()}
                onClick={() => {
                  const title = prerequisiteDraft.trim();
                  if (!title) return;
                  setPendingPrerequisites((current) => [...current, title]);
                  setPrerequisiteDraft("");
                }}
                className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-50"
              >Add step</button>
            </div>
          </section>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPostponingTask(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving..." : "Update task"}</button>
          </div>
        </form>
      </div>}

    </main>
  );
}
