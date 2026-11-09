import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function requireEmployeesAccess(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session) return { session: null, accessiblePages: [] as string[] };
  let accessiblePages: string[] = [];
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    accessiblePages = user?.accessiblePages ?? [];
  }
  return { session, accessiblePages };
}

/** GET: Returns this employee's Pag-IBIG loans across all employers and years. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { session, accessiblePages } = await requireEmployeesAccess(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN" && !accessiblePages.includes("/employees")) {
    return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }

  const employeeId = Number((await params).id);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, firstName: true, middleName: true, lastName: true, pagIbigNumber: true } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const records = await prisma.pagibigEmployeeRecord.findMany({ where: { employeeId }, orderBy: [{ employer: { name: "asc" } }, { year: "desc" }], select: { id: true, year: true, employerId: true, employer: { select: { id: true, name: true } } } });

    const loans = await prisma.pagibigEmployeeLoan.findMany({ where: { recordId: { in: records.map((r) => r.id) } }, orderBy: [{ record: { year: "desc" } }, { record: { employer: { name: "asc" } } }, { loanTermDate: "desc" }], include: { record: { select: { year: true, employer: { select: { id: true, name: true } } } }, employer: { select: { id: true, name: true } }, PagibigEmployeeRecord: { select: { year: true, employeeId: true } } } });

    const items = loans.map((loan) => ({
      id: loan.id, recordId: loan.recordId, employerId: loan.employerId, employerName: loan.employer.name ?? "", recordYear: loan.record.year, employeeId: loan.PagibigEmployeeRecord.employeeId, employeeName: `${employee.firstName} ${employee.lastName}`.trim(), employeeCode: "", pagIbigNumber: employee.pagIbigNumber, loanType: loan.loanType, applicationNo: loan.applicationNo, loanDate: loan.loanTermDate.toISOString().slice(0, 10), termYears: loan.termYears, amount: loan.amount?.toString() ?? "0", status: loan.status ?? "INACTIVE", createdAt: loan.createdAt.toISOString().slice(0, 10),
    }));

    return NextResponse.json({ employee: { id: employee.id, firstName: employee.firstName, middleName: employee.middleName, lastName: employee.lastName, pagIbigNumber: employee.pagIbigNumber }, canEditLoans: session.role === "ADMIN" || accessiblePages.includes("/employees"), loans: items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load Pag-IBIG employee loans error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG loans" }, { status: 500 });
  }
}

/** POST: Create a new Pag-IBIG employee loan */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { session, accessiblePages } = await requireEmployeesAccess(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN" && !accessiblePages.includes("/employees")) {
    return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }

  const employeeId = Number((await params).id);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { loanType, applicationNo, loanDate, termYears, amount, status } = body || {};

    if (!loanType) return NextResponse.json({ error: "Loan type is required" }, { status: 400 });
    const validTypes = ["CAL", "MPL", "EMER", "SAFE"];
    if (!validTypes.includes(String(loanType))) {
      return NextResponse.json({ error: "Invalid loan type" }, { status: 400 });
    }

    if (!applicationNo || String(applicationNo).trim().length === 0) {
      return NextResponse.json({ error: "Application number is required" }, { status: 400 });
    }

    const dp = new Date(loanDate);
    if (isNaN(dp.getTime())) {
      return NextResponse.json({ error: "Invalid loan date" }, { status: 400 });
    }

    const ty = Number(termYears);
    if (!Number.isInteger(ty) || ty < 1 || ty > 50) {
      return NextResponse.json({ error: "Term years must be 1-50" }, { status: 400 });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const validStatuses = ["ACTIVE", "INACTIVE", "PAID", "NEW_LOAN", "HOLD", "CLOSE"];
    const statusVal = status ? String(status).toUpperCase() : "INACTIVE";
    if (!validStatuses.includes(statusVal)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Find the employee's most recent Pag-IBIG record (employer+year)
    const record = await prisma.pagibigEmployeeRecord.findFirst({
      where: { employeeId },
      orderBy: { year: "desc" },
      select: { id: true, employerId: true },
    });
    if (!record) return NextResponse.json({ error: "Employee has no Pag-IBIG record. Set up an account first." }, { status: 400 });

    const termEnd = new Date(dp);
    termEnd.setUTCFullYear(termEnd.getUTCFullYear() + ty);

    const loan = await prisma.pagibigEmployeeLoan.create({
      data: {
        recordId: record.id,
        employerId: record.employerId,
        loanType: String(loanType),
        applicationNo: String(applicationNo).trim(),
        loanTermDate: dp,
        termYears: ty,
        termEndDate: termEnd,
        amount: amt,
        status: statusVal,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ loan: { id: loan.id, status: loan.status } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Create Pag-IBIG employee loan error:", error);
    return NextResponse.json({ error: "Unable to create loan" }, { status: 500 });
  }
}
