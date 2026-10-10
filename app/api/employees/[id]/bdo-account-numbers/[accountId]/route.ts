import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; accountId: string }> };

function parsePositiveId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id: rawId, accountId: rawAccountId } = await params;
  const employeeId = parsePositiveId(rawId);
  const accountId = parsePositiveId(rawAccountId);
  if (!employeeId || !accountId) return NextResponse.json({ error: "Invalid account number request" }, { status: 400 });
  const authorizationError = await authorizeEmployeeRequirementAccess(request, employeeId);
  if (authorizationError) return authorizationError;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const account = await transaction.employeeBdoAccountNumber.findFirst({
        where: { id: accountId, employeeId },
        select: { id: true },
      });
      if (!account) return null;
      await transaction.employeeBdoAccountNumber.delete({ where: { id: account.id } });
      const remainingCount = await transaction.employeeBdoAccountNumber.count({ where: { employeeId } });
      let requirement: { requirementKey: string; isComplete: boolean } | null = null;
      if (remainingCount === 0) {
        const existingRequirement = await transaction.employeeRequirement.findUnique({
          where: { employeeId_requirementKey: { employeeId, requirementKey: "bdoSavingsAccount" } },
          select: { id: true },
        });
        if (existingRequirement) {
          requirement = await transaction.employeeRequirement.update({
            where: { id: existingRequirement.id },
            data: { isComplete: false },
            select: { requirementKey: true, isComplete: true },
          });
        }
      }
      return { remainingCount, requirement };
    }, { isolationLevel: "Serializable" });
    if (!result) return NextResponse.json({ error: "Account number not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Account numbers changed concurrently. Please retry." }, { status: 409 });
    }
    console.error("Remove employee BDO account number error:", error);
    return NextResponse.json({ error: "Unable to remove BDO account number" }, { status: 500 });
  }
}
