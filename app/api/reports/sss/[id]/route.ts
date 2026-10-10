import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { getSssContributionBracket, toSssMoney } from "@/lib/sssContributionTable";
import { calculateSssLoanPaymentAmountCents } from "@/lib/sssLoanBalance";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
type ReportEntryInput = { employeeId: number; sssLoanId?: number | null; monthlySalaryCredit?: number; loanAmount?: string | number };
const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];

function parseMoney(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999_999_999.99) return null;
  return Math.round(parsed * 100);
}

function formatEmployeeName(employee: { firstName: string; middleName: string | null; lastName: string }) {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  if (access.session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access is required to edit SSS reports" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid SSS report id" }, { status: 400 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid SSS report" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const kind = body.kind === "CONTRIBUTION" || body.kind === "LOAN" ? body.kind : null;
  const employerId = Number(body.employerId);
  const applicableMonth = Number(body.applicableMonth);
  const applicableYear = Number(body.applicableYear);
  const prn = typeof body.prn === "string" ? body.prn.trim() : "";
  const amountDueCents = parseMoney(body.amountDue);
  const entries = body.entries;
  if (!kind || !Number.isSafeInteger(employerId) || employerId <= 0
    || !Number.isInteger(applicableMonth) || applicableMonth < 1 || applicableMonth > 12
    || !Number.isInteger(applicableYear) || applicableYear < 2025 || applicableYear > 2200
    || !prn || prn.length > 80 || amountDueCents === null
    || !Array.isArray(entries) || entries.length === 0 || entries.length > 3000
    || !entries.every((entry) => entry && typeof entry === "object" && Number.isSafeInteger(entry.employeeId) && entry.employeeId > 0)) {
    return NextResponse.json({ error: "Complete the report details and add at least one valid employee entry" }, { status: 400 });
  }

  const reportEntries = entries as ReportEntryInput[];
  const employeeIds = reportEntries.map((entry) => entry.employeeId);
  const uniqueEmployeeIds = [...new Set(employeeIds)];
  const loanIds = reportEntries.map((entry) => entry.sssLoanId).filter((loanId): loanId is number => Number.isSafeInteger(loanId) && (loanId as number) > 0);
  if (kind === "CONTRIBUTION" && new Set(employeeIds).size !== employeeIds.length) {
    return NextResponse.json({ error: "An employee can only be added once to a report" }, { status: 400 });
  }
  if (kind === "LOAN" && (loanIds.length !== reportEntries.length || new Set(loanIds).size !== loanIds.length)) {
    return NextResponse.json({ error: "Each loan report row must reference a unique saved loan account" }, { status: 400 });
  }

  try {
    const [employer, employees, loans] = await Promise.all([
      prisma.employer.findUnique({
        where: { id: employerId },
        select: { id: true, name: true, shortAddress: true, longAddress: true, sss: true },
      }),
      prisma.employee.findMany({
        where: { id: { in: uniqueEmployeeIds } },
        select: {
          id: true, employeeCode: true, firstName: true, middleName: true, lastName: true, sssNumber: true,
          employerId: true, employer: { select: { name: true } },
        },
      }),
      kind === "LOAN"
        ? prisma.sssLoan.findMany({
          where: { id: { in: loanIds }, employerId },
          select: { id: true, employeeId: true, loanDate: true, loanAmount: true, monthlyAmortization: true, loanAccountNumber: true, status: true },
        })
        : Promise.resolve([]),
    ]);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    if (employees.length !== uniqueEmployeeIds.length) {
      return NextResponse.json({ error: "Each selected employee must still exist" }, { status: 400 });
    }
    if (kind === "LOAN" && loans.length !== loanIds.length) {
      return NextResponse.json({ error: "Each loan report row must reference a saved loan account for the selected employer" }, { status: 400 });
    }

    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
    const loanById = new Map(loans.map((loan) => [loan.id, loan]));
    const periodStart = new Date(Date.UTC(applicableYear, applicableMonth - 1, 1));
    let totalCents = 0;
    const entryData = reportEntries.map((entry) => {
      const employee = employeeById.get(entry.employeeId)!;
      if (kind === "CONTRIBUTION") {
        const bracket = getSssContributionBracket(Number(entry.monthlySalaryCredit));
        if (!bracket) throw new Error("Each employee must have a valid SSS compensation range");
        totalCents += Math.round(bracket.total * 100);
        return {
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: formatEmployeeName(employee),
          employeeSssNumber: employee.sssNumber,
          employeeEmployerId: employee.employerId,
          employeeEmployerName: employee.employer?.name ?? null,
          salaryRange: bracket.range,
          monthlySalaryCredit: new Prisma.Decimal(toSssMoney(bracket.monthlySalaryCredit)),
          employeeSs: new Prisma.Decimal(toSssMoney(bracket.employeeSs)),
          employerSs: new Prisma.Decimal(toSssMoney(bracket.employerSs)),
          employeeMpf: new Prisma.Decimal(toSssMoney(bracket.employeeMpf)),
          employerMpf: new Prisma.Decimal(toSssMoney(bracket.employerMpf)),
          ec: new Prisma.Decimal(toSssMoney(bracket.ec)),
          loanAmount: new Prisma.Decimal("0.00"),
          totalAmount: new Prisma.Decimal(toSssMoney(bracket.total)),
        };
      }

      const loanCents = parseMoney(entry.loanAmount);
      if (loanCents === null || loanCents <= 0) throw new Error("Each loan entry must have an amount greater than zero");
      const loan = loanById.get(entry.sssLoanId!);
      if (!loan || loan.employeeId !== employee.id || loan.status !== "ACTIVE") {
        throw new Error("Each loan entry must reference an active loan account for that employee");
      }
      const amortizationCents = Math.round(Number(loan.monthlyAmortization.toString()) * 100);
      const scheduledPaymentCents = calculateSssLoanPaymentAmountCents(amortizationCents, loan.loanDate, periodStart);
      if (scheduledPaymentCents <= 0) {
        throw new Error("The selected loan account has no scheduled payment for the applicable month");
      }
      totalCents += loanCents;
      return {
        employeeId: employee.id,
        sssLoanId: loan.id,
        loanAccountNumber: loan.loanAccountNumber,
        employeeCode: employee.employeeCode,
        employeeName: formatEmployeeName(employee),
        employeeSssNumber: employee.sssNumber,
        employeeEmployerId: employee.employerId,
        employeeEmployerName: employee.employer?.name ?? null,
        salaryRange: null,
        monthlySalaryCredit: null,
        employeeSs: new Prisma.Decimal("0.00"),
        employerSs: new Prisma.Decimal("0.00"),
        employeeMpf: new Prisma.Decimal("0.00"),
        employerMpf: new Prisma.Decimal("0.00"),
        ec: new Prisma.Decimal("0.00"),
        loanAmount: new Prisma.Decimal((loanCents / 100).toFixed(2)),
        totalAmount: new Prisma.Decimal((loanCents / 100).toFixed(2)),
      };
    });
    if (totalCents !== amountDueCents) {
      return NextResponse.json({ error: "The employee total does not match Amount Due. Recheck the breakdown before saving." }, { status: 409 });
    }

    const report = await prisma.sssReport.update({
      where: { id },
      data: {
        kind,
        employerId,
        employerName: employer.name,
        employerAddress: employer.longAddress || employer.shortAddress,
        employerSssNumber: employer.sss,
        prn,
        applicableMonth,
        applicableYear,
        amountDue: new Prisma.Decimal((amountDueCents / 100).toFixed(2)),
        entries: { deleteMany: {}, create: entryData },
      },
      include: { entries: { orderBy: { employeeName: "asc" } } },
    });
    return NextResponse.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("valid SSS compensation") || error.message.includes("loan entry") || error.message.includes("Loan amount due"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "SSS report not found" }, { status: 404 });
    }
    console.error("Update SSS report error:", error);
    return NextResponse.json({ error: "Unable to update SSS report" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid SSS report id" }, { status: 400 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  const body = payload as Record<string, unknown>;
  const amountPaid = Number(body.amountPaid);
  const paymentType = typeof body.paymentType === "string" ? body.paymentType : "";
  const payDateText = typeof body.payDate === "string" ? body.payDate : "";
  const branch = typeof body.sssBranch === "string" ? body.sssBranch.trim() : "";
  const transactionReference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";
  const payDate = /^\d{4}-\d{2}-\d{2}$/.test(payDateText) ? new Date(`${payDateText}T00:00:00.000Z`) : null;
  if (!Number.isFinite(amountPaid) || amountPaid <= 0 || amountPaid > 999_999_999.99
    || !paymentTypes.includes(paymentType) || !payDate || Number.isNaN(payDate.getTime())
    || payDate.toISOString().slice(0, 10) !== payDateText
    || !branch || !transactionReference || branch.length > 120 || transactionReference.length > 120) {
    return NextResponse.json({ error: "Enter a valid amount, payment type, pay date, branch, and transaction reference" }, { status: 400 });
  }

  try {
    const data = {
      amountPaid: new Prisma.Decimal(amountPaid.toFixed(2)),
      paymentType,
      payDate,
      sssBranch: branch,
      transactionReference,
    };
    let report;
    if (access.session?.role === "ADMIN") {
      report = await prisma.sssReport.update({
        where: { id },
        data,
        include: { entries: { orderBy: { employeeName: "asc" } } },
      });
    } else {
      const result = await prisma.sssReport.updateMany({ where: { id, amountPaid: null }, data });
      if (result.count === 0) {
        const exists = await prisma.sssReport.findUnique({ where: { id }, select: { id: true } });
        return NextResponse.json(
          { error: exists ? "Admin access is required to edit recorded payment details" : "SSS report not found" },
          { status: exists ? 403 : 404 },
        );
      }
      report = await prisma.sssReport.findUniqueOrThrow({
        where: { id },
        include: { entries: { orderBy: { employeeName: "asc" } } },
      });
    }
    return NextResponse.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "SSS report not found" }, { status: 404 });
    }
    console.error("Update SSS payment error:", error);
    return NextResponse.json({ error: "Unable to record SSS payment" }, { status: 500 });
  }
}
