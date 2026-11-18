"use client";

import ContributionEmployerPicker from "@/components/philhealth-reports/shared/ContributionEmployerPicker";
import ContributionReportsTable from "@/components/contribution-provider/ContributionReportsTable";
import type { ContributionProvider, ContributionReport, Employer } from "./types";

const providerLabels: Record<ContributionProvider, string> = {
  sss: "SSS",
  pagibig: "PagIBIG",
  philhealth: "Philhealth",
};
const headings: Record<ContributionProvider, string> = {
  sss: "SSS Contributions",
  pagibig: "PagIBIG Contributions",
  philhealth: "Philhealth Contributions",
};
type Props = {
  provider: ContributionProvider;
  allReportsMode: boolean;
  employers: Employer[];
  employersLoading: boolean;
  employerError: string;
  selectedEmployerId: string;
  onEmployerChange: (employerId: string) => void;
  reports: ContributionReport[];
  reportError: string;
  reportLoading: boolean;
  onViewReport: (report: ContributionReport) => void;
  statusFilter: "all" | "paid" | "unpaid";
  yearFilter: string;
  availableYears: number[];
  onStatusFilterChange: (value: "all" | "paid" | "unpaid") => void;
  onYearFilterChange: (value: string) => void;
};

export default function ContributionProviderPanel({
  provider, allReportsMode, employers, employersLoading, employerError, selectedEmployerId, onEmployerChange,
  reports, reportError, reportLoading, onViewReport,
  statusFilter, yearFilter, availableYears, onStatusFilterChange, onYearFilterChange,
}: Props) {
  const providerLabel = providerLabels[provider];
  return (
    <section aria-label={`${providerLabel} reports`} className="mt-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {!allReportsMode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{headings[provider]}</h2>
              <p className="mt-1 text-sm text-slate-600">View saved contribution reports for an employer.</p>
            </div>
            <div className="w-full sm:w-80">
              <label id={`${provider}-employer-label`} htmlFor={`${provider}-employer`} className="mb-1 block text-sm font-medium text-slate-700">Employer</label>
              {provider === "philhealth" ? (
                <ContributionEmployerPicker
                  id={`${provider}-employer`}
                  labelId={`${provider}-employer-label`}
                  employers={employers}
                  selectedEmployerId={selectedEmployerId}
                  disabled={employersLoading || employers.length === 0}
                  onChange={onEmployerChange}
                />
              ) : (
                <select
                  id={`${provider}-employer`}
                  value={selectedEmployerId}
                  disabled={employersLoading || employers.length === 0}
                  onChange={(event) => onEmployerChange(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                >
                  {employersLoading && <option value="">Loading employers...</option>}
                  {!employersLoading && employers.length === 0 && <option value="">No employers available</option>}
                  {employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}
                </select>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-4">
            <div>
              <label htmlFor="contribution-status-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Payment status</label>
              <select
                id="contribution-status-filter"
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as "all" | "paid" | "unpaid")}
                className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label htmlFor="contribution-year-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Applicable year</label>
              <select
                id="contribution-year-filter"
                value={yearFilter}
                onChange={(event) => onYearFilterChange(event.target.value)}
                className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All years</option>
                {availableYears.map((year) => <option key={year} value={String(year)}>{year}</option>)}
              </select>
            </div>
          </div>
        )}
        {employerError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{employerError}</p>}
        {reportError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{reportError}</p>}
        {reportLoading && <p role="status" className="mt-5 text-sm text-slate-600">Loading {providerLabel} contribution reports...</p>}
        {allReportsMode && !employersLoading && !employerError && !selectedEmployerId && (
          <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The selected employer is unavailable. Return to Contributions and select an employer.</p>
        )}
        {!employersLoading && !employerError && employers.length > 0 && !reportLoading && !reportError && (selectedEmployerId || !allReportsMode) && (
          reports.length === 0
            ? <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">No contribution reports found for this employer.</p>
            : <div className="mt-5 min-h-0 overflow-hidden rounded-lg border border-slate-200"><ContributionReportsTable
                provider={provider}
                reports={reports}
                onViewReport={onViewReport}
                compactMobile={allReportsMode}
              /></div>
        )}
      </div>
    </section>
  );
}
