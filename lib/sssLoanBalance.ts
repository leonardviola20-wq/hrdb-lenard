import { isActiveEmployeeStatus } from "@/lib/employeeStatus";
import type { SssLoanType } from "@/lib/sssLoanTypes";

export type SssLoanReportTiming = "DUE" | "OVERDUE";
export type SssLoanReportCategory = "ACTIVE" | "UPCOMING" | "INACTIVE";

export function isSssLoanEligibleForStartDateThroughMonthReport(loan: {
  status: string;
  employeeId: number | null;
  employeeStatus: string | null;
  loanDate: Date;
  loanType: SssLoanType;
}, applicableDate: Date) {
  if (loan.status !== "ACTIVE"
    || loan.employeeId === null
    || !isActiveEmployeeStatus(loan.employeeStatus)) return false;
  const startDate = getSssLoanStartDate(loan.loanDate, loan.loanType);
  const startMonth = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
  const applicableMonth = applicableDate.getUTCFullYear() * 12 + applicableDate.getUTCMonth();
  return startMonth <= applicableMonth;
}

export function getSssLoanReportCategory(loan: {
  status: string;
  employeeId: number | null;
  employeeStatus: string | null;
  loanDate: Date;
  loanType: SssLoanType;
}, applicableDate: Date): SssLoanReportCategory | null {
  if (loan.status !== "ACTIVE") return "INACTIVE";
  if (loan.employeeId === null || !isActiveEmployeeStatus(loan.employeeStatus)) return null;
  const startDate = getSssLoanStartDate(loan.loanDate, loan.loanType);
  const startMonth = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
  const applicableMonth = applicableDate.getUTCFullYear() * 12 + applicableDate.getUTCMonth();
  return startMonth > applicableMonth ? "UPCOMING" : "ACTIVE";
}

export function getSssLoanReportTiming(
  loan: { status: string; employeeStatus: string | null; loanDate: Date; loanType: SssLoanType },
  applicableDate: Date,
): SssLoanReportTiming | null {
  if (loan.status !== "ACTIVE" || !isActiveEmployeeStatus(loan.employeeStatus)) return null;
  const firstPaymentDate = getSssLoanFirstAmortizationDate(loan.loanDate, loan.loanType);
  const firstPaymentMonth = firstPaymentDate.getUTCFullYear() * 12 + firstPaymentDate.getUTCMonth();
  const applicableMonth = applicableDate.getUTCFullYear() * 12 + applicableDate.getUTCMonth();
  if (applicableMonth < firstPaymentMonth) return null;
  return applicableMonth === firstPaymentMonth ? "DUE" : "OVERDUE";
}

export function parseSssLoanDateOnly(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function parseSssLoanDateFromApi(value: unknown) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.exec(value);
  return match ? parseSssLoanDateOnly(match[1]) : null;
}

export function calculateSssLoanOutstandingBalanceCents(
  loanAmountCents: number | null,
  actualPaymentsCents = 0,
) {
  if (loanAmountCents === null) return null;
  return Math.max(0, loanAmountCents - Math.max(0, actualPaymentsCents));
}

export function calculateSssLoanPaymentAmountCents(
  monthlyAmortizationCents: number,
  loanDate: Date,
  applicableDate: Date,
  loanType: SssLoanType = "S",
) {
  const loanMonth = loanDate.getUTCFullYear() * 12 + loanDate.getUTCMonth();
  const applicableMonth = applicableDate.getUTCFullYear() * 12 + applicableDate.getUTCMonth();
  const firstPaymentOffsetMonths = loanType === "R" ? 7 : 2;
  if (applicableMonth < loanMonth + firstPaymentOffsetMonths) return 0;
  return monthlyAmortizationCents;
}

export function getSssLoanFirstAmortizationDate(loanDate: Date, loanType: SssLoanType = "S") {
  const firstPaymentOffsetMonths = loanType === "R" ? 7 : 2;
  return new Date(Date.UTC(loanDate.getUTCFullYear(), loanDate.getUTCMonth() + firstPaymentOffsetMonths, 1));
}

export function getSssLoanStartDate(loanDate: Date, loanType: SssLoanType = "S") {
  const monthOffset = loanType === "R" ? 7 : 2;
  const targetMonth = loanDate.getUTCMonth() + monthOffset;
  const targetYear = loanDate.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;
  const day = Math.min(
    loanDate.getUTCDate(),
    new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate(),
  );
  return new Date(Date.UTC(targetYear, normalizedMonth, day));
}
