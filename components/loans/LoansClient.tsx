"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EmployerProviderLauncher from "@/components/EmployerProviderLauncher";
import type {
  GenerateLoanReportInput,
  HistoricalSssLoanReport,
  LoanEmployee,
  LoanReportRow,
  LoanRow,
} from "@/app/actions/loans";
import { deleteLoan, generateLoanReport } from "@/app/actions/loans";
import LoanDialog from "@/components/loans/LoanDialog";
import LoanProviderCard from "@/components/loans/LoanProviderCard";
import LoanProviderTabs, { LOAN_PROVIDERS } from "@/components/loans/LoanProviderTabs";
import LoanToast from "@/components/loans/LoanToast";
import useRefreshOnRestore from "@/components/loans/useRefreshOnRestore";

type Props = {
  loans: LoanRow[];
  employees: LoanEmployee[];
  employers: { id: number; name: string }[];
  reports: LoanReportRow[];
  postedReports: LoanReportRow[];
  historicalSssPayments: HistoricalSssLoanReport[];
};

export default function LoansClient({
  loans,
  employees,
  employers,
  reports,
  postedReports,
  historicalSssPayments,
}: Props) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState<LoanRow["provider"]>("SSS");
  const [addingProvider, setAddingProvider] = useState<LoanRow["provider"] | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<LoanRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const dismissNotice = useCallback(() => setNotice(""), []);
  useRefreshOnRestore();

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
    setNotice("Loan monitoring report saved.");
    router.refresh();
  };

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <PageHeader title="Loans Monitoring" subtitle="Track employee government loans and monthly amortizations." />

        <EmployerProviderLauncher
          employers={employers}
          providers={[
            { label: "SSS", href: "/loans/sss" },
            { label: "Pag-IBIG", href: "/loans/hdmf" },
          ]}
        />

        <LoanProviderTabs activeProvider={activeProvider} onChange={setActiveProvider} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {LOAN_PROVIDERS.map((provider) => {
            const selected = activeProvider === provider;
            return (
              <div
                key={provider}
                id={`loans-${provider.toLowerCase()}-panel`}
                role="tabpanel"
                aria-labelledby={`loans-${provider.toLowerCase()}-tab`}
                hidden={!selected}
                className={selected ? "flex min-h-0 min-w-0 flex-1 flex-col" : "hidden"}
              >
                <LoanProviderCard
                  provider={provider}
                  loans={loans}
                  employees={employees}
                  employers={employers}
                  addDisabled={employees.length === 0}
                  reports={reports}
                  postedReports={postedReports}
                  historicalSssPayments={provider === "SSS" ? historicalSssPayments : []}
                  buttonHref={provider === "SSS" ? "/loans/sss" : "/loans/hdmf"}
                  onGenerateReport={(_provider, employerId, applicableDate, entries) =>
                    handleGenerate(employerId, applicableDate, entries)}
                  onAddLoan={setAddingProvider}
                />
              </div>
            );
          })}
        </div>

        {notice && <LoanToast message={notice} onDismiss={dismissNotice} />}

        {addingProvider && (
          <LoanDialog
            employees={employees}
            provider={addingProvider}
            onClose={() => setAddingProvider(null)}
            onSaved={() => {
              setAddingProvider(null);
              setNotice("Loan saved.");
              router.refresh();
            }}
          />
        )}

        {deletingLoan && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deleteBusy) setDeletingLoan(null);
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <h2 className="text-lg font-bold text-slate-900">Delete Loan</h2>
              <p className="mt-2 text-sm text-slate-600">
                Delete the {deletingLoan.provider === "PAGIBIG" ? "Pag-IBIG" : "SSS"} {deletingLoan.loanType} loan
                (‘{deletingLoan.loanAccountNumber}’) for <span className="font-semibold">{deletingLoan.employeeName}</span>?
                Recorded payments on this loan are removed as well. This cannot be undone.
              </p>
              {deleteError && (
                <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{deleteError}</p>
              )}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingLoan(null)}
                  disabled={deleteBusy}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteBusy}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleteBusy ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
