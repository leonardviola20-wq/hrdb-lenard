import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  if (
    !Array.isArray(body.taskIds) ||
    body.taskIds.some((id: unknown) => !Number.isInteger(id))
  ) {
    return NextResponse.json({ error: "Invalid task order" }, { status: 400 });
  }

  const taskIds = body.taskIds as number[];
  if (new Set(taskIds).size !== taskIds.length) {
    return NextResponse.json({ error: "Invalid task order" }, { status: 400 });
  }

  const userTasks = await prisma.task.findMany({
    where: { userId },
    select: { id: true },
  });
  if (
    taskIds.length !== userTasks.length ||
    !userTasks.every((task) => taskIds.includes(task.id))
  ) {
    return NextResponse.json({ error: "Invalid task order" }, { status: 400 });
  }

  await prisma.$transaction(
    taskIds.map((taskId, index) =>
      prisma.task.updateMany({
        where: { id: taskId, userId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ message: "Task order saved" });
}
