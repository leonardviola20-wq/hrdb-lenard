import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getRecurrenceAnchor, isTaskRecurrence, isValidRepeatDay, type TaskRecurrence } from "@/lib/taskRecurrence";

type CreateTaskInput = {
  title: string;
  description: string | null;
  notes: string | null;
  category: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  recurrence: TaskRecurrence;
  isFlagged: boolean;
  dueDate: Date | null;
  repeatDay: number | null;
  repeatMonth: number | null;
};

function parseTaskInput(body: unknown): { input: CreateTaskInput } | { error: string } {
  const raw = (body ?? {}) as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : null;
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : null;
  const category = typeof raw.category === "string" ? raw.category.trim() : null;
  const priority = raw.priority || "MEDIUM";
  const recurrence = raw.recurrence ?? "NONE";
  const isFlagged = raw.isFlagged ?? false;
  const dueDate = raw.dueDate ? new Date(raw.dueDate as string | number | Date) : null;
  const repeatDay = raw.repeatDay === undefined || raw.repeatDay === "" ? null : Number(raw.repeatDay);
  const repeatMonth = raw.repeatMonth === undefined || raw.repeatMonth === "" ? null : Number(raw.repeatMonth);

  if (!title) return { error: "Task title is required" };
  if (title.length > 120 || (description && description.length > 500) || (notes && notes.length > 2000)) {
    return { error: "Task details are too long" };
  }
  if (!isTaskRecurrence(recurrence) || typeof isFlagged !== "boolean") {
    return { error: "Invalid recurrence or flag value" };
  }
  if (priority !== "LOW" && priority !== "MEDIUM" && priority !== "HIGH") {
    return { error: "Invalid priority" };
  }
  if (category && category.length > 60) {
    return { error: "Category is too long" };
  }
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return { error: "Invalid due date" };
  }
  if (recurrence !== "NONE" && !dueDate) {
    return { error: "Set a due date for recurring tasks" };
  }
  if (recurrence === "MONTHLY" && (!Number.isInteger(repeatDay) || repeatDay! < 1 || repeatDay! > 31)) {
    return { error: "Choose a valid day of the month" };
  }
  if (recurrence === "YEARLY" && (!Number.isInteger(repeatMonth) || repeatMonth! < 1 || repeatMonth! > 12 || !Number.isInteger(repeatDay) || !isValidRepeatDay(repeatMonth!, repeatDay!))) {
    return { error: "Choose a valid month and day for the yearly repeat" };
  }

  return {
    input: {
      title,
      description,
      notes,
      category,
      priority,
      recurrence,
      isFlagged,
      dueDate,
      repeatDay,
      repeatMonth,
    },
  };
}

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId, prerequisiteFor: { none: {} } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      rescheduleHistory: { orderBy: { createdAt: "desc" } },
      prerequisiteItems: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ tasks: tasks.map((task) => ({ ...task, prerequisites: task.prerequisiteItems })) });
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseTaskInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { title, description, notes, category, priority, dueDate, recurrence, isFlagged, repeatDay, repeatMonth } = parsed.input;

  const recurrenceAnchor = getRecurrenceAnchor(recurrence, dueDate, repeatDay ?? undefined, repeatMonth ?? undefined);

  const task = await prisma.task.create({
    data: { title, description, notes, category, priority, dueDate, recurrence, recurrenceAnchor, isFlagged, userId },
  });
  return NextResponse.json({ task }, { status: 201 });
}
