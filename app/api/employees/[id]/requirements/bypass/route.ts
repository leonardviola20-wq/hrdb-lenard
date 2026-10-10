import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import { getApplicableEmployeeRequirements } from "@/lib/employeeRequirements";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }
  const authorizationError = await authorizeEmployeeRequirementAccess(request, id);
  if (authorizationError) return authorizationError;

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid bypass update" }, { status: 400 });
  }
  const bypassed = (payload as Record<string, unknown>).bypassed;
  if (typeof bypassed !== "boolean") {
    return NextResponse.json({ error: "Invalid bypass update" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const employee = await transaction.employee.findUnique({
        where: { id },
        select: { maritalStatus: true },
      });
      if (!employee) throw new Error("Employee not found");

      const updated = await transaction.employee.update({
        where: { id },
        data: { requirementsBypassed: bypassed },
        select: { requirementsBypassed: true },
      });

      // Turning the bypass on also marks every applicable requirement complete,
      // including the BDO item regardless of account numbers.
      let requirements: { requirementKey: string; isComplete: boolean }[] = [];
      if (bypassed) {
        const applicable = getApplicableEmployeeRequirements(employee.maritalStatus);
        requirements = [];
        for (const requirement of applicable) {
          requirements.push(await transaction.employeeRequirement.upsert({
            where: { employeeId_requirementKey: { employeeId: id, requirementKey: requirement.key } },
            create: { employeeId: id, requirementKey: requirement.key, isComplete: true },
            update: { isComplete: true },
            select: { requirementKey: true, isComplete: true },
          }));
        }
      }

      return { bypassed: updated.requirementsBypassed, requirements };
    }, { isolationLevel: "Serializable" });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Employee not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Requirement state changed concurrently. Please retry." }, { status: 409 });
    }
    console.error("Update employee requirement bypass error:", error);
    return NextResponse.json({ error: "Unable to update requirement bypass" }, { status: 500 });
  }
}
