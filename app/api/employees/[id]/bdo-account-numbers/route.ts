import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeEmployeeRequirementAccess } from "@/lib/employeeRequirementAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function parseEmployeeId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const employeeId = parseEmployeeId((await params).id);
  if (!employeeId) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  const authorizationError = await authorizeEmployeeRequirementAccess(request, employeeId);
  if (authorizationError) return authorizationError;

  const payload: unknown = await request.json().catch(() => null);
  const accountNumber = payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).accountNumber
    : null;
  if (typeof accountNumber !== "string" || !/^\d{1,64}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Enter a BDO account number using 1 to 64 digits" }, { status: 400 });
  }

  try {
    const account = await prisma.employeeBdoAccountNumber.create({
      data: { employeeId, accountNumber },
      select: { id: true, accountNumber: true, createdAt: true },
    });
    return NextResponse.json({ account }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That BDO account number is already listed" }, { status: 409 });
    }
    console.error("Add employee BDO account number error:", error);
    return NextResponse.json({ error: "Unable to add BDO account number" }, { status: 500 });
  }
}
