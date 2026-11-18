"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { Prisma } from "../../prisma/generated/client";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";
import {
  normalizeLoanReportMonthlyAmount,
  sumLoanReportMonthlyAmounts,
} from "@/lib/loanReportMonthly";
import { validateLoanReportSnapshotInput } from "@/lib/loanReportSnapshot";
import {
  hasDuplicateLoanReportMonth,
  validateLoanReportEmployerId,
} from "@/lib/loanReportGeneration";
import {
  hasCompleteHistoricalSssPayment,
  isLoanReportPosted,
} from "@/lib/loanReportDisplay";
import { findHistoricalSssImportDuplicate } from "@/lib/historicalSssLoanImport";
import { canViewPage } from "@/lib/pageAccess";
import {
  findLoanMonitorReportDatabase,
  getCentralSssLoansPrisma,
  getSssLoansPrisma,
} from "@/lib/sssReportPrisma";

export type LoanEmployee = {
  id: number;
  fullName: string;
};

export type LoanRow = {
  id: string;
  provider: "SSS" | "PAGIBIG";
  loanType: string;
  loanAccountNumber: string;
  loanDate: string | null;
  terms: string;
  statusReason: string;
  totalAmount: string; // "" when not set (Loan Amount is optional)
  monthlyAmortization: string;
  outstandingBalance: string; // "" when not set
  status: "ACTIVE" | "INACTIVE";
  employeeName: string;
  employeeNameMiddleInitial: string;
  employeeSssNumber: string | null;
  employeeId: number | null;
  employerName: string;
};

export type LoanReportRow = {
  id: string;
  applicableDate: string;
  employerName?: string | null;
  employerSssNumber?: string | null;
  employerAddress?: string | null;
  loanCount: number;
  totalMonthly: string;
  totalOutstanding: string;
  prn: string | null;
  paymentDate: string | null;
  amountPaid: string | null;
  paymentBranch: string | null;
  transactionReference: string | null;
  createdAt: string;
  createdBy: string | null;
  entries: LoanReportEntry[];
  historicalSssReport?: HistoricalSssLoanReport;
};

export type LoanReportEntry = {
  id: string;
  loanId: string;
  provider: string;
  loanType: string;
  loanAccountNumber: string;
  employeeName: string;
  loanDate: string | null;
  terms: string;
  totalAmount: string;
  monthlyAmortization: string;
  outstandingBalance: string;
  status: string;
  statusReason: string;
  employerName: string;
  employerSssNumber: string | null;
  employerAddress: string | null;
};

export type HistoricalSssLoanReportEntry = {
  id: number;
  employeeName: string;
  employeeSssNumber: string | null;
  loanAccountNumber: string | null;
  loanAmountDue: string;
};

export type HistoricalSssLoanReport = {
  sourceSystem: "legacy" | "imported";
  sourceReportId: number;
  employerName: string;
  employerAddress: string | null;
  employerSssNumber: string | null;
  applicableMonth: number;
  applicableYear: number;
  prn: string;
  amountDue: string;
  amountPaid: string | null;
  paymentType: string | null;
  payDate: string | null;
  sssBranch: string | null;
  transactionReference: string | null;
  createdAt: string;
  entries: HistoricalSssLoanReportEntry[];
};

export type GenerateLoanReportInput = {
  employerId: number;
  applicableDate: string;
  entries: { loanId: string; monthlyAmortization: string }[];
};

export type LoanDetailsInput = {
  employeeId: number;
  provider: "SSS" | "PAGIBIG";
  loanType: string;
  loanAccountNumber: string;
  loanDate?: string;
  terms?: string;
  status?: string;
  statusReason?: string;
  totalAmount: string;
  monthlyAmortization: string;
  outstandingBalance?: string;
};

export type UpdateLoanInput = LoanDetailsInput & { id: string };

export async function requireAdmin(): Promise<Session> {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");

  let session: Session | null = null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    session = typeof payload === "string" ? null : (payload as Session);
  } catch (error) {
    redirect(error instanceof jwt.TokenExpiredError ? "/login?reason=session-expired" : "/login");
  }

  if (!session) redirect("/login");
  if (session.role !== "ADMIN") {
    throw new Error("Unauthorized: administrator access is required.");
  }
  return session;
}

async function requirePostedLoanReportsAccess(): Promise<Session> {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");

  let session: Session | null = null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    session = typeof payload === "string" ? null : (payload as Session);
  } catch (error) {
    redirect(error instanceof jwt.TokenExpiredError ? "/login?reason=session-expired" : "/login");
  }

  if (!session) redirect("/login");
  if (!canViewPage(session, "/loans/posted-reports")) {
    throw new Error("Unauthorized: Posted Reports access is required.");
  }
  return session;
}

const fullName = (row: { firstName: string; middleName: string | null; lastName: string }) =>
  [row.lastName, row.firstName, row.middleName].filter(Boolean).join(", ").replace(", ,", ", ");
const fullNameWithMiddleInitial = (row: { firstName: string; middleName: string | null; lastName: string }) =>
  [row.lastName, [row.firstName, row.middleName?.trim() ? `${row.middleName.trim().charAt(0)}.` : ""].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

export async function getLoans(): Promise<LoanRow[]> {
  await requireAdmin();
  const [pagibigLoans, sssLoans] = await Promise.all([
    prisma.loan.findMany({
      where: { provider: "PAGIBIG" },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            sssNumber: true,
            employer: { select: { name: true, company: true } },
          },
        },
      },
    }),
    getSssLoansPrisma().loan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const sssEmployeeIds = [...new Set(sssLoans.flatMap((loan) => loan.employeeId === null ? [] : [loan.employeeId]))];
  const sssEmployees = sssEmployeeIds.length
    ? await prisma.employee.findMany({
      where: { id: { in: sssEmployeeIds } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        sssNumber: true,
        employer: { select: { name: true, company: true } },
      },
    })
    : [];
  const employeeById = new Map(sssEmployees.map((employee) => [employee.id, employee]));
  const mappedPagibig = pagibigLoans.map((loan) => ({
    id: loan.id,
    provider: loan.provider,
    loanType: loan.loanType,
    loanAccountNumber: loan.loanAccountNumber,
    loanDate: loan.loanDate ? loan.loanDate.toISOString().slice(0, 10) : null,
    terms: loan.terms == null ? "" : String(loan.terms),
    statusReason: loan.statusReason ?? "",
    totalAmount: loan.totalAmount === null ? "" : String(loan.totalAmount),
    monthlyAmortization: String(loan.monthlyAmortization),
    outstandingBalance: loan.outstandingBalance === null ? "" : String(loan.outstandingBalance),
    status: loan.status,
    employeeName: loan.employee ? fullName(loan.employee) : "Detached employee",
    employeeNameMiddleInitial: loan.employee ? fullNameWithMiddleInitial(loan.employee) : "Detached employee",
    employeeSssNumber: loan.employee?.sssNumber ?? null,
    employeeId: loan.employee?.id ?? null,
    employerName: loan.employee?.employer?.name || loan.employee?.employer?.company || "",
    createdAt: loan.createdAt,
  }));
  const mappedSss = sssLoans.map((loan) => {
    const employee = loan.employeeId === null ? null : employeeById.get(loan.employeeId) ?? null;
    return {
      id: loan.id,
      provider: loan.provider,
      loanType: loan.loanType,
      loanAccountNumber: loan.loanAccountNumber,
      loanDate: loan.loanDate ? loan.loanDate.toISOString().slice(0, 10) : null,
      terms: loan.terms == null ? "" : String(loan.terms),
      statusReason: loan.statusReason ?? "",
      totalAmount: loan.totalAmount === null ? "" : String(loan.totalAmount),
      monthlyAmortization: String(loan.monthlyAmortization),
      outstandingBalance: loan.outstandingBalance === null ? "" : String(loan.outstandingBalance),
      status: loan.status,
      employeeName: employee ? fullName(employee) : "Detached employee",
      employeeNameMiddleInitial: employee ? fullNameWithMiddleInitial(employee) : "Detached employee",
      employeeSssNumber: employee?.sssNumber ?? null,
      employeeId: employee?.id ?? null,
      employerName: employee?.employer?.name || employee?.employer?.company || "",
      createdAt: loan.createdAt,
    };
  });
  return [...mappedPagibig, ...mappedSss]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map(({ createdAt: _createdAt, ...loan }) => loan);
}

export async function getEmployeesLookup(): Promise<LoanEmployee[]> {
  await requireAdmin();
  const employees = await prisma.employee.findMany({
    where: { status: { in: ["Regular", "Contractual", "Trainee", "Leave"] } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, middleName: true, lastName: true },
  });
  return employees.map((row) => ({ id: row.id, fullName: fullName(row) }));
}

const sssLoanTypes = new Set(["Salary", "Calamity", "Emergency"]);
const pagibigLoanTypes = new Set(["MPL", "Calamity", "Emergency", "SAFE"]);

function validateLoanInput(input: LoanDetailsInput) {
  const employeeId = Number(input.employeeId);
  if (input.provider !== "SSS" && input.provider !== "PAGIBIG") {
    throw new Error("Select a valid loan provider.");
  }
  // Loan amount is optional for both providers; unset means unknown for now.
  const totalAmount = input.totalAmount !== undefined && input.totalAmount !== "" ? Number(input.totalAmount) : null;
  const monthlyAmortization = Number(input.monthlyAmortization);
  const outstandingBalance =
    input.outstandingBalance !== undefined && input.outstandingBalance !== ""
      ? Number(input.outstandingBalance)
      : totalAmount;
  const loanDateValue = input.loanDate?.trim() ?? "";
  const loanDate = loanDateValue ? new Date(`${loanDateValue}T00:00:00.000Z`) : null;
  const provider = input.provider;
  const terms = provider === "PAGIBIG" && input.terms ? Number(input.terms) : null;
  const allowedTypes = provider === "PAGIBIG" ? pagibigLoanTypes : sssLoanTypes;
  const loanType = input.loanType.trim();

  if (!Number.isInteger(employeeId) || employeeId <= 0) throw new Error("Select a valid employee.");
  if (!allowedTypes.has(loanType)) {
    throw new Error(provider === "PAGIBIG"
      ? "Loan type must be MPL, Calamity, Emergency, or SAFE."
      : "Loan type must be Salary, Calamity, or Emergency.");
  }
  if (!input.loanAccountNumber.trim()) {
    throw new Error(provider === "PAGIBIG" ? "Application No. is required." : "Loan account number is required.");
  }
  if (!Number.isFinite(monthlyAmortization) || !(monthlyAmortization > 0)) {
    throw new Error("Monthly amortization must be greater than zero.");
  }
  if (totalAmount !== null && (!Number.isFinite(totalAmount) || !(totalAmount > 0))) {
    throw new Error("Loan amount must be greater than zero when provided.");
  }
  if (
    outstandingBalance !== null &&
    (!Number.isFinite(outstandingBalance) ||
      !(outstandingBalance >= 0 && (totalAmount === null || outstandingBalance <= totalAmount)))
  ) {
    throw new Error("Outstanding balance must be between 0 and the loan amount.");
  }
  if (
    loanDateValue &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(loanDateValue) ||
      !loanDate ||
      Number.isNaN(loanDate.getTime()) ||
      loanDate.toISOString().slice(0, 10) !== loanDateValue)
  ) {
    throw new Error("Enter a valid loan date.");
  }
  if (input.status === "INACTIVE" && !["Fully Paid", "Closed"].includes(input.statusReason ?? "")) {
    throw new Error("Select a reason for inactive loans: Fully Paid or Closed.");
  }
  if (provider === "PAGIBIG" && input.terms && ![1, 2, 3].includes(terms!)) {
    throw new Error("Terms must be 1, 2, or 3 years.");
  }

  return {
    employeeId,
    provider,
    loanType,
    loanAccountNumber: input.loanAccountNumber.trim(),
    loanDate,
    terms,
    totalAmount: totalAmount === null ? null : totalAmount,
    monthlyAmortization,
    outstandingBalance: outstandingBalance === null ? null : outstandingBalance,
    status: (input.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
    statusReason: input.status === "INACTIVE" ? input.statusReason ?? "" : "",
  };
}

export async function createLoan(input: LoanDetailsInput): Promise<{ ok: true }> {
  await requireAdmin();
  const data = validateLoanInput(input);
  const employee = await prisma.employee.findFirst({
    where: {
      id: data.employeeId,
      status: { in: ["Regular", "Contractual", "Trainee", "Leave"] },
    },
    select: { id: true },
  });
  if (!employee) throw new Error("Select an active employee.");

  try {
    if (data.provider === "SSS") {
      await getSssLoansPrisma().loan.create({ data: { ...data, provider: "SSS" } });
    } else {
      await prisma.loan.create({ data: { ...data, provider: "PAGIBIG" } });
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") throw new Error("That loan account number is already recorded.");
    throw error;
  }

  revalidatePath("/loans");
  return { ok: true };
}

export async function updateLoan(input: UpdateLoanInput): Promise<{ ok: true }> {
  await requireAdmin();
  const { id, ...rest } = input;
  const data = validateLoanInput(rest);

  try {
    if (data.provider === "SSS") {
      await getSssLoansPrisma().loan.update({ where: { id }, data: { ...data, provider: "SSS" } });
    } else {
      await prisma.loan.update({ where: { id }, data: { ...data, provider: "PAGIBIG" } });
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") throw new Error("That loan account number is already recorded.");
    if (code === "P2025") throw new Error("Loan not found.");
    throw error;
  }

  revalidatePath("/loans");
  return { ok: true };
}

export async function getLoan(loanId: string): Promise<LoanRow | null> {
  const loans = await getLoans();
  return loans.find((loan) => loan.id === loanId) ?? null;
}

export async function deleteLoan(loanId: string): Promise<{ ok: true }> {
  await requireAdmin();
  try {
    const sssLoan = await getSssLoansPrisma().loan.findUnique({ where: { id: loanId }, select: { id: true } });
    if (sssLoan) await getSssLoansPrisma().loan.delete({ where: { id: loanId } });
    else await prisma.loan.delete({ where: { id: loanId } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") throw new Error("Loan not found. It may have already been deleted.");
    throw error;
  }
  revalidatePath("/loans");
  return { ok: true };
}

export async function getLoanEmployers(): Promise<{ id: number; name: string }[]> {
  await requireAdmin();
  const employers = await prisma.employer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });
  return employers.map((row) => ({ id: row.id, name: row.name || row.company || "" })).filter((row) => row.name);
}

async function getLoanReportsByPostingStatus(posted: boolean): Promise<LoanReportRow[]> {
  if (posted) await requirePostedLoanReportsAccess();
  else await requireAdmin();
  const [centralReports, sssReports] = await Promise.all([
    getCentralSssLoansPrisma().loanMonitorReport.findMany({
      orderBy: [{ applicableDate: "desc" }, { createdAt: "desc" }],
      include: { entries: true },
    }),
    getSssLoansPrisma().loanMonitorReport.findMany({
      orderBy: [{ applicableDate: "desc" }, { createdAt: "desc" }],
      include: { entries: true },
    }),
  ]);
  const reports = [
    ...centralReports.filter((report) =>
      !report.entries.some((entry) => entry.provider === "SSS")
      || report.entries.some((entry) => entry.provider !== "SSS"),
    ),
    ...sssReports,
  ];
  const creatorIds = [...new Set(reports.flatMap((report) => report.createdBy === null ? [] : [report.createdBy]))];
  const creators = creatorIds.length
    ? await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, username: true, email: true },
    })
    : [];
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));
  const mappedReports = reports.map((report) => ({
    id: report.id,
    applicableDate: report.applicableDate.toISOString().slice(0, 10),
    employerName: report.employerName,
    employerSssNumber: report.employerSssNumber,
    employerAddress: report.employerAddress,
    loanCount: report.entries.length,
    totalMonthly: String(report.totalMonthly),
    totalOutstanding: String(report.totalOutstanding),
    prn: report.prn,
    paymentDate: report.paymentDate?.toISOString().slice(0, 10) ?? null,
    amountPaid: report.amountPaid == null ? null : String(report.amountPaid),
    paymentBranch: report.paymentBranch,
    transactionReference: report.transactionReference,
    createdAt: report.createdAt.toISOString(),
    createdBy: report.createdBy === null
      ? null
      : creatorById.get(report.createdBy)?.name || creatorById.get(report.createdBy)?.username || creatorById.get(report.createdBy)?.email || null,
    entries: report.entries.map((entry) => ({
      id: entry.id,
      loanId: entry.loanId,
      provider: entry.provider,
      loanType: entry.loanType,
      loanAccountNumber: entry.loanAccountNumber,
      employeeName: entry.employeeName,
      loanDate: entry.loanDate ? entry.loanDate.toISOString().slice(0, 10) : null,
      terms: entry.terms == null ? "" : String(entry.terms),
      totalAmount: String(entry.totalAmount),
      monthlyAmortization: String(entry.monthlyAmortization),
      outstandingBalance: String(entry.outstandingBalance),
      status: entry.status,
      statusReason: entry.statusReason ?? "",
      employerName: entry.employerName,
      employerSssNumber: entry.employerSssNumber,
      employerAddress: entry.employerAddress,
    })),
  }));
  return mappedReports.filter((report) => isLoanReportPosted(report) === posted);
}

export async function getLoanReports(): Promise<LoanReportRow[]> {
  return getLoanReportsByPostingStatus(false);
}

export async function getPostedLoanReports(): Promise<LoanReportRow[]> {
  return getLoanReportsByPostingStatus(true);
}

async function loadHistoricalSssLoanReports(): Promise<HistoricalSssLoanReport[]> {
  const sssLoans = getSssLoansPrisma();
  const [legacyReports, importedReports] = await Promise.all([
    sssLoans.sssReport.findMany({
      where: { kind: "LOAN" },
      orderBy: [{ applicableYear: "desc" }, { applicableMonth: "desc" }, { id: "desc" }],
      select: {
        id: true,
        employerName: true,
        employerAddress: true,
        employerSssNumber: true,
        applicableMonth: true,
        applicableYear: true,
        prn: true,
        amountDue: true,
        amountPaid: true,
        paymentType: true,
        payDate: true,
        sssBranch: true,
        transactionReference: true,
        createdAt: true,
        entries: {
          orderBy: { employeeName: "asc" },
          select: {
            id: true,
            employeeName: true,
            employeeSssNumber: true,
            loanAccountNumber: true,
            loanAmount: true,
          },
        },
      },
    }),
    sssLoans.importedSssLoanReport.findMany({
      where: { sourceKind: "LOAN" },
      orderBy: [{ applicableYear: "desc" }, { applicableMonth: "desc" }, { sourceReportId: "desc" }],
      select: {
        sourceReportId: true,
        employerName: true,
        employerAddress: true,
        employerSssNumber: true,
        applicableMonth: true,
        applicableYear: true,
        prn: true,
        amountDue: true,
        amountPaid: true,
        paymentType: true,
        payDate: true,
        sssBranch: true,
        transactionReference: true,
        sourceCreatedAt: true,
        entries: {
          orderBy: { employeeName: "asc" },
          select: {
            sourceEntryId: true,
            employeeName: true,
            employeeSssNumber: true,
            loanAccountNumber: true,
            loanAmount: true,
          },
        },
      },
    }),
  ]);
  const legacy = legacyReports.map((report) => ({
    sourceSystem: "legacy" as const,
    sourceReportId: report.id,
    employerName: report.employerName,
    employerAddress: report.employerAddress,
    employerSssNumber: report.employerSssNumber,
    applicableMonth: report.applicableMonth,
    applicableYear: report.applicableYear,
    prn: report.prn,
    amountDue: String(report.amountDue),
    amountPaid: report.amountPaid === null ? null : String(report.amountPaid),
    paymentType: report.paymentType,
    payDate: report.payDate?.toISOString().slice(0, 10) ?? null,
    sssBranch: report.sssBranch,
    transactionReference: report.transactionReference,
    createdAt: report.createdAt.toISOString(),
    entries: report.entries.map((entry) => ({
      id: entry.id,
      employeeName: entry.employeeName,
      employeeSssNumber: entry.employeeSssNumber,
      loanAccountNumber: entry.loanAccountNumber,
      loanAmountDue: String(entry.loanAmount),
    })),
  }));
  const imported = importedReports.map((report) => ({
    sourceSystem: "imported" as const,
    sourceReportId: report.sourceReportId,
    employerName: report.employerName,
    employerAddress: report.employerAddress,
    employerSssNumber: report.employerSssNumber,
    applicableMonth: report.applicableMonth,
    applicableYear: report.applicableYear,
    prn: report.prn,
    amountDue: String(report.amountDue),
    amountPaid: report.amountPaid === null ? null : String(report.amountPaid),
    paymentType: report.paymentType,
    payDate: report.payDate?.toISOString().slice(0, 10) ?? null,
    sssBranch: report.sssBranch,
    transactionReference: report.transactionReference,
    createdAt: report.sourceCreatedAt.toISOString(),
    entries: report.entries.map((entry) => ({
      id: entry.sourceEntryId,
      employeeName: entry.employeeName,
      employeeSssNumber: entry.employeeSssNumber,
      loanAccountNumber: entry.loanAccountNumber,
      loanAmountDue: String(entry.loanAmount),
    })),
  }));

  const importedSourceReportIds = new Set(imported.map((report) => report.sourceReportId));
  return [
    ...legacy.filter((report) => !importedSourceReportIds.has(report.sourceReportId)),
    ...imported,
  ].sort((a, b) =>
    b.applicableYear - a.applicableYear ||
    b.applicableMonth - a.applicableMonth ||
    b.sourceReportId - a.sourceReportId,
  );
}

export async function getHistoricalSssLoanReports(): Promise<HistoricalSssLoanReport[]> {
  await requireAdmin();
  return loadHistoricalSssLoanReports();
}

export async function getHistoricalSssLoanPayments(): Promise<HistoricalSssLoanReport[]> {
  await requirePostedLoanReportsAccess();
  const [reports, centralPostedReports, sssPostedReports] = await Promise.all([
    loadHistoricalSssLoanReports(),
    getCentralSssLoansPrisma().loanMonitorReport.findMany({
      where: {
        prn: { not: null },
        paymentDate: { not: null },
        entries: { some: { provider: "SSS" } },
      },
      select: {
        employerName: true,
        applicableDate: true,
        prn: true,
        paymentDate: true,
        entries: {
          where: { provider: "SSS" },
          select: { loanAccountNumber: true },
        },
      },
    }),
    getSssLoansPrisma().loanMonitorReport.findMany({
      where: {
        prn: { not: null },
        paymentDate: { not: null },
        entries: { some: { provider: "SSS" } },
      },
      select: {
        employerName: true,
        applicableDate: true,
        prn: true,
        paymentDate: true,
        entries: {
          where: { provider: "SSS" },
          select: { loanAccountNumber: true },
        },
      },
    }),
  ]);
  const postedMatches = [...centralPostedReports, ...sssPostedReports]
    .filter((report) => Boolean(report.prn?.trim() && report.paymentDate))
    .map((report) => ({
      employerName: report.employerName,
      applicableMonth: report.applicableDate.getUTCMonth() + 1,
      applicableYear: report.applicableDate.getUTCFullYear(),
      prn: report.prn,
      loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
    }));

  return reports.filter((report) =>
    hasCompleteHistoricalSssPayment({
      amountPaid: report.amountPaid,
      paymentBranch: report.sssBranch,
      paymentDate: report.payDate,
      transactionReference: report.transactionReference,
      prn: report.prn,
    }) &&
    findHistoricalSssImportDuplicate({
      sourceReportId: report.sourceReportId,
      employerName: report.employerName,
      applicableMonth: report.applicableMonth,
      applicableYear: report.applicableYear,
      prn: report.prn,
      loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
    }, postedMatches) === null,
  );
}

export async function getAvailableSssLoansForLoanReport(reportId: string): Promise<LoanRow[]> {
  await requireAdmin();
  if (typeof reportId !== "string" || !reportId.trim()) {
    throw new Error("Report ID is required.");
  }

  const reportDatabase = await findLoanMonitorReportDatabase(reportId.trim());
  if (!reportDatabase) throw new Error("Loan report not found.");
  const report = await reportDatabase.loanMonitorReport.findUnique({
    where: { id: reportId.trim() },
    select: {
      prn: true,
      paymentDate: true,
      entries: { select: { loanId: true } },
    },
  });
  if (!report) throw new Error("Loan report not found.");
  if (isLoanReportPosted({
    prn: report.prn,
    paymentDate: report.paymentDate?.toISOString().slice(0, 10) ?? null,
  })) {
    throw new Error("Posted loan reports cannot be edited.");
  }

  const existingLoanIds = new Set(report.entries.map((entry) => entry.loanId));
  return (await getLoans())
    .filter((loan) => loan.provider === "SSS" && loan.employeeId !== null && !existingLoanIds.has(loan.id))
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName));
}

export async function updateLoanReportPaymentDetails(
  reportId: string,
  input: {
    amountPaid: string;
    paymentBranch: string;
    paymentDate: string;
    transactionReference: string;
    prn: string;
  },
): Promise<{ ok: true }> {
  await requireAdmin();

  if (typeof reportId !== "string" || !reportId.trim()) {
    throw new Error("Report ID is required.");
  }
  if (
    !input ||
    typeof input.amountPaid !== "string" ||
    typeof input.paymentBranch !== "string" ||
    typeof input.prn !== "string" ||
    typeof input.paymentDate !== "string" ||
    typeof input.transactionReference !== "string"
  ) {
    throw new Error("Enter valid report payment details.");
  }

  const id = reportId.trim();
  const amountPaidValue = input.amountPaid.trim();
  const paymentBranch = input.paymentBranch.trim();
  const transactionReference = input.transactionReference.trim();
  const prn = input.prn.trim();
  const paymentDateValue = input.paymentDate.trim();
  if (!amountPaidValue) throw new Error("Amount Paid is required.");
  if (!paymentBranch) throw new Error("Payment Branch is required.");
  if (!paymentDateValue) throw new Error("Pay Date is required.");
  if (!transactionReference) throw new Error("Trans Ref# is required.");
  if (!prn) throw new Error("PRN is required.");
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(amountPaidValue)) {
    throw new Error("Amount Paid must be a non-negative amount with up to two decimal places.");
  }
  if (paymentBranch.length > 200) {
    throw new Error("Payment Branch must be 200 characters or fewer.");
  }
  if (transactionReference.length > 100) {
    throw new Error("Trans Ref# must be 100 characters or fewer.");
  }
  if (prn.length > 100) throw new Error("PRN must be 100 characters or fewer.");

  let paymentDate: Date | null = null;
  if (paymentDateValue) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDateValue)) {
      throw new Error("Enter a valid payment date.");
    }
    paymentDate = new Date(`${paymentDateValue}T00:00:00Z`);
    if (
      Number.isNaN(paymentDate.getTime()) ||
      paymentDate.toISOString().slice(0, 10) !== paymentDateValue
    ) {
      throw new Error("Enter a valid payment date.");
    }
  }

  try {
    const reportDatabase = await findLoanMonitorReportDatabase(id);
    if (!reportDatabase) throw new Error("Loan report not found.");
    await reportDatabase.loanMonitorReport.update({
      where: { id },
      data: {
        amountPaid: amountPaidValue ? new Prisma.Decimal(amountPaidValue) : null,
        paymentBranch: paymentBranch || null,
        paymentDate,
        transactionReference: transactionReference || null,
        prn: prn || null,
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") throw new Error("Loan report not found.");
    throw error;
  }

  revalidatePath("/loans");
  revalidatePath("/loans/reports");
  revalidatePath("/loans/posted-reports");
  return { ok: true };
}

export async function updateLoanReportSnapshot(
  reportId: string,
  input: unknown,
): Promise<{ ok: true }> {
  await requireAdmin();
  if (typeof reportId !== "string" || !reportId.trim()) {
    throw new Error("Report ID is required.");
  }

  const id = reportId.trim();
  const snapshot = validateLoanReportSnapshotInput(input);
  const totalMonthly = new Prisma.Decimal(
    sumLoanReportMonthlyAmounts(snapshot.entries.map((entry) => entry.monthlyAmortization)),
  );
  const reportDatabase = await findLoanMonitorReportDatabase(id);
  if (!reportDatabase) throw new Error("Loan report not found.");

  await reportDatabase.$transaction(async (transaction) => {
    const report = await transaction.loanMonitorReport.findUnique({
      where: { id },
      select: {
        prn: true,
        paymentDate: true,
        employerName: true,
        employerSssNumber: true,
        employerAddress: true,
        entries: {
          select: {
            id: true,
            loanId: true,
            outstandingBalance: true,
          },
        },
      },
    });
    if (!report) throw new Error("Loan report not found.");
    if (isLoanReportPosted({
      prn: report.prn,
      paymentDate: report.paymentDate?.toISOString().slice(0, 10) ?? null,
    })) {
      throw new Error("Posted loan reports cannot be edited.");
    }

    const reportEntryById = new Map(report.entries.map((entry) => [entry.id, entry]));
    const retainedEntryIds = snapshot.entries.flatMap((entry) => "id" in entry ? [entry.id] : []);
    const addedLoanIds = snapshot.entries.flatMap((entry) => "loanId" in entry ? [entry.loanId] : []);
    if (retainedEntryIds.some((entryId) => !reportEntryById.has(entryId))) {
      throw new Error("The report contains an entry that cannot be edited.");
    }
    const existingLoanIds = new Set(report.entries.map((entry) => entry.loanId));
    if (addedLoanIds.some((loanId) => existingLoanIds.has(loanId))) {
      throw new Error("An SSS loan account is already included in this report.");
    }

    const sourceLoans = addedLoanIds.length > 0
      ? await getSssLoansPrisma().loan.findMany({
          where: {
            id: { in: addedLoanIds },
            employeeId: { not: null },
          },
        })
      : [];
    const addedEmployeeIds = [...new Set(sourceLoans.flatMap((loan) => loan.employeeId === null ? [] : [loan.employeeId]))];
    const addedEmployees = addedEmployeeIds.length
      ? await prisma.employee.findMany({
        where: { id: { in: addedEmployeeIds } },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          employer: {
            select: {
              name: true,
              company: true,
              sss: true,
              longAddress: true,
              shortAddress: true,
            },
          },
        },
      })
      : [];
    const addedEmployeeById = new Map(addedEmployees.map((employee) => [employee.id, employee]));
    const addedLoans = sourceLoans.map((loan) => ({
      ...loan,
      provider: "SSS" as const,
      employee: loan.employeeId === null ? null : addedEmployeeById.get(loan.employeeId) ?? null,
    }));
    if (addedLoans.length !== addedLoanIds.length) {
      throw new Error("Some selected SSS loan accounts are no longer available. Refresh and try again.");
    }
    const addedLoanById = new Map(addedLoans.map((loan) => [loan.id, loan]));
    const totalOutstanding = snapshot.entries.reduce((total, entry) => {
      if ("id" in entry) {
        const currentEntry = reportEntryById.get(entry.id);
        if (!currentEntry) throw new Error("The report contains an entry that cannot be edited.");
        return total.add(currentEntry.outstandingBalance);
      }
      const loan = addedLoanById.get(entry.loanId);
      if (!loan) throw new Error("Some selected SSS loan accounts are no longer available.");
      return total.add(loan.outstandingBalance ?? new Prisma.Decimal(0));
    }, new Prisma.Decimal(0));

    await transaction.loanMonitorReport.update({
      where: { id },
      data: {
        applicableDate: snapshot.applicableDate,
        totalMonthly,
        totalOutstanding,
      },
    });

    for (const entry of snapshot.entries) {
      if ("id" in entry) {
        await transaction.loanMonitorReportEntry.update({
          where: { id: entry.id },
          data: { monthlyAmortization: new Prisma.Decimal(entry.monthlyAmortization) },
        });
      } else {
        const loan = addedLoanById.get(entry.loanId);
        if (!loan) throw new Error("Some selected SSS loan accounts are no longer available.");
        await transaction.loanMonitorReportEntry.create({
          data: {
            reportId: id,
            loanId: loan.id,
            provider: loan.provider,
            loanType: loan.loanType,
            loanAccountNumber: loan.loanAccountNumber,
            employeeName: loan.employee ? fullName(loan.employee) : "Detached employee",
            loanDate: loan.loanDate,
            terms: loan.terms,
            totalAmount: loan.totalAmount ?? 0,
            monthlyAmortization: new Prisma.Decimal(entry.monthlyAmortization),
            outstandingBalance: loan.outstandingBalance ?? 0,
            status: loan.status,
            statusReason: loan.statusReason,
            employerName:
              report.employerName?.trim() ||
              loan.employee?.employer?.name ||
              loan.employee?.employer?.company ||
              "",
            employerSssNumber: report.employerName?.trim()
              ? report.employerSssNumber
              : loan.employee?.employer?.sss ?? null,
            employerAddress: report.employerName?.trim()
              ? report.employerAddress
              : loan.employee?.employer?.longAddress?.trim() ||
                loan.employee?.employer?.shortAddress?.trim() ||
                null,
          },
        });
      }
    }
    const removedEntryIds = report.entries
      .map((entry) => entry.id)
      .filter((entryId) => !retainedEntryIds.includes(entryId));
    if (removedEntryIds.length > 0) {
      await transaction.loanMonitorReportEntry.deleteMany({
        where: { reportId: id, id: { in: removedEntryIds } },
      });
    }
  });

  revalidatePath("/loans");
  revalidatePath("/loans/reports");
  revalidatePath("/loans/posted-reports");
  return { ok: true };
}

function validateReportDate(applicableDate: string): Date {
  const trimmed = (applicableDate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Select an applicable date for the report.");
  }
  const parsedDate = new Date(`${trimmed}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== trimmed) {
    throw new Error("Select a valid applicable date for the report.");
  }
  return parsedDate;
}

export async function generateLoanReport(input: GenerateLoanReportInput): Promise<{ id: string }> {
  const session = await requireAdmin();
  const applicableDate = validateReportDate(input.applicableDate);
  const employerId = validateLoanReportEmployerId(input.employerId);

  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new Error("Select at least one loan to include in the report.");
  }
  const monthlyAmortizationByLoanId = new Map<string, Prisma.Decimal>();
  for (const entry of input.entries) {
    if (!entry || typeof entry.loanId !== "string" || !entry.loanId.trim()) {
      throw new Error("Each report entry must include a valid loan.");
    }
    if (monthlyAmortizationByLoanId.has(entry.loanId)) {
      throw new Error("A loan can only be included once in a report.");
    }
    monthlyAmortizationByLoanId.set(
      entry.loanId,
      new Prisma.Decimal(normalizeLoanReportMonthlyAmount(entry.monthlyAmortization)),
    );
  }
  const loanIds = Array.from(monthlyAmortizationByLoanId.keys());

  const [employer, allLoans] = await Promise.all([
    prisma.employer.findUnique({
      where: { id: employerId },
      select: {
        name: true,
        company: true,
        sss: true,
        longAddress: true,
        shortAddress: true,
      },
    }),
    getLoans(),
  ]);
  const requestedLoanIds = new Set(loanIds);
  const loans = allLoans.filter((loan) => requestedLoanIds.has(loan.id));
  if (!employer) throw new Error("The selected employer no longer exists. Refresh and try again.");
  const employerName = employer.name.trim() || employer.company?.trim() || "";
  if (!employerName) throw new Error("The selected employer does not have a name.");
  if (loans.length !== loanIds.length) {
    throw new Error("Some selected loans no longer exist. Refresh the page and try again.");
  }

  const monthStart = new Date(
    Date.UTC(applicableDate.getUTCFullYear(), applicableDate.getUTCMonth(), 1),
  );
  const nextMonthStart = new Date(
    Date.UTC(applicableDate.getUTCFullYear(), applicableDate.getUTCMonth() + 1, 1),
  );
  const [centralMonthReports, sssMonthReports] = await Promise.all([
    getCentralSssLoansPrisma().loanMonitorReport.findMany({
      where: { applicableDate: { gte: monthStart, lt: nextMonthStart } },
      select: {
        applicableDate: true,
        employerName: true,
        entries: { select: { employerName: true, provider: true } },
      },
    }),
    getSssLoansPrisma().loanMonitorReport.findMany({
      where: { applicableDate: { gte: monthStart, lt: nextMonthStart } },
      select: {
        applicableDate: true,
        employerName: true,
        entries: { select: { employerName: true, provider: true } },
      },
    }),
  ]);
  const existingMonthReports = [
    ...centralMonthReports.filter((report) =>
      !report.entries.some((entry) => entry.provider === "SSS")
      || report.entries.some((entry) => entry.provider !== "SSS"),
    ),
    ...sssMonthReports,
  ].map((report) => ({
    ...report,
    applicableDate: report.applicableDate.toISOString().slice(0, 10),
  }));
  for (const provider of new Set(loans.map((loan) => loan.provider))) {
    if (
      hasDuplicateLoanReportMonth(
        existingMonthReports,
        employerName,
        provider,
        applicableDate.toISOString().slice(0, 10),
      )
    ) {
      throw new Error(
        `A ${provider} report for ${employerName} already exists for this applicable month. Select another month.`,
      );
    }
  }

  const totalMonthly = new Prisma.Decimal(
    sumLoanReportMonthlyAmounts(
      Array.from(monthlyAmortizationByLoanId.values(), (amount) => amount.toFixed(2)),
    ),
  );
  const totalOutstanding = loans.reduce(
    (sum, loan) => (loan.outstandingBalance === "" ? sum : sum.add(loan.outstandingBalance)),
    new Prisma.Decimal(0),
  );

  const reportDatabase = loans.every((loan) => loan.provider === "SSS")
    ? getSssLoansPrisma()
    : getCentralSssLoansPrisma();
  const report = await reportDatabase.loanMonitorReport.create({
    data: {
      applicableDate,
      employerName,
      employerSssNumber: employer.sss,
      employerAddress: employer.longAddress?.trim() || employer.shortAddress?.trim() || null,
      totalMonthly,
      totalOutstanding,
      createdBy: session.id,
      entries: {
        create: loans.map((loan) => {
          const monthlyAmortization = monthlyAmortizationByLoanId.get(loan.id);
          if (!monthlyAmortization) {
            throw new Error("A selected loan is missing its report monthly amount.");
          }
          return {
            loanId: loan.id,
            provider: loan.provider,
            loanType: loan.loanType,
            loanAccountNumber: loan.loanAccountNumber,
            employeeName: loan.employeeName,
            loanDate: loan.loanDate ? new Date(`${loan.loanDate}T00:00:00Z`) : null,
            terms: loan.terms ? Number(loan.terms) : null,
            totalAmount: loan.totalAmount === "" ? new Prisma.Decimal(0) : new Prisma.Decimal(loan.totalAmount),
            monthlyAmortization,
            outstandingBalance: loan.outstandingBalance === "" ? new Prisma.Decimal(0) : new Prisma.Decimal(loan.outstandingBalance),
            status: loan.status,
            statusReason: loan.statusReason,
            employerName,
            employerSssNumber: employer.sss,
            employerAddress:
              employer.longAddress?.trim() ||
              employer.shortAddress?.trim() ||
              null,
          };
        }),
      },
    },
  });

  revalidatePath("/loans");
  return { id: report.id };
}

export async function deleteLoanReport(reportId: string): Promise<{ ok: true }> {
  await requireAdmin();
  try {
    const reportDatabase = await findLoanMonitorReportDatabase(reportId);
    if (!reportDatabase) throw new Error("Report not found. It may have already been deleted.");
    await reportDatabase.loanMonitorReport.delete({ where: { id: reportId } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") throw new Error("Report not found. It may have already been deleted.");
    throw error;
  }
  revalidatePath("/loans");
  revalidatePath("/loans/posted-reports");
  return { ok: true };
}
