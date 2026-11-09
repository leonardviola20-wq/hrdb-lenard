import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; loanId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let accessiblePages: string[] = [];
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accessiblePages: true },
    });
    accessiblePages = user?.accessiblePages ?? [];
    if (!accessiblePages.includes("/employees")) {
      return NextResponse.json({ error: "Employees access required" }, { status: 403 });
    }
  }

  const employeeId = Number((await params).id);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  const loanId = Number((await params).loanId);
  if (!Number.isSafeInteger(loanId) || loanId <= 0) {
    return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid loan update" }, { status: 400 });
  }

  const { loanType, applicationNo, loanDate, termYears, amount, status } = body as Record<string, unknown>;
  const validStatuses = ["ACTIVE", "INACTIVE", "PAID", "NEW_LOAN", "HOLD", "CLOSE"];

  try {
    const existing = await prisma.pagibigEmployeeLoan.findFirst({
      where: {
        id: loanId,
        PagibigEmployeeRecord: { employeeId },
      },
      include: { PagibigEmployeeRecord: { select: { employeeId: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Loan not found for this employee" }, { status: 404 });

    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) {
      const s = String(status).toUpperCase();
      if (!validStatuses.includes(s)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      data.status = s;
    }
    if (loanType !== undefined) {
      const validTypes = ["CAL", "MPL", "EMER", "SAFE"];
      if (!validTypes.includes(String(loanType))) return NextResponse.json({ error: "Invalid loan type" }, { status: 400 });
      data.loanType = String(loanType);
    }
    if (applicationNo !== undefined) {
      const appNo = String(applicationNo).trim();
      if (!appNo || appNo.length > 120) return NextResponse.json({ error: "Application number is required" }, { status: 400 });
      data.applicationNo = appNo;
    }
    if (loanDate !== undefined) {
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(loanDate)) ? new Date(`${String(loanDate)}T00:00:00.000Z`) : null;
      if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== String(loanDate)) {
        return NextResponse.json({ error: "Invalid loan date" }, { status: 400 });
      }
      data.loanTermDate = parsed;
      const ty = termYears !== undefined ? Number(termYears) : existing.termYears;
      const end = new Date(parsed);
      end.setUTCFullYear(end.getUTCFullYear() + ty);
      data.termEndDate = end;
    }
    if (termYears !== undefined) {
      const ty = Number(termYears);
      if (!Number.isInteger(ty) || ty < 1 || ty > 50) return NextResponse.json({ error: "Term years must be 1-50" }, { status: 400 });
      data.termYears = ty;
    }
    if (amount !== undefined) {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      data.amount = amt;
    }

    const updated = await prisma.pagibigEmployeeLoan.update({ where: { id: loanId }, data });
    return NextResponse.json({ loan: { id: updated.id, status: updated.status } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Update Pag-IBIG employee loan error:", error);
    return NextResponse.json({ error: "Unable to update Pag-IBIG loan" }, { status: 500 });
  }
}
