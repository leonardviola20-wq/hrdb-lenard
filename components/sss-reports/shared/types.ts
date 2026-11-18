import type { SssLoanStatus } from "@/lib/sssLoanStatus";
import type { SssLoanType } from "@/lib/sssLoanTypes";

export type PaymentKind = "CONTRIBUTION" | "LOAN";
export type DraftSaveStatus = "idle" | "saving" | "saved";
export type Employee = { id: number; employeeCode: string; firstName: string; middleName: string | null; lastName: string; sssNumber: string | null; biometricNo?: string | null; status: string | null; employerId?: number | null; employerName?: string | null };
export type Employer = { id: number; name: string; shortAddress: string | null; longAddress: string | null; sss: string | null; employees: Employee[] };
export type SssLoan = { id: number; employerId: number; employerName: string; employeeId: number | null; employeeName: string; employeeCode: string; employeeSssNumber: string | null; employeeEmployerId: number | null; employeeEmployerName: string | null; employeeStatus?: string | null; biometricNo: string; loanAccountNumber: string; transactionNumber: string | null; loanType: SssLoanType; loanDate: string; loanAmount: string | null; monthlyAmortization: string; outstandingBalance: string | null; monthlyPayment: string; status: SssLoanStatus; statusReason: string | null; reportTiming?: "DUE" | "OVERDUE" };
export type ActiveLoanReport = { employerName: string; loans: SssLoan[] };
export type DraftEntry = { employeeId: number; employeeCode: string; employeeName: string; employeeSssNumber: string | null; employeeEmployerId?: number | null; employeeEmployerName?: string | null; sssLoanId?: number | null; loanAccountNumber?: string | null; monthlySalaryCredit: number | null; loanAmount: string };
export type SssReportDraft = { id: number; kind: PaymentKind; employerId: number | null; prn: string; applicableMonth: number; applicableYear: number; amountDue: string; entries: DraftEntry[]; updatedAt: string };
export type SavedEntry = DraftEntry & { id: number; salaryRange: string | null; employeeSs: string; employerSs: string; employeeMpf: string; employerMpf: string; ec: string; loanAmount: string; totalAmount: string };
export type Report = {
  id: number; kind: PaymentKind; employerId: number; employerName: string; employerAddress: string | null; employerSssNumber: string | null;
  prn: string; applicableMonth: number; applicableYear: number; amountDue: string; amountPaid: string | null; paymentType: string | null;
  payDate: string | null; sssBranch: string | null; transactionReference: string | null; createdAt: string;
  createdBy: number | null; creator: { name: string | null; email: string } | null; entries: SavedEntry[];
};
export type LoanFormState = { employerId: string; employeeId: string; loanAccountNumber: string; transactionNumber: string; loanType: SssLoanType; loanDate: string; loanAmount: string; monthlyAmortization: string };
export type LoanEditStatusState = { status: SssLoanStatus; reason: string };
export type PaymentFormState = { amountPaid: string; paymentType: string; payDate: string; sssBranch: string; transactionReference: string };
export type DraftFormState = { employerId: string; prn: string; month: string; year: string; amountDue: string };
