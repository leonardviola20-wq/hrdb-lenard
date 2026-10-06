import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getRecurrenceAnchor, isTaskRecurrence, isValidRepeatDay } from "@/lib/taskRecurrence";

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

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;
  const category = typeof body.category === "string" ? body.category.trim() : null;
  const priority = body.priority || "MEDIUM";
  const recurrence = body.recurrence ?? "NONE";
  const isFlagged = body.isFlagged ?? false;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const repeatDay = body.repeatDay === undefined || body.repeatDay === "" ? null : Number(body.repeatDay);
  const repeatMonth = body.repeatMonth === undefined || body.repeatMonth === "" ? null : Number(body.repeatMonth);

  if (!title) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }
  if (title.length > 120 || (description && description.length > 500) || (notes && notes.length > 2000)) {
    return NextResponse.json({ error: "Task details are too long" }, { status: 400 });
  }
  if (!isTaskRecurrence(recurrence) || typeof isFlagged !== "boolean") {
    return NextResponse.json({ error: "Invalid recurrence or flag value" }, { status: 400 });
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }
  if (category && category.length > 60) {
    return NextResponse.json({ error: "Category is too long" }, { status: 400 });
  }
  if (body.dueDate && Number.isNaN(dueDate?.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }
  if (recurrence !== "NONE" && !dueDate) {
    return NextResponse.json({ error: "Set a due date for recurring tasks" }, { status: 400 });
  }
  if (recurrence === "MONTHLY" && (!Number.isInteger(repeatDay) || repeatDay! < 1 || repeatDay! > 31)) {
    return NextResponse.json({ error: "Choose a valid day of the month" }, { status: 400 });
  }
  if (recurrence === "YEARLY" && (!Number.isInteger(repeatMonth) || !Number.isInteger(repeatDay) || !isValidRepeatDay(repeatMonth!, repeatDay!))) {
    return NextResponse.json({ error: "Choose a valid month and day for the yearly repeat" }, { status: 400 });
  }

  const recurrenceAnchor = getRecurrenceAnchor(recurrence, dueDate, repeatDay ?? undefined, repeatMonth ?? undefined);

  const task = await prisma.task.create({
    data: { title, description, notes, category, priority, dueDate, recurrence, recurrenceAnchor, isFlagged, userId },
  });
  return NextResponse.json({ task }, { status: 201 });
}
