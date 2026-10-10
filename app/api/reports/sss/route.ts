import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { getSssContributionBracket, toSssMoney } from "@/lib/sssContributionTable";
import { calculateSssLoanPaymentAmountCents } from "@/lib/sssLoanBalance";
import { prisma } from "@/lib/prisma";

type ReportEntryInput = { employeeId: number; sssLoanId?: number | null; monthlySalaryCredit?: number; loanAmount?: number };

function formatEmployeeName(employee: { firstName: string; middleName: string | null; lastName: string }) {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
}

function parseMoney(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999_999_999.99) return null;
  return Math.round(parsed * 100);
}

function validEntries(value: unknown): value is ReportEntryInput[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 3000 && value.every((entry) =>
    entry && typeof entry === "object" && Number.isSafeInteger(entry.employeeId) && entry.employeeId > 0,
  );
}

function contributionData(entry: ReportEntryInput) {
  const bracket = getSssContributionBracket(Number(entry.monthlySalaryCredit));
  if (!bracket) return null;
  return {
    salaryRange: bracket.range,
    monthlySalaryCredit: new Prisma.Decimal(toSssMoney(bracket.monthlySalaryCredit)),
    employeeSs: new Prisma.Decimal(toSssMoney(bracket.employeeSs)),
    employerSs: new Prisma.Decimal(toSssMoney(bracket.employerSs)),
    employeeMpf: new Prisma.Decimal(toSssMoney(bracket.employeeMpf)),
    employerMpf: new Prisma.Decimal(toSssMoney(bracket.employerMpf)),
    ec: new Prisma.Decimal(toSssMoney(bracket.ec)),
    loanAmount: new Prisma.Decimal("0.00"),
    totalAmount: new Prisma.Decimal(toSssMoney(bracket.total)),
    totalCents: Math.round(bracket.total * 100),
  };
}

export async function GET(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  try {
    const reports = await prisma.sssReport.findMany({
      orderBy: [
        { employerName: "asc" },
        { applicableYear: "desc" },
        { applicableMonth: "desc" },
        { createdAt: "desc" },
      ],
      include: { entries: { orderBy: { employeeName: "asc" } } },
    });
    return NextResponse.json({ reports, canEditPayments: access.session?.role === "ADMIN" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load SSS reports error:", error);
    return NextResponse.json({ error: "Unable to load SSS reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid SSS report" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const kind: "CONTRIBUTION" | "LOAN" | null = body.kind === "CONTRIBUTION" || body.kind === "LOAN" ? body.kind : null;
  const draftId = body.draftId === undefined || body.draftId === null ? null : Number(body.draftId);
  const creatorId = access.session?.id;
  const employerId = Number(body.employerId);
  const month = Number(body.applicableMonth);
  const year = Number(body.applicableYear);
  const prn = typeof body.prn === "string" ? body.prn.trim() : "";
  const amountDueCents = parseMoney(body.amountDue);
  if (!kind
    || (draftId !== null && (!Number.isSafeInteger(draftId) || draftId <= 0 || !Number.isSafeInteger(creatorId)))
    || !Number.isSafeInteger(employerId) || employerId <= 0
    || !Number.isInteger(month) || month < 1 || month > 12
    || !Number.isInteger(year) || year < 2025 || year > 2200
    || !prn || prn.length > 80 || amountDueCents === null
    || !validEntries(body.entries)) {
    return NextResponse.json({ error: "Complete the report details and add at least one valid employee entry" }, { status: 400 });
  }

  const employeeIds = body.entries.map((entry) => entry.employeeId);
  const uniqueEmployeeIds = [...new Set(employeeIds)];
  const loanIds = body.entries.map((entry) => entry.sssLoanId).filter((id): id is number => Number.isSafeInteger(id) && (id as number) > 0);
  if (kind === "CONTRIBUTION" && new Set(employeeIds).size !== employeeIds.length) {
    return NextResponse.json({ error: "An employee can only be added once to a report" }, { status: 400 });
  }
  if (kind === "LOAN" && (loanIds.length !== body.entries.length || new Set(loanIds).size !== loanIds.length)) {
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
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
          sssNumber: true,
          employerId: true,
          employer: { select: { name: true } },
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
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    let totalCents = 0;
    const entryData = body.entries.map((entry) => {
      const employee = employeeById.get(entry.employeeId)!;
      if (kind === "CONTRIBUTION") {
        const values = contributionData(entry);
        if (!values) throw new Error("Each employee must have a valid SSS compensation range");
        const { totalCents: contributionTotalCents, ...data } = values;
        totalCents += contributionTotalCents;
        return { ...data, employeeId: employee.id, employeeCode: employee.employeeCode, employeeName: formatEmployeeName(employee), employeeSssNumber: employee.sssNumber, employeeEmployerId: employee.employerId, employeeEmployerName: employee.employer?.name ?? null };
      }

      const loanCents = parseMoney(entry.loanAmount);
      if (loanCents === null || loanCents <= 0) throw new Error("Each loan entry must have an amount greater than zero");
      const loan = loanById.get(entry.sssLoanId!);
      if (!loan || loan.employeeId !== employee.id || loan.status !== "ACTIVE") {
        throw new Error("Each loan entry must reference an active loan account for that employee");
      }
      const scheduledPaymentCents = calculateSssLoanPaymentAmountCents(
        Math.round(Number(loan.monthlyAmortization.toString()) * 100),
        loan.loanDate,
        periodStart,
      );
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

    const report = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.sssReport.create({
        data: {
          kind,
          employerId,
          employerName: employer.name,
          employerAddress: employer.longAddress || employer.shortAddress,
          employerSssNumber: employer.sss,
          prn,
          applicableMonth: month,
          applicableYear: year,
          amountDue: new Prisma.Decimal((amountDueCents / 100).toFixed(2)),
          entries: { create: entryData },
        },
        include: { entries: { orderBy: { employeeName: "asc" } } },
      });
      if (draftId !== null) {
        const deletedDraft = await transaction.sssReportDraft.deleteMany({ where: { id: draftId, continuedBy: creatorId } });
        if (deletedDraft.count === 0) throw new Error("SSS_DRAFT_NOT_FOUND");
      }
      return saved;
    });
    return NextResponse.json({ report }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "SSS_DRAFT_NOT_FOUND") {
      return NextResponse.json({ error: "SSS report draft not found" }, { status: 404 });
    }
    if (error instanceof Error && (error.message.includes("valid SSS compensation") || error.message.includes("loan entry") || error.message.includes("Loan amount due"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Create SSS report error:", error);
    return NextResponse.json({ error: "Unable to save SSS report" }, { status: 500 });
  }
}
