import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string; prerequisiteId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, prerequisiteId } = await params;
  const taskId = Number(id);
  const itemId = Number(prerequisiteId);
  if (!Number.isInteger(taskId) || !Number.isInteger(itemId)) {
    return NextResponse.json({ error: "Invalid task or prerequisite id" }, { status: 400 });
  }

  const body = await req.json();
  if (typeof body.isCompleted !== "boolean") {
    return NextResponse.json({ error: "Invalid prerequisite status" }, { status: 400 });
  }

  const item = await prisma.taskPrerequisiteItem.findFirst({
    where: { id: itemId, taskId, task: { userId } },
    select: { id: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Prerequisite step not found" }, { status: 404 });
  }

  const prerequisite = await prisma.taskPrerequisiteItem.update({
    where: { id: itemId },
    data: {
      isCompleted: body.isCompleted,
      completedAt: body.isCompleted ? new Date() : null,
    },
  });
  return NextResponse.json({ prerequisite });
}
