import { parseSssLoanDateFromApi, getSssLoanStartDate } from "@/lib/sssLoanBalance";
import type { Employee, SssLoan } from "./types";

export const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];
export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const employeeName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};

export const reportEmployerLabel = (_entries: { employeeEmployerName?: string | null }[], selectedEmployer: string) => selectedEmployer;

export const notifySssRecordsUpdated = () => window.dispatchEvent(new Event("hrdb-sss-records-updated"));

export const loanFirstPaymentStart = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const loanDate = parseSssLoanDateFromApi(loan.loanDate);
  return loanDate ? getSssLoanStartDate(loanDate, loan.loanType) : null;
};

export const formatLoanStartDate = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const startDate = loanFirstPaymentStart(loan);
  return startDate ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(startDate) : "—";
};

export const loanStartDateClass = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const startDate = loanFirstPaymentStart(loan);
  if (!startDate) return "bg-slate-100 text-slate-600";
  const currentMonth = new Date();
  const isUrgent = startDate.getUTCFullYear() < currentMonth.getFullYear()
    || (startDate.getUTCFullYear() === currentMonth.getFullYear() && startDate.getUTCMonth() <= currentMonth.getMonth());
  return isUrgent ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800";
};

export const loanReportEntryAmount = (loan: SssLoan) => {
  const scheduledPayment = Number(loan.monthlyPayment);
  return (scheduledPayment > 0 ? scheduledPayment : Number(loan.monthlyAmortization)).toFixed(2);
};
import { monthEnd, localDateInputValue, dateOnly, creatorLabel, formatReportCreatedAt, formatLoanDateMdy, formatAmountDue } from "@/lib/sssReportHelpers";

export { monthEnd, localDateInputValue, dateOnly, creatorLabel, formatReportCreatedAt, formatLoanDateMdy, formatAmountDue };
import { formatMoney } from "./constants";

export { formatMoney };
