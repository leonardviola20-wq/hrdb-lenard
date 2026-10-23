import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { parsePhilHealthMoneyCents, sumPhilHealthContributionCents } from "@/lib/philHealthReportTotals";
import { prisma } from "@/lib/prisma";

const serializeReport = <T extends { payment: { transactionDate: Date; eparDate: Date | null } | null }>(report: T) => ({
  ...report,
  payment: report.payment ? {
    ...report.payment,
    transactionDate: report.payment.transactionDate.toISOString().slice(0, 10),
    eparDate: report.payment.eparDate?.toISOString().slice(0, 10) ?? null,
  } : null,
});

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(employerId) || employerId <= 0) {
    return NextResponse.json({ error: "Select an employer to load PhilHealth reports" }, { status: 400 });
  }
  try {
    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
      select: { id: true, name: true, phic: true },
    });
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    if (request.nextUrl.searchParams.get("view") === "payments") {
      const payments = await prisma.philHealthReport.findMany({
        where: { employerId, payment: { isNot: null } },
        include: { entries: { orderBy: { employeeName: "asc" } }, payment: true },
        orderBy: [{ payment: { transactionDate: "desc" } }, { id: "desc" }],
        take: 8,
      });
      return NextResponse.json({
        employer,
        reports: payments.map(serializeReport),
        canEditPayments: access.session?.role === "ADMIN",
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const reports = await prisma.philHealthReport.findMany({
      where: { employerId },
      include: {
        entries: { orderBy: { employeeName: "asc" } },
        payment: true,
      },
      orderBy: [{ applicableYear: "desc" }, { applicableMonth: "desc" }, { id: "desc" }],
    });
    const serialized = reports.map(serializeReport);
    return NextResponse.json({ employer, reports: serialized, canEditPayments: access.session?.role === "ADMIN" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load PhilHealth reports error:", error);
    return NextResponse.json({ error: "Unable to load PhilHealth reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid PhilHealth report" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const employerId = Number(body.employerId);
  const month = Number(body.applicableMonth);
  const year = Number(body.applicableYear);
  const rawEntries = body.entries;
  if (!Number.isSafeInteger(employerId) || employerId <= 0 || !Number.isInteger(month) || month < 1 || month > 12
    || !Number.isInteger(year) || year < 2019 || year > 2200 || !Array.isArray(rawEntries) || rawEntries.length === 0) {
    return NextResponse.json({ error: "Select a valid employer, period, and at least one employee contribution" }, { status: 400 });
  }

  const normalizedEntries: Array<{ employeeId: number; cents: number }> = [];
  const seenEmployees = new Set<number>();
  for (const entry of rawEntries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return NextResponse.json({ error: "Invalid employee contribution entry" }, { status: 400 });
    }
    const row = entry as Record<string, unknown>;
    const employeeId = Number(row.employeeId);
    const cents = parsePhilHealthMoneyCents(row.amount);
    if (!Number.isSafeInteger(employeeId) || employeeId <= 0 || cents === null || seenEmployees.has(employeeId)) {
      return NextResponse.json({ error: "Each employee must have one valid non-negative contribution amount" }, { status: 400 });
    }
    seenEmployees.add(employeeId);
    normalizedEntries.push({ employeeId, cents });
  }
  const amountDueCents = sumPhilHealthContributionCents(normalizedEntries.map((row) => row.cents));
  if (amountDueCents === null) return NextResponse.json({ error: "Total contribution amount is too large" }, { status: 400 });

  try {
    const report = await prisma.$transaction(async (transaction) => {
      const employer = await transaction.employer.findUnique({
        where: { id: employerId },
        select: { id: true, name: true, phic: true },
      });
      if (!employer) throw new Error("EMPLOYER_NOT_FOUND");
      const employees = await transaction.employee.findMany({
        where: {
          id: { in: normalizedEntries.map((row) => row.employeeId) },
          philHealthEmployeeRecords: { some: { employerId, active: true } },
        },
        select: { id: true, firstName: true, middleName: true, lastName: true, employeeCode: true, philHealth: true },
      });
      if (employees.length !== normalizedEntries.length) throw new Error("INVALID_REPORT_EMPLOYEES");
      const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
      const report = await transaction.philHealthReport.create({
        data: {
          employerId,
          employerName: employer.name,
          employerPhicNumber: employer.phic,
          applicableMonth: month,
          applicableYear: year,
          amountDue: new Prisma.Decimal((amountDueCents / 100).toFixed(2)),
          createdBy: access.session?.id ?? null,
          entries: {
            create: normalizedEntries.map((row) => {
              const employee = employeeById.get(row.employeeId);
              if (!employee) throw new Error("INVALID_REPORT_EMPLOYEES");
              const middleInitial = employee.middleName?.trim().charAt(0);
              return {
                employeeId: employee.id,
                employeeName: `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`,
                employeeCode: employee.employeeCode,
                employeePhilHealthNumber: employee.philHealth,
                amount: new Prisma.Decimal((row.cents / 100).toFixed(2)),
              };
            }),
          },
        },
        include: { entries: true, payment: true },
      });
      return report;
    });
    return NextResponse.json({ report: serializeReport(report) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPLOYER_NOT_FOUND") {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_REPORT_EMPLOYEES") {
      return NextResponse.json({ error: "One or more selected employees do not have an active PhilHealth account for this employer" }, { status: 400 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A PhilHealth report already exists for this employer and applicable month" }, { status: 409 });
    }
    console.error("Create PhilHealth contribution report error:", error);
    return NextResponse.json({ error: "Unable to create PhilHealth contribution report" }, { status: 500 });
  }
}
