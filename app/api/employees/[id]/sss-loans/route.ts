import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** Returns this employee's SSS loan accounts and every saved loan report entry linked to each account. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  let accessiblePages: string[] = [];
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    accessiblePages = user?.accessiblePages ?? [];
    if (!accessiblePages.includes("/employees")) {
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

    const [loans, entries] = await Promise.all([
      prisma.sssLoan.findMany({
        where: { employeeId },
        orderBy: [{ loanDate: "desc" }, { loanAccountNumber: "asc" }],
        select: {
          id: true,
          loanAccountNumber: true,
          transactionNumber: true,
          loanType: true,
          loanDate: true,
          loanAmount: true,
          monthlyAmortization: true,
          status: true,
          statusReason: true,
        },
      }),
      prisma.sssReportEntry.findMany({
        where: { employeeId, report: { kind: "LOAN" } },
        orderBy: [
          { report: { applicableYear: "desc" } },
          { report: { applicableMonth: "desc" } },
          { id: "desc" },
        ],
        select: {
          id: true,
          sssLoanId: true,
          loanAccountNumber: true,
          loanAmount: true,
          sssLoan: {
            select: {
              loanAccountNumber: true,
              transactionNumber: true,
              loanType: true,
              loanDate: true,
              loanAmount: true,
              monthlyAmortization: true,
              status: true,
              statusReason: true,
            },
          },
          report: {
            select: {
              id: true,
              employerName: true,
              prn: true,
              applicableMonth: true,
              applicableYear: true,
              payDate: true,
              sssBranch: true,
              transactionReference: true,
            },
          },
        },
      }),
    ]);

    type LoanReport = {
      id: number;
      reportId: number;
      employerName: string;
      prn: string;
      applicableMonth: number;
      applicableYear: number;
      amount: string;
      payDate: string | null;
      sssBranch: string | null;
      transactionReference: string | null;
    };
    type LoanAccount = {
      id: number | null;
      loanAccountNumber: string;
      transactionNumber: string | null;
      loanType: string | null;
      loanDate: string | null;
      loanAmount: string | null;
      monthlyAmortization: string | null;
      status: string | null;
      statusReason: string | null;
      reports: LoanReport[];
    };
    const accounts = new Map<string, LoanAccount>();
    for (const loan of loans) {
      const accountNumber = loan.loanAccountNumber.trim();
      if (!accountNumber) continue;
      accounts.set(accountNumber, {
        id: loan.id,
        loanAccountNumber: accountNumber,
        transactionNumber: loan.transactionNumber,
        loanType: loan.loanType,
        loanDate: loan.loanDate.toISOString().slice(0, 10),
        loanAmount: loan.loanAmount?.toString() ?? null,
        monthlyAmortization: loan.monthlyAmortization.toString(),
        status: loan.status,
        statusReason: loan.statusReason,
        reports: [],
      });
    }

    for (const entry of entries) {
      const accountNumber = entry.loanAccountNumber?.trim() || entry.sssLoan?.loanAccountNumber.trim();
      if (!accountNumber) continue;
      const account = accounts.get(accountNumber) ?? {
        id: entry.sssLoan ? entry.sssLoanId : null,
        loanAccountNumber: accountNumber,
        transactionNumber: entry.sssLoan?.transactionNumber ?? null,
        loanType: entry.sssLoan?.loanType ?? null,
        loanDate: entry.sssLoan?.loanDate.toISOString().slice(0, 10) ?? null,
        loanAmount: entry.sssLoan?.loanAmount?.toString() ?? null,
        monthlyAmortization: entry.sssLoan?.monthlyAmortization.toString() ?? null,
        status: entry.sssLoan?.status ?? null,
        statusReason: entry.sssLoan?.statusReason ?? null,
        reports: [],
      };
      account.reports.push({
        id: entry.id,
        reportId: entry.report.id,
        employerName: entry.report.employerName,
        prn: entry.report.prn,
        applicableMonth: entry.report.applicableMonth,
        applicableYear: entry.report.applicableYear,
        amount: entry.loanAmount.toString(),
        payDate: entry.report.payDate?.toISOString().slice(0, 10) ?? null,
        sssBranch: entry.report.sssBranch,
        transactionReference: entry.report.transactionReference,
      });
      accounts.set(accountNumber, account);
    }

    return NextResponse.json({
      employee: {
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        sssNumber: employee.sssNumber,
      },
      canEditLoans: session.role === "ADMIN" || accessiblePages.includes("/reports/sss"),
      loans: [...accounts.values()].sort((left, right) =>
        (right.loanDate ?? "").localeCompare(left.loanDate ?? "")
        || left.loanAccountNumber.localeCompare(right.loanAccountNumber),
      ),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load employee SSS loans error:", error);
    return NextResponse.json({ error: "Unable to load SSS loans" }, { status: 500 });
  }
}
