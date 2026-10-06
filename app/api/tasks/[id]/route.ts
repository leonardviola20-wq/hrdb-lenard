import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getNextOccurrence, getRecurrenceAnchor, isTaskRecurrence, isValidRepeatDay } from "@/lib/taskRecurrence";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const taskId = Number((await params).id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const body = await req.json();
  const rescheduleReason = typeof body.rescheduleReason === "string" ? body.rescheduleReason.trim() : "";
  const prerequisitesToAdd = body.prerequisitesToAdd === undefined ? [] : body.prerequisitesToAdd;
  if (!Array.isArray(prerequisitesToAdd) || prerequisitesToAdd.some((title: unknown) => typeof title !== "string" || !title.trim() || title.trim().length > 200)) {
    return NextResponse.json({ error: "Prerequisite steps must be non-empty and 200 characters or fewer" }, { status: 400 });
  }
  if (rescheduleReason.length > 500) {
    return NextResponse.json({ error: "Reschedule reason must be 500 characters or fewer" }, { status: 400 });
  }
  const data: {
    status?: string;
    title?: string;
    description?: string | null;
    notes?: string | null;
    category?: string | null;
    priority?: string;
    recurrence?: string;
    isFlagged?: boolean;
    dueDate?: Date | null;
    recurrenceAnchor?: Date | null;
  } = {};
  if (body.status !== undefined) {
    if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120) {
      return NextResponse.json({ error: "Invalid task title" }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 500)) {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    data.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && (typeof body.notes !== "string" || body.notes.length > 2000)) {
      return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
    }
    data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  }
  if (body.category !== undefined) {
    if (body.category !== null && (typeof body.category !== "string" || body.category.length > 60)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = typeof body.category === "string" ? body.category.trim() || null : null;
  }
  if (body.priority !== undefined) {
    if (!["LOW", "MEDIUM", "HIGH"].includes(body.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    data.priority = body.priority;
  }
  if (body.recurrence !== undefined) {
    if (!isTaskRecurrence(body.recurrence)) {
      return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
    }
    data.recurrence = body.recurrence;
  }
  if (body.isFlagged !== undefined) {
    if (typeof body.isFlagged !== "boolean") {
      return NextResponse.json({ error: "Invalid flag value" }, { status: 400 });
    }
    data.isFlagged = body.isFlagged;
  }
  if (body.dueDate !== undefined) {
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.dueDate && Number.isNaN(dueDate?.getTime())) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }
    data.dueDate = dueDate;
  }
  if (body.preserveRecurrenceSchedule !== undefined && typeof body.preserveRecurrenceSchedule !== "boolean") {
    return NextResponse.json({ error: "Invalid recurrence schedule option" }, { status: 400 });
  }
  const existingTask = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const recurrence = data.recurrence ?? existingTask.recurrence;
  if (!isTaskRecurrence(recurrence)) {
    return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
  }
  const dueDate = data.dueDate === undefined ? existingTask.dueDate : data.dueDate;
  const dateKey = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null;
  const dueDateChanged = body.dueDate !== undefined && dateKey(dueDate) !== dateKey(existingTask.dueDate);
  const repeatDay = body.repeatDay === undefined || body.repeatDay === "" ? null : Number(body.repeatDay);
  const repeatMonth = body.repeatMonth === undefined || body.repeatMonth === "" ? null : Number(body.repeatMonth);
  if (recurrence === "MONTHLY" && (body.recurrence !== undefined || body.repeatDay !== undefined)
    && (!Number.isInteger(repeatDay) || repeatDay! < 1 || repeatDay! > 31)) {
    return NextResponse.json({ error: "Choose a valid day of the month" }, { status: 400 });
  }
  if (recurrence === "YEARLY" && (body.recurrence !== undefined || body.repeatDay !== undefined || body.repeatMonth !== undefined)
    && (!Number.isInteger(repeatMonth) || !Number.isInteger(repeatDay) || !isValidRepeatDay(repeatMonth!, repeatDay!))) {
    return NextResponse.json({ error: "Choose a valid month and day for the yearly repeat" }, { status: 400 });
  }
  if (dueDateChanged && !rescheduleReason) {
    return NextResponse.json({ error: "Add a reason when changing the due date" }, { status: 400 });
  }
  if (body.rescheduleReason !== undefined && !dueDateChanged) {
    return NextResponse.json({ error: "Choose a different due date to reschedule this task" }, { status: 400 });
  }
  if (recurrence !== "NONE" && !dueDate) {
    return NextResponse.json({ error: "Set a due date for recurring tasks" }, { status: 400 });
  }
  if (body.preserveRecurrenceSchedule !== true) {
    if (recurrence === "NONE") {
      if (existingTask.recurrenceAnchor) data.recurrenceAnchor = null;
    } else {
      const recurrenceChanged = body.recurrence !== undefined && recurrence !== existingTask.recurrence;
      const repeatAnchorSubmitted = (recurrence === "MONTHLY" && body.repeatDay !== undefined)
        || (recurrence === "YEARLY" && (body.repeatDay !== undefined || body.repeatMonth !== undefined));
      const shouldUpdateAnchor = recurrenceChanged || dueDateChanged || repeatAnchorSubmitted || !existingTask.recurrenceAnchor;
      if (shouldUpdateAnchor) {
        const anchorDueDate = dueDate ?? existingTask.dueDate;
        const currentAnchor = existingTask.recurrenceAnchor ?? anchorDueDate;
        const anchorDay = repeatDay ?? currentAnchor?.getUTCDate();
        const anchorMonth = repeatMonth ?? (currentAnchor ? currentAnchor.getUTCMonth() + 1 : undefined);
        data.recurrenceAnchor = getRecurrenceAnchor(recurrence, anchorDueDate, anchorDay, anchorMonth);
      }
    }
  }
  if (body.status === "COMPLETED") {
    const incompletePrerequisites = await prisma.taskPrerequisiteItem.findMany({
      where: { taskId, isCompleted: false },
      select: { title: true },
    });
    if (incompletePrerequisites.length > 0) {
      return NextResponse.json({
        error: `Complete prerequisite${incompletePrerequisites.length > 1 ? "s" : ""} first: ${incompletePrerequisites.map(({ title }) => title).join(", ")}`,
      }, { status: 409 });
    }
  }
  if (Object.keys(data).length === 0 && prerequisitesToAdd.length === 0) {
    return NextResponse.json({ error: "No task changes provided" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({ where: { id: taskId }, data });
      const reschedule = dueDateChanged
        ? await tx.taskReschedule.create({
            data: {
              taskId,
              previousDueDate: existingTask.dueDate,
              newDueDate: dueDate,
              reason: rescheduleReason,
            },
          })
        : null;
      const addedPrerequisites = prerequisitesToAdd.length > 0
        ? await tx.taskPrerequisiteItem.createManyAndReturn({
            data: prerequisitesToAdd.map((title: string) => ({ taskId, title: title.trim() })),
          })
        : [];
      const recurringFrequency = isTaskRecurrence(task.recurrence) && task.recurrence !== "NONE"
        ? task.recurrence
        : null;
      const nextTask = data.status === "COMPLETED"
        && existingTask.status !== "COMPLETED"
        && dueDate !== null
        && recurringFrequency !== null
        ? await tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              notes: task.notes,
              category: task.category,
              priority: task.priority,
              recurrence: task.recurrence,
              isFlagged: task.isFlagged,
              dueDate: getNextOccurrence(dueDate, recurringFrequency, task.recurrenceAnchor ?? dueDate),
              recurrenceAnchor: task.recurrenceAnchor ?? dueDate,
              sortOrder: task.sortOrder,
              userId,
            },
          })
        : null;
      return { task, nextTask, reschedule, addedPrerequisites };
    });
    return NextResponse.json({ message: "Task updated", ...result });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Unable to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const taskId = Number((await params).id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const result = await prisma.task.deleteMany({ where: { id: taskId, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Task deleted" });
}
