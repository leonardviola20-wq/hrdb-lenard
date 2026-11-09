import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { buildPhilHealthContributionHistory } from "@/lib/philHealthContributionHistory";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
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

  const employeeId = Number((await params).id);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, middleName: true, lastName: true, philHealth: true },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const savedEntries = await prisma.philHealthReportEntry.findMany({
      where: { employeeId },
      orderBy: [
        { report: { applicableYear: "desc" } },
        { report: { applicableMonth: "desc" } },
        { id: "asc" },
      ],
      select: {
        id: true,
        reportId: true,
        amount: true,
        report: {
          select: {
            employerName: true,
            applicableYear: true,
            applicableMonth: true,
            payment: {
              select: {
                transactionDate: true,
                eparNumber: true,
                eparDate: true,
              },
            },
          },
        },
      },
    });

    const history = buildPhilHealthContributionHistory(savedEntries.map((entry) => ({
      id: entry.id,
      reportId: entry.reportId,
      employerName: entry.report.employerName,
      applicableYear: entry.report.applicableYear,
      applicableMonth: entry.report.applicableMonth,
      amount: entry.amount.toString(),
      payDate: entry.report.payment?.transactionDate.toISOString().slice(0, 10) ?? null,
      eparNumber: entry.report.payment?.eparNumber ?? null,
      eparDate: entry.report.payment?.eparDate?.toISOString().slice(0, 10) ?? null,
    })));

    return NextResponse.json(
      {
        employeeId,
        employee: {
          firstName: employee.firstName,
          middleName: employee.middleName,
          lastName: employee.lastName,
          philHealthNumber: employee.philHealth,
        },
        history,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load employee PhilHealth contributions error:", error);
    return NextResponse.json({ error: "Unable to load PhilHealth contributions" }, { status: 500 });
  }
}
