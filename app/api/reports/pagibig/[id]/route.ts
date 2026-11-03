import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { serializePagibigReport } from "@/lib/pagibigReportSerialization";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";
import { calculatePagIbigReportTotals } from "@/lib/pagibigReportTotals";
import { PAGIBIG_LOAN_TYPES, normalizePagibigLoanType, type PagibigLoanType } from "@/lib/pagibigLoanTypes";

type RouteContext = { params: Promise<{ id: string }> };
const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid Pag-IBIG report id" }, { status: 400 });
  if (!Number.isSafeInteger(employerId) || employerId <= 0) return NextResponse.json({ error: "Select an employer to update Pag-IBIG payment details" }, { status: 400 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const amount = Number(body.amountPaid);
  const paymentType = typeof body.paymentType === "string" ? body.paymentType : "";
  const payDateText = typeof body.payDate === "string" ? body.payDate : "";
  const transactionReference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";
  const adjustments = body.adjustments === undefined || body.adjustments === null ? 0 : Number(body.adjustments);
  const payDate = /^\d{4}-\d{2}-\d{2}$/.test(payDateText) ? new Date(`${payDateText}T00:00:00.000Z`) : null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999.99
    || !paymentTypes.includes(paymentType) || !payDate || Number.isNaN(payDate.getTime())
    || payDate.toISOString().slice(0, 10) !== payDateText
    || transactionReference.length > 120
    || !Number.isFinite(adjustments) || adjustments < 0 || adjustments > 999_999_999.99) {
    return NextResponse.json({ error: "Enter a valid amount, payment type, pay date, and transaction reference" }, { status: 400 });
  }

  try {
    const data = {
      amountPaid: new Prisma.Decimal(amount.toFixed(2)),
      paymentType,
      payDate,
      transactionReference: transactionReference || null,
      adjustments: new Prisma.Decimal(adjustments.toFixed(2)),
    };
    let report;
    if (access.session?.role === "ADMIN") {
      const result = await prisma.pagibigReport.updateMany({
        where: { id, employerId },
        data,
      });
      if (result.count === 0) return NextResponse.json({ error: "Pag-IBIG report not found for the selected employer" }, { status: 404 });
      report = await prisma.pagibigReport.findUniqueOrThrow({ where: { id }, include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } } });
    } else {
      const result = await prisma.pagibigReport.updateMany({ where: { id, employerId, amountPaid: null }, data });
      if (result.count === 0) {
        const exists = await prisma.pagibigReport.findFirst({ where: { id, employerId }, select: { id: true } });
        return NextResponse.json(
          { error: exists ? "Admin access is required to edit recorded payment details" : "Pag-IBIG report not found" },
          { status: exists ? 403 : 404 },
        );
      }
      report = await prisma.pagibigReport.findUniqueOrThrow({ where: { id }, include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } } });
    }
    return NextResponse.json({ report: serializePagibigReport(report) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Pag-IBIG report not found" }, { status: 404 });
    }
    console.error("Update Pag-IBIG payment error:", error);
    return NextResponse.json({ error: "Unable to record Pag-IBIG payment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  if (access.session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access is required to delete Pag-IBIG reports" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid Pag-IBIG report id" }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.pagibigReportEntry.deleteMany({ where: { reportId: id } }),
      prisma.pagibigReport.delete({ where: { id } }),
    ]);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Pag-IBIG report not found" }, { status: 404 });
    }
    console.error("Delete Pag-IBIG report error:", error);
    return NextResponse.json({ error: "Unable to delete Pag-IBIG report" }, { status: 500 });
  }
}


const centsToDecimal = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const displayName = (employee: { firstName: string; middleName: string | null; lastName: string }) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid Pag-IBIG report id" }, { status: 400 });
  if (!Number.isSafeInteger(employerId) || employerId <= 0) return NextResponse.json({ error: "Select an employer to update the Pag-IBIG report" }, { status: 400 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid Pag-IBIG report request" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const employeeIds = Array.isArray(body.employeeIds)
    ? body.employeeIds.map((value) => Number(value)).filter((value) => Number.isSafeInteger(value) && value > 0)
    : undefined;

  try {
    const updatedReport = await prisma.$transaction(async (transaction) => {
      const existingReport = await transaction.pagibigReport.findFirst({
        where: { id, employerId },
        select: { id: true, applicableMonth: true, applicableYear: true, pin: true, kind: true, manual: true },
      });
      if (!existingReport) throw new Error("REPORT_NOT_FOUND"); const reportKind = existingReport.kind === "LOAN" ? "LOAN" : "CONTRIBUTION"; const reportManual = existingReport.manual;

      const employer = await transaction.employer.findUnique({ where: { id: employerId }, select: { id: true, name: true, hdmf: true } });
      if (!employer) throw new Error("EMPLOYER_NOT_FOUND");

      const year = existingReport.applicableYear;
      const finalPin = pin || existingReport.pin;

      const records = await transaction.pagibigEmployeeRecord.findMany({
        where: {
          employerId,
          year,
          excludedFromReport: false,
          ...(employeeIds !== undefined ? { employeeId: { in: employeeIds } } : {}),
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
      const adjustedAmountRows = reportManual ? amountRows.map((row) => reportKind === "CONTRIBUTION" ? { ...row, calamityLoanAmount: "0", mplLoanAmount: "0", emergencyLoanAmount: "0", safeLoanAmount: "0" } : { ...row, employeeSavings: "0", employerSavings: "0", mp2Amount: "0" }) : amountRows; const calculation = calculatePagIbigReportTotals(adjustedAmountRows);
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

      await transaction.pagibigReportEntry.deleteMany({ where: { reportId: id } });
      const report = await transaction.pagibigReport.update({
        where: { id },
        data: {
          pin: finalPin,
          amountDue: centsToDecimal(calculation.amountDueCents),
          updatedAt: new Date(),
          PagibigReportEntry: { create: entries },
        },
        include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } },
      });
      return report;
    });

    return NextResponse.json({ report: serializePagibigReport(updatedReport) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "REPORT_NOT_FOUND") return NextResponse.json({ error: "Pag-IBIG report not found for the selected employer" }, { status: 404 });
      if (error.message === "NO_PAGIBIG_ACCOUNTS") {
        return NextResponse.json({ error: "Add at least one employee Pag-IBIG account for this year before updating the report" }, { status: 400 });
      }
      if (error.message === "INVALID_PAGIBIG_AMOUNTS") {
        return NextResponse.json({ error: "Saved member amounts exceed the valid report range" }, { status: 409 });
      }
      if (error.message === "DUPLICATE_PAGIBIG_LOAN_TYPE") {
        return NextResponse.json({ error: "Multiple existing records use the same Pag-IBIG loan type. Resolve the duplicate records before updating the report." }, { status: 409 });
      }
    }
    console.error("Update Pag-IBIG report error:", error);
    return NextResponse.json({ error: "Unable to update Pag-IBIG report" }, { status: 500 });
  }
}
