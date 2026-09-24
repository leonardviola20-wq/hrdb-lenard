import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

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
  const data: {
    status?: string;
    title?: string;
    description?: string | null;
    category?: string | null;
    priority?: string;
    dueDate?: Date | null;
  } = {};
  if (body.status !== undefined) {
    if (body.status !== "PENDING" && body.status !== "COMPLETED") {
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
  if (body.dueDate !== undefined) {
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.dueDate && Number.isNaN(dueDate?.getTime())) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }
    data.dueDate = dueDate;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No task changes provided" }, { status: 400 });
  }

  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Task updated" });
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
