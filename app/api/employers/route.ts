import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (getAuthenticatedUserId(req) === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const employers = await prisma.employer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json({ employers });
}
