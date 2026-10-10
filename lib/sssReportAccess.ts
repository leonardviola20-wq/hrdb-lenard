import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function authorizeSssReports(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/reports/sss")) {
      return { session: null, error: NextResponse.json({ error: "Reports access required" }, { status: 403 }) };
    }
  }
  return { session, error: null };
}
