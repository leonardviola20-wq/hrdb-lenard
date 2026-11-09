export type Employee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  biometricNo?: string | null;
  status: string | null;
  philHealth: string | null;
  employerName: string | null;
  assignedToSelectedEmployer?: boolean;
  philHealthAccount?: { id: number; active: boolean } | null;
};

export type Payment = {
  id: number;
  payorName: string;
  pen: string;
  spa: string | null;
  applicablePeriod: string;
  amountPaid: string;
  accreditedCollectingAgent: string | null;
  transactionConfirmationNumber: string | null;
  transactionDate: string;
  eparNumber: string | null;
  eparDate: string | null;
};

export type ReportEntry = {
  id: number;
  employeeId: number | null;
  employeeName: string;
  employeeCode: string;
  employeePhilHealthNumber: string | null;
  amount: string;
};

export type Report = {
  id: number;
  employerName: string;
  employerPhicNumber: string | null;
  applicableMonth: number;
  applicableYear: number;
  amountDue: string;
  entries: ReportEntry[];
  payment: Payment | null;
};

export type Employer = { id: number; name: string; phic: string | null };

export type PaymentForm = {
  payorName: string;
  pen: string;
  spa: string;
  applicablePeriod: string;
  amountPaid: string;
  accreditedCollectingAgent: string;
  transactionConfirmationNumber: string;
  transactionDate: string;
  eparNumber: string;
  eparDate: string;
  adjustments: string;
};
