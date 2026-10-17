import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { PAGIBIG_LOAN_TYPES, getPagibigLoanTermEndDate, getPagibigLoanTypeAliases, normalizePagibigLoanType, type PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { parsePagIbigMoneyCents } from "@/lib/pagibigReportTotals";
import { prisma } from "@/lib/prisma";

const moneyDecimal = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
const dateFromInput = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};
const validYear = (value: unknown) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2020 && year <= 2200 ? year : null;
};

function accountResponse(record: {
  id: number;
  year: number;
  eeShare: Prisma.Decimal;
  erShare: Prisma.Decimal;
  mp2AccountNo: string | null;
  mp2Amount: Prisma.Decimal;
  excludedFromReport: boolean;
  PagibigEmployeeLoan: Array<{
    loanType: string;
    applicationNo: string;
    loanTermDate: Date;
    termYears: number;
    termEndDate: Date;
    amount: Prisma.Decimal | null;
    status: string;
  }>;
}) {
  const loanDetails = Object.fromEntries(PAGIBIG_LOAN_TYPES.map((type) => {
    const matchingLoans = record.PagibigEmployeeLoan.filter((item) => normalizePagibigLoanType(item.loanType) === type);
    if (matchingLoans.length > 1) throw new Error("DUPLICATE_PAGIBIG_LOAN_TYPE");
    const loan = matchingLoans[0];
    return [type, loan ? {
      applicationNo: loan.applicationNo,
      loanTermDate: loan.loanTermDate.toISOString().slice(0, 10),
      termYears: loan.termYears,
      termEndDate: loan.termEndDate.toISOString().slice(0, 10),
      amount: loan.amount?.toString() ?? "0",
      status: loan.status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    } : null];
  })) as Record<PagibigLoanType, {
    applicationNo: string;
    loanTermDate: string;
    termYears: number;
    termEndDate: string;
    amount: string;
    status: string;
  } | null>;
  const amountFor = (type: PagibigLoanType) => loanDetails[type]?.status === "ACTIVE" ? loanDetails[type]?.amount ?? "0" : "0";
  return {
    id: record.id,
    year: record.year,
    employeeSavings: record.eeShare.toString(),
    employerSavings: record.erShare.toString(),
    mp2AccountNumber: record.mp2AccountNo,
    mp2Amount: record.mp2Amount.toString(),
    excludedFromReport: record.excludedFromReport,
    calamityLoanAmount: amountFor("CAL"),
    mplLoanAmount: amountFor("MPL"),
    emergencyLoanAmount: amountFor("EMER"),
    safeLoanAmount: amountFor("SAFE"),
    loanDetails,
  };
}

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(employerId) || employerId <= 0) {
    return NextResponse.json({ error: "Select an employer to load Pag-IBIG accounts" }, { status: 400 });
  }
  const year = validYear(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  if (!year) return NextResponse.json({ error: "Select a valid account year" }, { status: 400 });

  try {
    const employees = await prisma.employee.findMany({
      where: { employerId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { employeeCode: "asc" }],
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        status: true,
        pagIbigNumber: true,
        pagibigEmployeeRecords: {
          where: { employerId, year },
          include: { PagibigEmployeeLoan: true },
        },
      },
    });
    return NextResponse.json({
      employees: employees.map(({ pagibigEmployeeRecords, ...employee }) => ({
        ...employee,
        pagIbigAccount: pagibigEmployeeRecords[0] ? accountResponse(pagibigEmployeeRecords[0]) : null,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_PAGIBIG_LOAN_TYPE") {
      return NextResponse.json({ error: "Multiple existing records use the same Pag-IBIG loan type. Resolve the duplicate records before editing this account." }, { status: 409 });
    }
    console.error("Load Pag-IBIG member accounts error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG member accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid Pag-IBIG member account" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const employerId = Number(body.employerId);
  const employeeId = Number(body.employeeId);
  const year = validYear(body.year);
  const midNumber = typeof body.midNumber === "string" ? body.midNumber.trim() : "";
  const mp2AccountNo = typeof body.mp2AccountNumber === "string" ? body.mp2AccountNumber.trim() : "";
  const eeShare = parsePagIbigMoneyCents(body.employeeSavings);
  const erShare = parsePagIbigMoneyCents(body.employerSavings);
  const mp2Amount = parsePagIbigMoneyCents(body.mp2Amount);
  const excludedFromReport = body.excludedFromReport;
  const loanPayload = body.loanDetails;

  if (!Number.isSafeInteger(employerId) || employerId <= 0 || !Number.isSafeInteger(employeeId) || employeeId <= 0 || !year || !midNumber || midNumber.length > 40
    || mp2AccountNo.length > 80 || eeShare === null || erShare === null || mp2Amount === null
    || typeof excludedFromReport !== "boolean"
    || !loanPayload || typeof loanPayload !== "object" || Array.isArray(loanPayload)) {
    return NextResponse.json({ error: "Enter a valid employee, account year, MID number, savings, MP2, and loan details" }, { status: 400 });
  }

  try {
    const account = await prisma.$transaction(async (transaction) => {
      const targetEmployee = await transaction.employee.findFirst({
        where: { id: employeeId, employerId },
        select: { id: true },
      });
      if (!targetEmployee) throw new Error("EMPLOYEE_NOT_IN_SELECTED_EMPLOYER");
      const duplicateMid = await transaction.employee.findFirst({
        where: { pagIbigNumber: midNumber, id: { not: employeeId } },
        select: { id: true },
      });
      if (duplicateMid) throw new Error("DUPLICATE_PAGIBIG_MID");
      await transaction.employee.update({ where: { id: employeeId }, data: { pagIbigNumber: midNumber } });
      const record = await transaction.pagibigEmployeeRecord.upsert({
        where: { employeeId_employerId_year: { employeeId, employerId, year } },
        create: {
          employeeId,
          employerId,
          year,
          eeShare: moneyDecimal(eeShare),
          erShare: moneyDecimal(erShare),
          mp2AccountNo: mp2AccountNo || null,
          mp2Amount: moneyDecimal(mp2Amount),
          excludedFromReport,
          updatedAt: new Date(),
        },
        update: {
          eeShare: moneyDecimal(eeShare),
          erShare: moneyDecimal(erShare),
          mp2AccountNo: mp2AccountNo || null,
          mp2Amount: moneyDecimal(mp2Amount),
          excludedFromReport,
          updatedAt: new Date(),
        },
      });
      const savedLoans = await transaction.pagibigEmployeeLoan.findMany({ where: { recordId: record.id } });
      const newLoanDetails = [];
      for (const type of PAGIBIG_LOAN_TYPES) {
        const value = (loanPayload as Record<string, unknown>)[type];
        const detail = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
        const applicationNo = typeof detail.applicationNo === "string" ? detail.applicationNo.trim() : "";
        const dateText = detail.loanTermDate;
        const loanTermDate = dateFromInput(dateText);
        const termYears = Number(detail.termYears);
        const amountCents = parsePagIbigMoneyCents(detail.amount);
        const status = detail.status === "INACTIVE" ? "INACTIVE" : detail.status === "ACTIVE" ? "ACTIVE" : "";
        if (applicationNo.length > 120 || amountCents === null) throw new Error("INVALID_PAGIBIG_LOAN");
        const matchingLoans = savedLoans.filter((loan) => getPagibigLoanTypeAliases(type).includes(loan.loanType.toUpperCase().replace(/[\s-]+/g, "_")));
        if (!applicationNo && amountCents === 0 && !loanTermDate) {
          if (matchingLoans.length) await transaction.pagibigEmployeeLoan.deleteMany({ where: { id: { in: matchingLoans.map((loan) => loan.id) } } });
          continue;
        }
        if (!applicationNo || !loanTermDate || !Number.isInteger(termYears) || termYears < 1 || termYears > 50 || !status) {
          throw new Error("INVALID_PAGIBIG_LOAN");
        }
        if (matchingLoans.length > 1) throw new Error("DUPLICATE_PAGIBIG_LOAN_TYPE");
        const duplicateApplication = await transaction.pagibigEmployeeLoan.findFirst({
          where: { employerId, loanType: { in: getPagibigLoanTypeAliases(type) }, applicationNo, recordId: { not: record.id } },
          select: { id: true },
        });
        if (duplicateApplication) throw new Error("DUPLICATE_PAGIBIG_APPLICATION");
        const loanData = {
          applicationNo,
          loanTermDate,
          termYears,
          termEndDate: getPagibigLoanTermEndDate(loanTermDate, termYears),
          amount: moneyDecimal(amountCents),
          status,
          updatedAt: new Date(),
        };
        if (matchingLoans[0]) {
          newLoanDetails.push(await transaction.pagibigEmployeeLoan.update({ where: { id: matchingLoans[0].id }, data: loanData }));
        } else {
          newLoanDetails.push(await transaction.pagibigEmployeeLoan.create({
            data: { ...loanData, recordId: record.id, employerId, loanType: type, createdAt: new Date() },
          }));
        }
      }
      const loans = [...savedLoans.filter((loan) => !PAGIBIG_LOAN_TYPES.some((type) =>
        getPagibigLoanTypeAliases(type).includes(loan.loanType.toUpperCase().replace(/[\s-]+/g, "_")))), ...newLoanDetails];
      return {
        ...record,
        PagibigEmployeeLoan: loans,
        employee: await transaction.employee.findUniqueOrThrow({
          where: { id: employeeId },
          select: { id: true, employeeCode: true, firstName: true, middleName: true, lastName: true, pagIbigNumber: true, status: true },
        }),
      };
    });
    return NextResponse.json({
      account: { ...accountResponse(account), employee: account.employee },
    }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPLOYEE_NOT_IN_SELECTED_EMPLOYER") {
      return NextResponse.json({ error: "Select an employee from the selected employer" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "DUPLICATE_PAGIBIG_MID") {
      return NextResponse.json({ error: "This MID number is already assigned to another employee" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INVALID_PAGIBIG_LOAN") {
      return NextResponse.json({ error: "Each loan needs an application number, valid start date, loan term, status, and non-negative amount" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "DUPLICATE_PAGIBIG_LOAN_TYPE") {
      return NextResponse.json({ error: "Multiple existing records use the same Pag-IBIG loan type. Resolve the duplicate records before editing this account." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "DUPLICATE_PAGIBIG_APPLICATION") {
      return NextResponse.json({ error: "This application number is already assigned to another employee for this loan type" }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "This application number is already assigned to another employee for this loan type" }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    console.error("Save Pag-IBIG member account error:", error);
    return NextResponse.json({ error: "Unable to save Pag-IBIG member account" }, { status: 500 });
  }
}
