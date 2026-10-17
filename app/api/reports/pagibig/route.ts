import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { PAGIBIG_LOAN_TYPES, normalizePagibigLoanType, type PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { serializePagibigReport } from "@/lib/pagibigReportSerialization";
import { calculatePagIbigReportTotals } from "@/lib/pagibigReportTotals";
import { prisma } from "@/lib/prisma";

const centsToDecimal = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const displayName = (employee: { firstName: string; middleName: string | null; lastName: string }) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};
const validYear = (value: unknown) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2020 && year <= 2200 ? year : null;
};
export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(employerId) || employerId <= 0) {
    return NextResponse.json({ error: "Select an employer to load Pag-IBIG reports" }, { status: 400 });
  }

  try {
    const reports = await prisma.pagibigReport.findMany({
      where: { employerId },
      orderBy: [{ applicableYear: "desc" }, { applicableMonth: "desc" }, { createdAt: "desc" }],
      include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } },
    });
    return NextResponse.json({
      reports: reports.map(serializePagibigReport),
      canEditPayments: access.session?.role === "ADMIN",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load Pag-IBIG reports error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid Pag-IBIG report request" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const employerId = Number(body.employerId);
  const month = Number(body.applicableMonth);
  const year = validYear(body.applicableYear);
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!Number.isSafeInteger(employerId) || employerId <= 0 || !Number.isInteger(month) || month < 1 || month > 12
    || !year || !pin || pin.length > 120) {
    return NextResponse.json({ error: "Select a valid employer, report month and year, and enter the Pag-IBIG report PIN" }, { status: 400 });
  }

  try {
    const report = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(CAST(${employerId} AS integer), CAST(${year * 100 + month} AS integer))::text AS locked`;
      const existingReport = await transaction.pagibigReport.findFirst({
        where: { employerId, applicableYear: year, applicableMonth: month },
        select: { id: true },
      });
      if (existingReport) throw new Error("DUPLICATE_PAGIBIG_REPORT");

      const employer = await transaction.employer.findUnique({
        where: { id: employerId },
        select: { id: true, name: true, hdmf: true },
      });
      if (!employer) throw new Error("EMPLOYER_NOT_FOUND");

      const records = await transaction.pagibigEmployeeRecord.findMany({
        where: {
          employerId,
          year,
          excludedFromReport: false,
          employee: { AND: [{ pagIbigNumber: { not: null } }, { pagIbigNumber: { not: "" } }] },
        },
        include: {
          employee: {
            select: { id: true, employeeCode: true, firstName: true, middleName: true, lastName: true, pagIbigNumber: true },
          },
          PagibigEmployeeLoan: true,
        },
        orderBy: [{ employee: { lastName: "asc" } }, { employee: { firstName: "asc" } }, { employee: { employeeCode: "asc" } }],
      });
      if (records.length === 0) throw new Error("NO_PAGIBIG_ACCOUNTS");

      const activeLoans = records.map((record) => {
        const loans = new Map<PagibigLoanType, (typeof record.PagibigEmployeeLoan)[number]>();
        for (const loan of record.PagibigEmployeeLoan) {
          const type = normalizePagibigLoanType(loan.loanType);
          if (!type) continue;
          if (loans.has(type)) throw new Error("DUPLICATE_PAGIBIG_LOAN_TYPE");
          if (loan.status.toUpperCase() === "ACTIVE") loans.set(type, loan);
        }
        return loans;
      });
      const amountRows = records.map((record, index) => {
        const loans = activeLoans[index];
        const loanAmount = (type: (typeof PAGIBIG_LOAN_TYPES)[number]) => loans.get(type)?.amount?.toString() ?? "0";
        return {
          employeeSavings: record.eeShare.toString(),
          employerSavings: record.erShare.toString(),
          mp2Amount: record.mp2Amount.toString(),
          calamityLoanAmount: loanAmount("CAL"),
          mplLoanAmount: loanAmount("MPL"),
          emergencyLoanAmount: loanAmount("EMER"),
          safeLoanAmount: loanAmount("SAFE"),
        };
      });
      const calculation = calculatePagIbigReportTotals(amountRows);
      if (!calculation) throw new Error("INVALID_PAGIBIG_AMOUNTS");

      const entries = records.map((record, index) => {
        const amounts = calculation.entries[index];
        const loanRecords = record.PagibigEmployeeLoan.map((loan) => ({
          loanType: normalizePagibigLoanType(loan.loanType) ?? loan.loanType,
          applicationNo: loan.applicationNo,
          loanTermDate: loan.loanTermDate.toISOString().slice(0, 10),
          termYears: loan.termYears,
          termEndDate: loan.termEndDate.toISOString().slice(0, 10),
          amount: loan.amount?.toString() ?? "0",
          status: loan.status,
        }));
        const ledgerSnapshot = {
          sourceYear: year,
          eeShare: centsToDecimal(amounts.employeeSavings).toFixed(2),
          erShare: centsToDecimal(amounts.employerSavings).toFixed(2),
          mp2AccountNo: record.mp2AccountNo,
          mp2Amount: centsToDecimal(amounts.mp2Amount).toFixed(2),
          loans: loanRecords,
        };
        return {
          employeeId: record.employee.id,
          employeeName: displayName(record.employee),
          employeeCode: record.employee.employeeCode,
          employeePagibigNumber: record.employee.pagIbigNumber,
          employeeEmployerId: employer.id,
          employeeEmployerName: employer.name,
          memberSavings: centsToDecimal(amounts.employeeSavings),
          modifiedSavings: centsToDecimal(amounts.employerSavings),
          multiPurposeLoan: centsToDecimal(amounts.mplLoanAmount),
          calamityLoan: centsToDecimal(amounts.calamityLoanAmount),
          safeLoan: centsToDecimal(amounts.safeLoanAmount),
          emergencyLoan: centsToDecimal(amounts.emergencyLoanAmount),
          loanAmount: new Prisma.Decimal(0),
          totalAmount: centsToDecimal(amounts.totalCents),
          ledgerSnapshot,
        };
      });

      return transaction.pagibigReport.create({
        data: {
          kind: "CONTRIBUTION",
          employerId: employer.id,
          employerName: employer.name,
          employerPagibigNumber: employer.hdmf,
          pin,
          applicableMonth: month,
          applicableYear: year,
          amountDue: centsToDecimal(calculation.amountDueCents),
          createdBy: access.session?.id ?? null,
          updatedAt: new Date(),
          PagibigReportEntry: { create: entries },
        },
        include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } },
      });
    });
    return NextResponse.json({ report: serializePagibigReport(report) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUPLICATE_PAGIBIG_REPORT") {
        return NextResponse.json({ error: "A Pag-IBIG report already exists for this month and year" }, { status: 409 });
      }
      if (error.message === "EMPLOYER_NOT_FOUND") return NextResponse.json({ error: "Employer not found" }, { status: 404 });
      if (error.message === "NO_PAGIBIG_ACCOUNTS") {
        return NextResponse.json({ error: "Add at least one employee Pag-IBIG account for this year before generating a report" }, { status: 400 });
      }
      if (error.message === "INVALID_PAGIBIG_AMOUNTS") {
        return NextResponse.json({ error: "Saved member amounts exceed the valid report range" }, { status: 409 });
      }
      if (error.message === "DUPLICATE_PAGIBIG_LOAN_TYPE") {
        return NextResponse.json({ error: "Multiple existing records use the same Pag-IBIG loan type. Resolve the duplicate records before generating this report." }, { status: 409 });
      }
    }
    console.error("Generate Pag-IBIG report error:", error);
    return NextResponse.json({ error: "Unable to generate Pag-IBIG report" }, { status: 500 });
  }
}
