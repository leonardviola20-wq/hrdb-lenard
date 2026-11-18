"use client";

import type { GenerateLoanReportInput, HistoricalSssLoanReport, LoanReportRow, LoanRow } from "@/app/actions/loans";
import ProviderLoansHeader from "@/components/loans/ProviderLoansHeader";
import HistoricalSssLoanReports from "@/components/loans/HistoricalSssLoanReports";
import LoanReportPanel from "@/components/loans/LoanReportPanel";
import LoanTable from "@/components/loans/LoanTable";
import LoanToast from "@/components/loans/LoanToast";
import ProviderLoansToolbar from "@/components/loans/ProviderLoansToolbar";

export default function ProviderLoansWorkspace({
  provider,
  loans,
  employees,
  employers,
  initialEmployerId,
  previousReports,
  historicalSssReports,
  reportOpen,
  historicalReportsOpen,
  notice,
  onDismissNotice,
  onOpenReports,
  onOpenHistoricalReports,
  onBackToLoanList,
  onAddLoan,
  onGenerate,
  onEdit,
  onDelete,
  onRefresh,
}: {
  provider: "SSS" | "PAGIBIG";
  loans: LoanRow[];
  employees: { id: number; fullName: string }[];
  employers: { id: number; name: string }[];
  initialEmployerId?: string;
  previousReports: LoanReportRow[];
  historicalSssReports: HistoricalSssLoanReport[];
  reportOpen: boolean;
  historicalReportsOpen: boolean;
  notice: string;
  onDismissNotice: () => void;
  onOpenReports: () => void;
  onOpenHistoricalReports: () => void;
  onBackToLoanList: () => void;
  onAddLoan: () => void;
  onGenerate: (
    employerId: number,
    applicableDate: string,
    entries: GenerateLoanReportInput["entries"],
  ) => Promise<void>;
  onEdit: (loan: LoanRow) => void;
  onDelete: (loan: LoanRow) => void;
  onRefresh: () => void;
}) {
  const reportViewOpen = reportOpen || historicalReportsOpen;
  const initialEmployerName = employers.find((employer) => String(employer.id) === initialEmployerId)?.name ?? "";

  return (
    <>
      <ProviderLoansHeader
        provider={provider}
        employeeCount={employees.length}
        loanCount={loans.length}
        reportOpen={reportViewOpen}
        historicalReportsCount={provider === "SSS" ? historicalSssReports.length : undefined}
        onAddLoan={onAddLoan}
        onOpenReports={onOpenReports}
        onOpenHistoricalReports={onOpenHistoricalReports}
        onBackToLoanList={onBackToLoanList}
      />
      {notice && <LoanToast message={notice} onDismiss={onDismissNotice} />}
      {employees.length === 0 && (
        <p role="status" className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          No active employees found. Add employees to the directory first.
        </p>
      )}
      <LoanTable
        provider={provider}
        loans={loans}
        employees={employees}
        employers={employers}
        initialEmployerFilter={initialEmployerName}
        hideToolbar={reportViewOpen}
        toolbarActions={provider === "SSS" ? undefined : (
          <ProviderLoansToolbar
            addDisabled={employees.length === 0}
            reportsDisabled={loans.length === 0}
            onAddLoan={onAddLoan}
            onOpenReports={onOpenReports}
          />
        )}
        belowToolbarContent={reportOpen ? (
          <LoanReportPanel
            provider={provider}
            loans={loans}
            employers={employers}
            initialEmployerId={initialEmployerId}
            previousReports={previousReports}
            onClose={onBackToLoanList}
            onGenerate={onGenerate}
            hideFooterBackButton={provider === "SSS"}
            className={provider === "SSS" ? "min-h-0 flex-1" : "lg:min-h-[calc(100dvh-264px)]"}
          />
        ) : historicalReportsOpen ? (
          <HistoricalSssLoanReports reports={historicalSssReports} initialEmployerFilter={initialEmployerName} />
        ) : undefined}
        onEdit={onEdit}
        onDelete={onDelete}
        onRefresh={onRefresh}
      />
    </>
  );
}
