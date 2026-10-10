import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function authorizeEmployeeRequirementAccess(request: NextRequest, employeeId: number) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accessiblePages: true },
    });
    if (!user?.accessiblePages.includes("/employees")) {
      return NextResponse.json({ error: "Employees access required" }, { status: 403 });
    }
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  return null;
}
