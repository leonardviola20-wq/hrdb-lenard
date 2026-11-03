import type { PagibigLoanType } from "@/lib/pagibigLoanTypes";

export type LoanDetail = {
  applicationNo: string;
  loanTermDate: string;
  termYears: string;
  amount: string;
  status: string;
};

export type SavedLoanDetail = Omit<LoanDetail, "termYears"> & { termYears: number; termEndDate: string };

export type Account = {
  id: number;
  year: number;
  mp2AccountNumber: string | null;
  mp2Amount: string;
  employeeSavings: string;
  employerSavings: string;
  excludedFromReport: boolean;
  calamityLoanAmount: string;
  mplLoanAmount: string;
  emergencyLoanAmount: string;
  safeLoanAmount: string;
  loanDetails: Record<PagibigLoanType, SavedLoanDetail | null>;
};

export type Member = {
  id: number;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string | null;
  pagIbigNumber: string | null;
  pagIbigAccount: Account | null;
  employerId?: number | null;
};

export type ReportEntry = {
  employeeId: number;
  id: number;
  employeeName: string;
  employeeCode: string;
  midNumber: string | null;
  employeeSavings: string;
  employerSavings: string;
  mp2AccountNumber: string | null;
  mp2Amount: string;
  calamityLoanAmount: string;
  mplLoanAmount: string;
  emergencyLoanAmount: string;
  safeLoanAmount: string;
  totalAmount: string;
};

export type Report = {
  id: number;
  kind: string;
  manual: boolean;
  paymentTypeCode?: number;
  adjustments?: string | number | null;
  pin: string;
  employerId: number;
  employerName: string;
  employerPagibigNumber: string | null;
  employerAddress?: string | null;
  applicableMonth: number;
  applicableYear: number;
  employeeSavingsTotal: string;
  employerSavingsTotal: string;
  mp2Total: string;
  calamityLoanTotal: string;
  mplLoanTotal: string;
  emergencyLoanTotal: string;
  safeLoanTotal: string;
  amountDue: string;
  amountPaid: string | null;
  paymentType: string | null;
  payDate: string | null;
  transactionReference: string | null;
  entries: ReportEntry[];
};

export type AccountForm = {
  employeeId: string;
  year: string;
  midNumber: string;
  employeeSavings: string;
  employerSavings: string;
  excludedFromReport: boolean;
  mp2AccountNumber: string;
  mp2Amount: string;
  loanDetails: Record<PagibigLoanType, LoanDetail>;
};

export type PaymentForm = {
  amountPaid: string;
  paymentType: string;
  payDate: string;
  transactionReference: string;
  adjustments: string;
};

export type ReportDraft = {
  id: number;
  employerId: number | null;
  kind: string;
  pin: string;
  applicableMonth: number;
  applicableYear: number;
  updatedAt: string;
};

export type ReportEmployer = { id: number; name: string; pagibigNumber: string | null; address: string | null };
