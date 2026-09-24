import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? userId : null;
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ users });
}
