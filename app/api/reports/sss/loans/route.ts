import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { calculateSssLoanOutstandingBalanceCents, calculateSssLoanPaymentAmountCents, parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { isSssLoanType } from "@/lib/sssLoanTypes";
import { prisma } from "@/lib/prisma";

const parseMoneyCents = (value: unknown) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999.99) return null;
  return Math.round(amount * 100);
};

const decimalToCents = (value: { toString(): string }) => Math.round(Number(value.toString()) * 100);
const centsToMoney = (value: number) => (value / 100).toFixed(2);

export async function GET(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const requestedEmployerId = request.nextUrl.searchParams.get("employerId");
  const employerId = requestedEmployerId === null ? null : Number(requestedEmployerId);
  const requestedMonth = request.nextUrl.searchParams.get("month");
  const requestedYear = request.nextUrl.searchParams.get("year");
  const forReport = request.nextUrl.searchParams.get("forReport") === "true";
  const applicableMonth = requestedMonth === null ? null : Number(requestedMonth);
  const applicableYear = requestedYear === null ? null : Number(requestedYear);
  if (employerId !== null && (!Number.isSafeInteger(employerId) || employerId <= 0)) {
    return NextResponse.json({ error: "Select a valid employer to view SSS loans" }, { status: 400 });
  }
  if ((requestedMonth === null) !== (requestedYear === null)
    || (applicableMonth !== null && (!Number.isInteger(applicableMonth) || applicableMonth < 1 || applicableMonth > 12))
    || (applicableYear !== null && (!Number.isInteger(applicableYear) || applicableYear < 2000 || applicableYear > 2200))) {
    return NextResponse.json({ error: "Select a valid applicable month and year" }, { status: 400 });
  }

  try {
    const employer = employerId === null
      ? null
      : await prisma.employer.findUnique({ where: { id: employerId }, select: { name: true } });
    if (employerId !== null && !employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const loans = await prisma.sssLoan.findMany({
      where: employerId === null ? undefined : { employerId },
      orderBy: [{ employeeName: "asc" }, { loanAccountNumber: "asc" }],
      include: { employer: { select: { name: true } } },
    });
    const asOfDate = applicableMonth !== null && applicableYear !== null
      ? new Date(Date.UTC(applicableYear, applicableMonth - 1, 1))
      : new Date();
    const outstandingLoans = loans.flatMap((loan) => {
      const outstandingBalanceCents = calculateSssLoanOutstandingBalanceCents(
        loan.loanAmount === null ? null : decimalToCents(loan.loanAmount),
      );
      const monthlyPaymentCents = calculateSssLoanPaymentAmountCents(
        decimalToCents(loan.monthlyAmortization),
        loan.loanDate,
        asOfDate,
      );
      const isVisible = forReport
        ? loan.status === "ACTIVE" && monthlyPaymentCents > 0
        : true;
      return isVisible
        ? [{
          ...loan,
          employerName: loan.employer.name,
          employeeSssNumber: null,
          outstandingBalance: outstandingBalanceCents === null ? null : centsToMoney(outstandingBalanceCents),
          monthlyPayment: centsToMoney(monthlyPaymentCents),
        }]
        : [];
    });
    const employeeIds = [...new Set(outstandingLoans.map((loan) => loan.employeeId).filter((id): id is number => id !== null))];
    const employees = employeeIds.length
      ? await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, sssNumber: true } })
      : [];
    const employeeSssNumbers = new Map(employees.map((employee) => [employee.id, employee.sssNumber]));
    const loansWithSssNumbers = outstandingLoans.map((loan) => ({
      ...loan,
      employeeSssNumber: loan.employeeId === null ? null : employeeSssNumbers.get(loan.employeeId) ?? null,
    }));
    return NextResponse.json({
      employerName: employer?.name ?? "All employers",
      canManageLoans: access.session?.role === "ADMIN" || access.session?.role === "SUPER_USER",
      loans: loansWithSssNumbers,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Load SSS loans error:", error);
    return NextResponse.json({ error: "Unable to load outstanding SSS loans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid SSS loan" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const employerId = Number(body.employerId);
  const employeeId = Number(body.employeeId);
  const loanAccountNumber = typeof body.loanAccountNumber === "string" ? body.loanAccountNumber.trim() : "";
  const transactionNumber = typeof body.transactionNumber === "string" ? body.transactionNumber.trim() : "";
  const loanType = body.loanType;
  const loanDate = parseSssLoanDateOnly(body.loanDate);
  const hasLoanAmount = body.loanAmount !== undefined && body.loanAmount !== null && body.loanAmount !== "";
  const loanAmountCents = hasLoanAmount ? parseMoneyCents(body.loanAmount) : null;
  const monthlyAmortizationCents = parseMoneyCents(body.monthlyAmortization);

  if (!Number.isSafeInteger(employerId) || employerId <= 0
    || !Number.isSafeInteger(employeeId) || employeeId <= 0
    || !loanAccountNumber || loanAccountNumber.length > 80
    || transactionNumber.length > 80
    || (body.transactionNumber !== undefined && body.transactionNumber !== null && typeof body.transactionNumber !== "string")
    || !isSssLoanType(loanType)
    || !loanDate
    || (hasLoanAmount && loanAmountCents === null) || monthlyAmortizationCents === null) {
    return NextResponse.json({ error: "Complete the required SSS loan details with valid dates and positive monthly amortization" }, { status: 400 });
  }

  try {
    const [employer, employee] = await Promise.all([
      prisma.employer.findUnique({ where: { id: employerId }, select: { id: true } }),
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
          biometricNo: true,
        },
      }),
    ]);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    const biometricNo = employee.biometricNo?.trim();
    if (!biometricNo) {
      return NextResponse.json({ error: "The selected employee must have a Biometric Number on their employee record" }, { status: 400 });
    }

    const middleInitial = employee.middleName?.trim().charAt(0);
    const loan = await prisma.sssLoan.create({
      data: {
        employerId,
        employeeId,
        employeeName: `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`,
        employeeCode: employee.employeeCode,
        biometricNo,
        loanAccountNumber,
        transactionNumber: transactionNumber || null,
        loanType,
        loanDate,
        loanAmount: loanAmountCents === null ? null : centsToMoney(loanAmountCents),
        monthlyAmortization: centsToMoney(monthlyAmortizationCents),
      },
    });
    const outstandingBalanceCents = calculateSssLoanOutstandingBalanceCents(
      loanAmountCents,
    );
    return NextResponse.json({
      loan,
      outstandingBalance: outstandingBalanceCents === null ? null : centsToMoney(outstandingBalanceCents),
    }, { status: 201 });
  } catch (error) {
    console.error("Create SSS loan error:", error);
    return NextResponse.json({ error: "Unable to save the SSS loan" }, { status: 500 });
  }
}
