import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const adminId = getAuthenticatedUserId(req);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const userId = Number((await params).id);
  const body = await req.json();
  if (!Number.isInteger(userId) || typeof body.emailVerified !== "boolean") {
    return NextResponse.json({ error: "Invalid user update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: body.emailVerified,
      ...(body.emailVerified
        ? { verificationTokenHash: null, verificationTokenExpires: null }
        : {}),
    },
    select: { id: true, emailVerified: true },
  });

  return NextResponse.json({ user });
}
