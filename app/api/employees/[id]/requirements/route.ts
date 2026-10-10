import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import { isEmployeeRequirementKey, isSingleEmployee } from "@/lib/employeeRequirements";
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
    return NextResponse.json({ error: "Invalid requirement update" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  if (!isEmployeeRequirementKey(body.requirementKey) || typeof body.isComplete !== "boolean") {
    return NextResponse.json({ error: "Invalid requirement update" }, { status: 400 });
  }
  const requirementKey = body.requirementKey;
  const isComplete = body.isComplete;

  try {
    const requirement = await prisma.$transaction(async (transaction) => {
      const employee = await transaction.employee.findUnique({
        where: { id },
        select: {
          maritalStatus: true,
          bdoAccountNumbers: { select: { id: true } },
        },
      });
      if (!employee) throw new Error("Employee not found");
      if (isComplete && requirementKey === "marriageContract" && isSingleEmployee(employee.maritalStatus)) {
        throw new Error("Marriage Contract is not applicable to Single employees");
      }
      if (isComplete && requirementKey === "bdoSavingsAccount" && employee.bdoAccountNumbers.length === 0) {
        throw new Error("Add at least one BDO savings account number first");
      }

      return transaction.employeeRequirement.upsert({
        where: { employeeId_requirementKey: { employeeId: id, requirementKey } },
        create: { employeeId: id, requirementKey, isComplete },
        update: { isComplete },
        select: { requirementKey: true, isComplete: true },
      });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ requirement });
  } catch (error) {
    if (error instanceof Error && error.message === "Employee not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && (
      error.message === "Marriage Contract is not applicable to Single employees"
      || error.message === "Add at least one BDO savings account number first"
    )) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Requirement state changed concurrently. Please retry." }, { status: 409 });
    }
    console.error("Update employee requirement error:", error);
    return NextResponse.json({ error: "Unable to update employee requirement" }, { status: 500 });
  }
}
