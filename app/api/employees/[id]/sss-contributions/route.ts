import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { buildSssContributionHistory } from "@/lib/sssContributionHistory";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Returns the employee's saved SSS contribution report entries grouped into a
 * year-by-month history plus an overall total. Payment status of the parent
 * report is intentionally not filtered so the full contribution history is
 * visible to authorized users.
 */
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
      select: { id: true, firstName: true, middleName: true, lastName: true, sssNumber: true },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const entries = await prisma.sssReportEntry.findMany({
      where: { employeeId, report: { kind: "CONTRIBUTION" } },
      orderBy: [{ report: { applicableYear: "desc" } }, { report: { applicableMonth: "desc" } }, { id: "asc" }],
      select: {
        id: true,
        totalAmount: true,
        salaryRange: true,
        monthlySalaryCredit: true,
        employerSs: true,
        employeeSs: true,
        employerMpf: true,
        employeeMpf: true,
        ec: true,
        employeeEmployerName: true,
        report: {
          select: {
            id: true,
            employerName: true,
            applicableMonth: true,
            applicableYear: true,
            prn: true,
            payDate: true,
          },
        },
      },
    });

    const history = buildSssContributionHistory(entries.map((entry) => ({
      id: entry.id,
      reportId: entry.report.id,
      employerName: entry.report.employerName,
      prn: entry.report.prn,
      payDate: entry.report.payDate ? entry.report.payDate.toISOString().slice(0, 10) : null,
      totalAmount: entry.totalAmount.toString(),
      salaryRange: entry.salaryRange,
      monthlySalaryCredit: entry.monthlySalaryCredit === null ? null : entry.monthlySalaryCredit.toString(),
      employerSs: entry.employerSs.toString(),
      employeeSs: entry.employeeSs.toString(),
      employerMpf: entry.employerMpf.toString(),
      employeeMpf: entry.employeeMpf.toString(),
      ec: entry.ec.toString(),
      employeeEmployerName: entry.employeeEmployerName,
      applicableYear: entry.report.applicableYear,
      applicableMonth: entry.report.applicableMonth,
    })));

    return NextResponse.json(
      {
        employeeId,
        employee: {
          firstName: employee.firstName,
          middleName: employee.middleName,
          lastName: employee.lastName,
          sssNumber: employee.sssNumber,
        },
        ...history,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load employee SSS contributions error:", error);
    return NextResponse.json({ error: "Unable to load SSS contributions" }, { status: 500 });
  }
}
