import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
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
  const category = typeof body.category === "string" ? body.category.trim() : null;
  const priority = body.priority || "MEDIUM";
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (!title) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }
  if (title.length > 120 || (description && description.length > 500)) {
    return NextResponse.json({ error: "Task details are too long" }, { status: 400 });
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

  const task = await prisma.task.create({
    data: { title, description, category, priority, dueDate, userId },
  });
  return NextResponse.json({ task }, { status: 201 });
}
