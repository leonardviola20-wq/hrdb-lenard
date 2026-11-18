"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ContributionProviderPanel from "@/components/contribution-provider/ContributionProviderPanel";
import { useContributionProviderData } from "@/components/contribution-provider/useContributionProviderData";
import type { ContributionProvider, ContributionReport } from "@/components/contribution-provider/types";
import ContributionReportDialog from "@/components/philhealth-reports/dialogs/ContributionReportDialog";
import ContributionProviderReportDialog from "@/components/contribution-provider/ContributionProviderReportDialog";

export default function ContributionProviderContent({
  provider,
  initialEmployerId,
  onEmployerChange,
  allReportsMode = false,
}: {
  provider: ContributionProvider;
  initialEmployerId?: string;
  onEmployerChange?: (employerId: string) => void;
  allReportsMode?: boolean;
}) {
  const data = useContributionProviderData(provider, initialEmployerId, onEmployerChange);
  const [viewedReport, setViewedReport] = useState<ContributionReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [yearFilter, setYearFilter] = useState("all");
  const availableYears = useMemo(
    () => [...new Set(data.contributionReports.map((report) => report.applicableYear))].sort((a, b) => b - a),
    [data.contributionReports],
  );
  const filteredReports = useMemo(
    () => data.contributionReports.filter((report) => {
      const paid = provider === "philhealth" ? Boolean(report.payment) : Boolean(report.payDate);
      return (statusFilter === "all" || (statusFilter === "paid") === paid)
        && (yearFilter === "all" || report.applicableYear === Number(yearFilter));
    }),
    [data.contributionReports, provider, statusFilter, yearFilter],
  );
  const providerBreadcrumb = provider === "sss" ? "SSS" : provider === "pagibig" ? "PagIBIG" : "PhilHealth";

  return (
    <>
      {allReportsMode && (
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <Link
            href={`/reports/contributions?provider=${provider}&employerId=${encodeURIComponent(data.selectedEmployerId)}`}
            className="font-medium text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Contribution
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-slate-900">{providerBreadcrumb}</span>
        </nav>
      )}
      {allReportsMode && data.employerDetails && (
        <header className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{data.employerDetails.name}</h1>
            <p className="mt-1 font-mono text-sm text-slate-800">{data.employerDetails.providerNumber || "—"}</p>
            <p className="mt-1 text-sm text-slate-600">{data.employerDetails.address || "—"}</p>
          </div>
        </header>
      )}
      {allReportsMode && !data.employerDetails && data.employersLoading && (
        <p role="status" className="mb-5 text-sm text-slate-600">Loading employer details...</p>
      )}
      <ContributionProviderPanel
        provider={provider}
        allReportsMode={allReportsMode}
        employers={data.employers}
        employersLoading={data.employersLoading}
        employerError={data.employerError}
        selectedEmployerId={data.selectedEmployerId}
        onEmployerChange={data.changeEmployer}
        reports={allReportsMode ? filteredReports : data.contributionReports}
        reportError={data.reportError}
        reportLoading={data.reportLoading}
        onViewReport={setViewedReport}
        statusFilter={statusFilter}
        yearFilter={yearFilter}
        availableYears={availableYears}
        onStatusFilterChange={setStatusFilter}
        onYearFilterChange={setYearFilter}
      />
      {provider === "philhealth" && viewedReport && (
        <ContributionReportDialog report={viewedReport} onClose={() => setViewedReport(null)} />
      )}
      {provider !== "philhealth" && viewedReport && (
        <ContributionProviderReportDialog provider={provider} report={viewedReport} onClose={() => setViewedReport(null)} />
      )}
    </>
  );
}
