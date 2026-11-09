import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";
import type { AccountForm, LoanDetail, Member } from '@/components/pagibig-reports/shared/types';

export const formatMoney = (value: number | string | null | undefined) => `₱${(Number(value) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatAmount = (value: number | string | null | undefined) => (Number(value) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatEmployeeName = (employee: Pick<Member, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};

export const emptyLoanDetail = (): LoanDetail => ({ applicationNo: "", loanTermDate: "", termYears: "1", amount: "0", status: "ACTIVE" });

export const emptyLoanDetails = (): Record<PagibigLoanType, LoanDetail> => Object.fromEntries(
  PAGIBIG_LOAN_TYPES.map((type) => [type, emptyLoanDetail()]),
) as Record<PagibigLoanType, LoanDetail>;

export const emptyAccountForm = (): AccountForm => ({
  employeeId: "",
  year: String(new Date().getFullYear()),
  midNumber: "",
  employeeSavings: "200",
  employerSavings: "200",
  excludedFromReport: false,
  mp2AccountNumber: "",
  mp2Amount: "0",
  loanDetails: emptyLoanDetails(),
});

export const loanLabels: Record<PagibigLoanType, string> = { CAL: "Calamity", MPL: "MPL", EMER: "Emergency", SAFE: "SAFE" };

export const memberAmountColumns = [
  { label: "EE", field: "employeeSavings", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "ER", field: "employerSavings", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "MP2", field: "mp2Amount", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "CAL", field: "calamityLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "MPL", field: "mplLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "EMER", field: "emergencyLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "SAFE", field: "safeLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
] as const;
