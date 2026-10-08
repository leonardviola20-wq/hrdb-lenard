import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { isEmployeeRequirementKey } from "@/lib/employeeRequirements";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid requirement update" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  if (!isEmployeeRequirementKey(body.requirementKey) || typeof body.isComplete !== "boolean") {
    return NextResponse.json({ error: "Invalid requirement update" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const requirement = await prisma.employeeRequirement.upsert({
      where: { employeeId_requirementKey: { employeeId: id, requirementKey: body.requirementKey } },
      create: { employeeId: id, requirementKey: body.requirementKey, isComplete: body.isComplete },
      update: { isComplete: body.isComplete },
      select: { requirementKey: true, isComplete: true },
    });
    return NextResponse.json({ requirement });
  } catch (error) {
    console.error("Update employee requirement error:", error);
    return NextResponse.json({ error: "Unable to update employee requirement" }, { status: 500 });
  }
}
