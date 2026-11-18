"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  GenerateLoanReportInput,
  HistoricalSssLoanReport,
  LoanReportRow,
  LoanRow,
} from "@/app/actions/loans";
import { deleteLoan, generateLoanReport } from "@/app/actions/loans";
import ProviderLoansDialogs from "@/components/loans/ProviderLoansDialogs";
import ProviderLoansWorkspace from "@/components/loans/ProviderLoansWorkspace";

type Provider = "SSS" | "PAGIBIG";

type Props = {
  provider: Provider;
  loans: LoanRow[];
  employees: { id: number; fullName: string }[];
  employers: { id: number; name: string }[];
  previousReports: LoanReportRow[];
  historicalSssReports?: HistoricalSssLoanReport[];
  initialEmployerId?: string;
};
/**
 * Dedicated provider loans page body (SSS or HDMF). Hosts the unified loan
 * table and the existing-loan edit dialog and inline report view — all
 * scoped to one provider.
 */
export default function ProviderLoansClient({
  provider,
  loans,
  employees,
  employers,
  previousReports,
  historicalSssReports = [],
  initialEmployerId,
}: Props) {
  const router = useRouter();
  const [addingLoan, setAddingLoan] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanRow | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<LoanRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [historicalReportsOpen, setHistoricalReportsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const dismissNotice = useCallback(() => setNotice(""), []);
  const providerLoans = loans.filter((loan) => loan.provider === provider);

  const openEdit = (loan: LoanRow) => setEditingLoan(loan);
  const closeDialog = () => {
    setEditingLoan(null);
  };

  const addSaved = () => {
    setAddingLoan(false);
    setNotice("Loan saved.");
    router.refresh();
  };
  const editSaved = () => {
    closeDialog();
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!deletingLoan) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteLoan(deletingLoan.id);
      setDeletingLoan(null);
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete the loan.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleGenerate = async (
    employerId: number,
    applicableDate: string,
    entries: GenerateLoanReportInput["entries"],
  ) => {
    await generateLoanReport({ employerId, applicableDate, entries });
    setReportOpen(false);
    setHistoricalReportsOpen(false);
    setNotice("Loan monitoring report saved.");
    router.refresh();
  };

  return (
    <main className={`${provider === "SSS" ? "flex min-h-0 flex-1 flex-col" : "min-h-0 flex-1"} w-full bg-gray-50 p-3 sm:p-5 lg:p-6`}>
      <div className={`${provider === "SSS" ? "flex min-h-0 flex-1 flex-col" : ""} w-full`}>
        <ProviderLoansWorkspace
          provider={provider}
          loans={providerLoans}
          employees={employees}
          employers={employers}
          initialEmployerId={initialEmployerId}
          previousReports={previousReports}
          historicalSssReports={historicalSssReports}
          reportOpen={reportOpen}
          historicalReportsOpen={historicalReportsOpen}
          notice={notice}
          onDismissNotice={dismissNotice}
          onOpenReports={() => {
            setHistoricalReportsOpen(false);
            setReportOpen(true);
          }}
          onOpenHistoricalReports={() => {
            setReportOpen(false);
            setHistoricalReportsOpen(true);
          }}
          onBackToLoanList={() => {
            setReportOpen(false);
            setHistoricalReportsOpen(false);
          }}
          onAddLoan={() => setAddingLoan(true)}
          onGenerate={handleGenerate}
          onEdit={openEdit}
          onDelete={setDeletingLoan}
          onRefresh={() => router.refresh()}
        />
      </div>

      <ProviderLoansDialogs
        provider={provider}
        employees={employees}
        addingLoan={addingLoan}
        editingLoan={editingLoan}
        deletingLoan={deletingLoan}
        deleteBusy={deleteBusy}
        deleteError={deleteError}
        onCloseAdd={() => setAddingLoan(false)}
        onAddSaved={addSaved}
        onCloseEdit={closeDialog}
        onEditSaved={editSaved}
        onCancelDelete={() => setDeletingLoan(null)}
        onConfirmDelete={() => void confirmDelete()}
      />
    </main>
  );
}
