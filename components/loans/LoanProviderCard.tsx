"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DocumentChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import type {
  GenerateLoanReportInput,
  HistoricalSssLoanReport,
  LoanEmployee,
  LoanReportRow,
  LoanRow,
} from "@/app/actions/loans";
import ScrollableListTable from "@/components/ScrollableListTable";
import { peso } from "@/components/loans/shared/format";
import LoanReportPanel from "@/components/loans/LoanReportPanel";
import LoanReportsSection from "@/components/loans/LoanReportsSection";
import {
  filterLoanReportsByProvider,
  getLoanReportEmployerNames,
} from "@/lib/loanReportDisplay";

function historicalSssPaymentAsReport(report: HistoricalSssLoanReport): LoanReportRow {
  const applicableDate = `${report.applicableYear}-${String(report.applicableMonth).padStart(2, "0")}-01`;

  return {
    id: `historical-sss-${report.sourceSystem}-${report.sourceReportId}`,
    historicalSssReport: report,
    applicableDate,
    employerName: report.employerName,
    employerSssNumber: report.employerSssNumber,
    employerAddress: report.employerAddress,
    loanCount: report.entries.length,
    totalMonthly: report.amountDue,
    totalOutstanding: "",
    prn: report.prn,
    paymentDate: report.payDate,
    amountPaid: report.amountPaid,
    paymentBranch: report.sssBranch,
    transactionReference: report.transactionReference,
    createdAt: report.createdAt,
    createdBy: null,
    entries: report.entries.map((entry) => ({
      id: `historical-sss-entry-${report.sourceSystem}-${entry.id}`,
      loanId: `historical-sss-loan-${entry.id}`,
      provider: "SSS",
      loanType: "Historical",
      loanAccountNumber: entry.loanAccountNumber ?? "",
      employeeName: entry.employeeName,
      loanDate: null,
      terms: "",
      totalAmount: entry.loanAmountDue,
      monthlyAmortization: entry.loanAmountDue,
      outstandingBalance: "",
      status: "HISTORICAL",
      statusReason: "Historical record; no current balance is inferred.",
      employerName: report.employerName,
      employerSssNumber: report.employerSssNumber,
      employerAddress: report.employerAddress,
    })),
  };
}

type Props = {
  provider: "SSS" | "PAGIBIG";
  loans: LoanRow[];
  employees: LoanEmployee[];
  employers: { id: number; name: string }[];
  buttonHref: string;
  addDisabled?: boolean;
  /** Enables a dashboard toggle to show saved SSS and Pag-IBIG reports. */
  reports?: LoanReportRow[];
  postedReports?: LoanReportRow[];
  historicalSssPayments?: HistoricalSssLoanReport[];
  onGenerateReport?: (
    provider: "SSS" | "PAGIBIG" | "ALL",
    employerId: number,
    applicableDate: string,
    entries: GenerateLoanReportInput["entries"],
  ) => Promise<void>;
  onAddLoan: (provider: "SSS" | "PAGIBIG") => void;
};

const cardTheme = {
  SSS: {
    badge: "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
    button: "border-blue-200 hover:border-blue-500 hover:bg-blue-50 focus:ring-blue-500",
    monthly: "text-blue-700",
    generate: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  },
  PAGIBIG: {
    badge: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
    button: "border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500",
    monthly: "text-emerald-700",
    generate: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
  },
} as const;

const filterInputClass =
  "h-9 w-48 max-w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const sssLoanTypeAbbreviations: Record<string, string> = {
  Salary: "S",
  Calamity: "C",
  Emergency: "E",
};

export default function LoanProviderCard({
  provider, loans, employees, employers, buttonHref, addDisabled = false, reports, postedReports = [], historicalSssPayments = [], onGenerateReport, onAddLoan,
}: Props) {
  const [employerFilter, setEmployerFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [reportEmployerFilter, setReportEmployerFilter] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportView, setReportView] = useState<"loans" | "generated" | "posted">("loans");

  const theme = cardTheme[provider];
  const label = provider === "SSS" ? "SSS" : "HDMF";
  const fullName = "Employee Loans";

  const years = useMemo(
    () =>
      Array.from(
        new Set(loans.filter((loan) => loan.loanDate).map((loan) => loan.loanDate!.slice(0, 4))),
      ).sort((a, b) => Number(b) - Number(a)),
    [loans],
  );

  const providerLoans = useMemo(
    () => loans.filter((loan) => loan.provider === provider),
    [loans, provider],
  );
  const filtered = useMemo(
    () =>
      providerLoans
        .filter((loan) => {
          if (employerFilter && loan.employerName !== employerFilter) return false;
          if (yearFilter && (loan.loanDate ?? "").slice(0, 4) !== yearFilter) return false;
          return true;
        })
        .sort((left, right) =>
          left.employeeName.localeCompare(right.employeeName, "en", { sensitivity: "base" }),
        ),
    [employerFilter, providerLoans, yearFilter],
  );
  const totalMonthly = filtered.reduce((total, loan) => total + Number(loan.monthlyAmortization || 0), 0);

  const employerOptions = useMemo(() => {
    const names = new Set(providerLoans.map((loan) => loan.employerName).filter(Boolean));
    return employers.filter((employer) => names.has(employer.name));
  }, [employers, providerLoans]);

  const historicalRows = useMemo(
    () => historicalSssPayments.map(historicalSssPaymentAsReport),
    [historicalSssPayments],
  );
  const allReports = useMemo(
    () => [...(reports ?? []), ...postedReports, ...(provider === "SSS" ? historicalRows : [])],
    [historicalRows, postedReports, provider, reports],
  );
  const providerReports = useMemo(
    () => filterLoanReportsByProvider(allReports, provider),
    [allReports, provider],
  );
  const availableReports = filterLoanReportsByProvider(
    [
      ...(reportView === "posted" ? postedReports : reports ?? []),
      ...(reportView === "posted" && provider === "SSS" ? historicalRows : []),
    ],
    provider,
  );
  const reportEmployerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          providerReports.flatMap((report) =>
            getLoanReportEmployerNames(report.entries, report.employerName),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [providerReports],
  );
  const reportYearOptions = useMemo(
    () => Array.from(new Set(providerReports.map((report) => report.applicableDate.slice(0, 4)))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [providerReports],
  );
  const filteredReports = availableReports.filter((report) => {
    if (reportEmployerFilter && !getLoanReportEmployerNames(report.entries, report.employerName).includes(reportEmployerFilter)) {
      return false;
    }
    if (reportYearFilter && report.applicableDate.slice(0, 4) !== reportYearFilter) return false;
    return true;
  });

  const buttonInner = (
    <>
      {reports !== undefined ? (
        <>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition sm:h-8 sm:w-8 sm:text-xs ${theme.badge}`}>
            {label}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">{fullName}</span>
            <span className="hidden text-xs font-medium text-slate-600 sm:block">
              {providerLoans.length} loan{providerLoans.length === 1 ? "" : "s"} recorded
            </span>
          </span>
        </>
      ) : (
        <>
          <span className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold transition ${theme.badge}`}>
            {label}
          </span>
          <span className="text-base font-bold text-slate-900">{fullName}</span>
          <span className="text-xs font-medium text-slate-600">
            {providerLoans.length} loan{providerLoans.length === 1 ? "" : "s"} recorded
          </span>
        </>
      )}
    </>
  );

  const buttonClass = reports !== undefined
    ? `group col-span-2 flex w-full max-w-full items-center gap-2 rounded-xl border bg-white px-2 py-1 text-left transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-span-1 sm:w-48 sm:px-2.5 sm:py-1.5 ${theme.button}`
    : `group flex flex-col items-center gap-3 rounded-2xl border-2 bg-white p-6 text-center transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.button}`;

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:gap-4 sm:p-4">
      {/* Left: provider link, filters, and report actions */}
      <div className={`w-full shrink-0 gap-2 sm:w-48 sm:gap-3 ${reports !== undefined ? "grid grid-cols-2 sm:flex sm:flex-col" : "flex flex-col"}`}>
        <Link href={buttonHref} className={buttonClass}>
          {buttonInner}
        </Link>

        {reportView !== "loans" && reports !== undefined ? (
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:grid-cols-1 sm:gap-3">
            <select
              aria-label="Filter loan reports by employer"
              value={reportEmployerFilter}
              onChange={(event) => setReportEmployerFilter(event.target.value)}
              className={filterInputClass}
            >
              <option value="">All Employers</option>
              {reportEmployerOptions.map((employer) => (
                <option key={employer} value={employer}>{employer}</option>
              ))}
            </select>
            <select
              aria-label="Filter loan reports by year"
              value={reportYearFilter}
              onChange={(event) => setReportYearFilter(event.target.value)}
              className={filterInputClass}
            >
              <option value="">All Years</option>
              {reportYearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3 ${reports !== undefined ? "col-span-2 sm:col-span-1" : ""}`}>
            <select
              aria-label={`Filter ${fullName} loans by employer`}
              value={employerFilter}
              onChange={(event) => setEmployerFilter(event.target.value)}
              className={filterInputClass}
            >
              <option value="">All Employers</option>
              {employerOptions.map((employer) => (
                <option key={employer.id} value={employer.name}>{employer.name}</option>
              ))}
            </select>
            <select
              aria-label={`Filter ${fullName} loans by year`}
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className={filterInputClass}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {reports !== undefined ? (
          <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1 sm:grid-cols-1">
            {([
              ["loans", "Employee Loans List"],
              ["generated", "Generated Reports"],
              ["posted", "Posted Reports"],
            ] as const).map(([view, title]) => (
              <button
                key={view}
                type="button"
                aria-label={title}
                title={title}
                aria-pressed={reportView === view}
                onClick={() => {
                  setReportView(view);
                  setReportOpen(false);
                }}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-1.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 sm:px-2.5 sm:py-1.5 sm:text-sm ${
                  reportView === view
                    ? `${theme.generate} border-transparent text-white`
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500"
                }`}
              >
                {view !== "loans" && <DocumentChartBarIcon aria-hidden="true" className="h-4 w-4" />}
                <span className="sm:hidden">{view === "loans" ? "Loans" : view === "generated" ? "Generated" : "Posted"}</span>
                <span className="hidden sm:inline">{title}</span>
              </button>
            ))}
          </div>
        ) : onGenerateReport && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            disabled={providerLoans.length === 0}
            className={`inline-flex w-48 max-w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${theme.generate}`}
          >
            <DocumentChartBarIcon className="h-4 w-4" />
            Generate Report
          </button>
        )}
      </div>

      {reportOpen && onGenerateReport ? (
        <LoanReportPanel
          loans={reportView !== "loans" ? loans : providerLoans}
          employers={employers}
          previousReports={[...(reports ?? []), ...postedReports]}
          onClose={() => setReportOpen(false)}
          onGenerate={async (employerId, applicableDate, entries) => {
            await onGenerateReport(reportView !== "loans" ? "ALL" : provider, employerId, applicableDate, entries);
            setReportOpen(false);
          }}
          fillAvailableHeight
          className="min-h-0 min-w-0 flex-1"
        />
      ) : reportView !== "loans" && reports !== undefined ? (
        <div className="flex min-h-0 min-w-0 flex-[1] flex-col gap-3">
          <LoanReportsSection
            reports={filteredReports}
            employees={employees}
            showEmployer
            summaryProvider={provider}
            hideOutstanding
            hideOutstandingSummary={reportView === "posted"}
            largePrn={reportView === "posted"}
            title={reportView === "posted" ? "Posted Reports" : "Generated Reports"}
            description={
              reportView === "posted"
                ? "Reports with saved PRN and payment date."
                : `Saved snapshots of ${provider === "SSS" ? "SSS" : "Pag-IBIG"} loans.`
            }
            emptyMessage={
              availableReports.length > 0
                ? "No reports match the selected employer and year filters."
                : reportView === "posted"
                  ? "No posted reports yet."
                  : "No generated reports."
            }
            emptyDescription={availableReports.length > 0 ? "" : undefined}
            onCreateReport={
              reportView === "generated" && provider === "SSS" && onGenerateReport
                ? () => setReportOpen(true)
                : undefined
            }
            hideHeaderWhenPopulated
            className={availableReports.length > 0
              ? "min-h-0 min-w-0 flex-[1] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              : "min-h-0 min-w-0 flex-[1] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4"}
          />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onAddLoan(provider)}
                disabled={addDisabled}
                aria-label={`Add ${provider === "SSS" ? "SSS" : "Pag-IBIG"} loan`}
                title={`Add ${provider === "SSS" ? "SSS" : "Pag-IBIG"} loan`}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon aria-hidden="true" className="h-4 w-4" />
              </button>
              <h2 className="truncate text-sm font-bold text-slate-900">{fullName} List</h2>
            </div>
            <span className="text-xs font-medium text-slate-700">
              Showing {filtered.length} of {providerLoans.length}
            </span>
          </div>
          {filtered.length === 0 ? (
            <p className="min-h-0 flex-1 overflow-y-auto px-4 py-10 text-center text-sm text-slate-700">
                {providerLoans.length === 0
                  ? `No ${provider === "SSS" ? "SSS" : "Pag-IBIG"} loans recorded yet.`
                  : "No loans match the selected filters."}
            </p>
          ) : (
            <>
              <ScrollableListTable
                ariaLabel={`${provider} loan list`}
                className="min-h-0 flex-1 sm:hidden"
                contentClassName="w-full text-sm"
                header={
                  <div role="row" className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-800">
                    <div role="columnheader" className="px-4 py-3">Employee Name</div>
                    <div role="columnheader" className="px-4 py-3 text-right">Due</div>
                  </div>
                }
                rowsClassName="divide-y divide-slate-200"
              >
                {filtered.map((loan) => (
                  <div key={loan.id} role="row" className="grid grid-cols-[minmax(0,1fr)_auto] text-slate-900">
                    <div role="cell" className="truncate px-4 py-3 font-semibold">{loan.employeeName}</div>
                    <div role="cell" className={`whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums ${theme.monthly}`}>
                      {loan.monthlyAmortization === "" ? "—" : peso(loan.monthlyAmortization)}
                    </div>
                  </div>
                ))}
              </ScrollableListTable>
              {provider === "SSS" ? (
                <ScrollableListTable
                  ariaLabel="SSS loan list"
                  className="hidden min-h-0 flex-1 sm:flex"
                  contentClassName="min-w-[960px] text-left text-sm"
                  header={
                    <div role="row" className="grid grid-cols-[2fr_1fr_1.4fr_1.3fr_1fr_1fr] border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-800">
                      <div role="columnheader" className="px-4 py-3">Employee</div>
                      <div role="columnheader" className="px-4 py-3">Type</div>
                      <div role="columnheader" className="px-4 py-3">Loan Account Number</div>
                      <div role="columnheader" className="px-4 py-3">Employer</div>
                      <div role="columnheader" className="px-4 py-3">Loan Date</div>
                      <div role="columnheader" className="px-4 py-3 text-right">Monthly</div>
                    </div>
                  }
                  rowsClassName="divide-y divide-slate-200"
                >
                  {filtered.map((loan) => (
                    <div key={loan.id} role="row" className="grid grid-cols-[2fr_1fr_1.4fr_1.3fr_1fr_1fr] text-slate-900">
                      <div role="cell" className="min-w-0 px-4 py-3">
                        <p className="truncate font-semibold text-slate-900">{loan.employeeName}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-800">{loan.employeeSssNumber || "—"}</p>
                      </div>
                      <div role="cell" className="px-4 py-3">{sssLoanTypeAbbreviations[loan.loanType] ?? loan.loanType}</div>
                      <div role="cell" className="break-all px-4 py-3 font-mono text-xs">{loan.loanAccountNumber}</div>
                      <div role="cell" className="px-4 py-3">{loan.employerName || "—"}</div>
                      <div role="cell" className="whitespace-nowrap px-4 py-3">{loan.loanDate ?? "—"}</div>
                      <div role="cell" className={`whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums ${theme.monthly}`}>
                        {loan.monthlyAmortization === "" ? "—" : peso(loan.monthlyAmortization)}
                      </div>
                    </div>
                  ))}
                </ScrollableListTable>
              ) : (
                <ul className="hidden min-h-0 flex-1 divide-y divide-slate-200 overflow-y-auto overscroll-contain sm:block">
                  {filtered.map((loan) => (
                    <li key={loan.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{loan.employeeName}</p>
                        <p className="font-mono text-xs text-slate-800">{loan.employeeSssNumber || "—"}</p>
                        <p className="text-xs text-slate-800">{loan.loanType}{loan.loanDate ? ` · ${loan.loanDate}` : ""}</p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold tabular-nums ${theme.monthly}`}>
                        {loan.monthlyAmortization === "" ? "—" : peso(loan.monthlyAmortization)}
                        <span className="ml-1 text-[10px] font-semibold uppercase text-slate-700">/mo</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="font-semibold text-slate-900">
              Total ({filtered.length} loan{filtered.length === 1 ? "" : "s"})
            </span>
            <span className={`whitespace-nowrap font-bold tabular-nums ${theme.monthly}`}>
              {peso(totalMonthly)}
              <span className="ml-1 text-[10px] font-semibold uppercase text-slate-700">/mo</span>
            </span>
          </footer>
        </div>
      )}
    </section>
  );
}
