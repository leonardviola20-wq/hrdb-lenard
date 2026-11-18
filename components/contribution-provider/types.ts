export type ContributionProvider = "sss" | "pagibig" | "philhealth";

export type Employer = { id: number; name: string };
export type ContributionEmployerDetails = {
  id: number;
  name: string;
  providerNumber?: string | null;
  address?: string | null;
};

export type ContributionEntry = {
  id: number;
  employeeName: string;
  employeeCode?: string;
  employeeSssNumber?: string | null;
  midNumber?: string | null;
  employeePhilHealthNumber?: string | null;
  totalAmount?: string;
  employeeSavings?: string;
  employerSavings?: string;
  mp2Amount?: string;
  employeeSs?: string;
  employerSs?: string;
  employeeMpf?: string;
  employerMpf?: string;
  ec?: string;
  amount?: string;
};

export type ContributionReport = {
  id: number;
  employerName: string;
  employerAddress?: string | null;
  employerSssNumber?: string | null;
  sssBranch?: string | null;
  prn?: string | null;
  kind?: string;
  applicableMonth: number;
  applicableYear: number;
  amountDue: string;
  amountPaid?: string | null;
  payDate?: string | null;
  paymentType?: string | null;
  transactionReference?: string | null;
  pin?: string | null;
  payment?: {
    amountPaid: string;
    transactionDate: string;
    payorName: string;
    spa?: string | null;
    applicablePeriod?: string;
    accreditedCollectingAgent?: string | null;
    transactionConfirmationNumber?: string | null;
    eparNumber?: string | null;
    eparDate?: string | null;
  } | null;
  entries: ContributionEntry[];
};
