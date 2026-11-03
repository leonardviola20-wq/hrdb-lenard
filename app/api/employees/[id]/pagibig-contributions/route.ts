import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) {
      return NextResponse.json({ error: "Employees access required" }, { status: 403 });
    }
  }

  const employeeId = Number((await params).id);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, middleName: true, lastName: true, pagIbigNumber: true },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const entries = await prisma.pagibigReportEntry.findMany({
      where: { employeeId },
      orderBy: [{ PagibigReport: { applicableYear: "desc" } }, { PagibigReport: { applicableMonth: "desc" } }, { id: "asc" }],
      select: {
        id: true,
        memberSavings: true,
        modifiedSavings: true,
        multiPurposeLoan: true,
        calamityLoan: true,
        safeLoan: true,
        emergencyLoan: true,
        loanAmount: true,
        totalAmount: true,
        ledgerSnapshot: true,
        PagibigReport: {
          select: {
            id: true,
            kind: true,
            manual: true,
            employerName: true,
            applicableMonth: true,
            applicableYear: true,
            pin: true,
            amountDue: true,
            amountPaid: true,
            payDate: true,
            paymentType: true,
          },
        },
      },
    });

    const snapshotText = (v: any, k: string) => (v && typeof v === "object" && !Array.isArray(v)) ? (typeof v[k] === "string" || typeof v[k] === "number" ? String(v[k]) : null) : null;
    const history = entries.map((entry) => ({
      id: entry.id,
      reportId: entry.PagibigReport.id,
      kind: entry.PagibigReport.kind,
      manual: entry.PagibigReport.manual,
      employerName: entry.PagibigReport.employerName,
      pin: entry.PagibigReport.pin,
      payDate: entry.PagibigReport.payDate ? entry.PagibigReport.payDate.toISOString().slice(0, 10) : null,
      paymentType: entry.PagibigReport.paymentType,
      amountPaid: entry.PagibigReport.amountPaid ? entry.PagibigReport.amountPaid.toString() : null,
      applicableYear: entry.PagibigReport.applicableYear,
      applicableMonth: entry.PagibigReport.applicableMonth,
      employeeSavings: entry.memberSavings.toString(),
      employerSavings: entry.modifiedSavings.toString(),
      mp2Amount: snapshotText(entry.ledgerSnapshot, "mp2Amount") ?? "0",
      calamityLoanAmount: entry.calamityLoan.toString(),
      mplLoanAmount: entry.multiPurposeLoan.toString(),
      emergencyLoanAmount: entry.emergencyLoan.toString(),
      safeLoanAmount: entry.safeLoan.toString(),
      totalAmount: entry.totalAmount.toString(),
    }));

    return NextResponse.json(
      {
        employeeId,
        employee: {
          firstName: employee.firstName,
          middleName: employee.middleName,
          lastName: employee.lastName,
          pagIbigNumber: employee.pagIbigNumber,
        },
        history,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load employee Pag-IBIG contributions error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG contributions" }, { status: 500 });
  }
}
