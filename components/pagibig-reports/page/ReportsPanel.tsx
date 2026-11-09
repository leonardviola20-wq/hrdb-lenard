"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { MembersTable, ReportsTable } from "../index";
import type { usePagibigReportView } from "../usePagibigReportView";
import type { Member, Report } from "../types";

type ViewControls = ReturnType<typeof usePagibigReportView>;

/** Main content panel: loading spinner, the payments table, or the members table. */
export function ReportsPanel({
  paymentsView,
  dataReady,
  view,
  canEditPayments,
  reportMenuOpen,
  setReportMenuOpen,
  reportMenuRef,
  openUpdateReport,
  setDeleteReportTarget,
  openPayment,
  drillThrough,
  setReportPage,
  setMemberPage,
  openEditAccount,
  openAddAccount,
}: {
  paymentsView: boolean;
  dataReady: boolean;
  view: ViewControls;
  canEditPayments: boolean;
  reportMenuOpen: number | null;
  setReportMenuOpen: Dispatch<SetStateAction<number | null>>;
  reportMenuRef: RefObject<HTMLDivElement | null>;
  openUpdateReport: (report: Report) => void;
  setDeleteReportTarget: (report: Report) => void;
  openPayment: (report: Report) => void;
  drillThrough: {
    setManualReports: (reports: Report[] | null) => void;
    setSelectedReport: (report: Report | null) => void;
    setManualViewReturnReports: Dispatch<SetStateAction<Report[] | null>>;
  };
  setReportPage: Dispatch<SetStateAction<number>>;
  setMemberPage: Dispatch<SetStateAction<number>>;
  openEditAccount: (member: Member) => void;
  openAddAccount: (employeeId: string, loadRoster: (employeeId: string) => void) => void;
}) {
  if (dataReady) {
    return (
      <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700">
          <ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" />
          <p>Loading Pag-IBIG records...</p>
        </div>
      </section>
    );
  }

  if (paymentsView) {
    return (
      <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
        <ReportsTable
          displayedPagibigReports={view.displayedPagibigReports}
          pagedReports={view.pagedReports}
          currentReportPage={view.currentReportPage}
          reportPageCount={view.reportPageCount}
          canEditPayments={canEditPayments}
          reportMenuOpen={reportMenuOpen}
          setReportMenuOpen={setReportMenuOpen}
          reportMenuRef={reportMenuRef}
          openUpdateReport={(report) => void openUpdateReport(report)}
          setDeleteReportTarget={(report) => setDeleteReportTarget(report)}
          openPayment={openPayment}
          setSelectedManualReports={drillThrough.setManualReports}
          setSelectedReport={(report) => drillThrough.setSelectedReport(report)}
          setManualViewReturnReports={drillThrough.setManualViewReturnReports}
          setReportPage={setReportPage}
        />
      </section>
    );
  }

  return (
    <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
      <MembersTable
        visibleMembers={view.visibleMembers}
        filteredMembers={view.filteredMembers}
        memberTotals={view.memberTotals}
        memberSavingsTotal={view.memberSavingsTotal}
        memberOverallTotal={view.memberOverallTotal}
        memberFirstResult={view.memberFirstResult}
        memberLastResult={view.memberLastResult}
        currentMemberPage={view.currentMemberPage}
        memberPageCount={view.memberPageCount}
        onPrevPage={() => setMemberPage(view.currentMemberPage - 1)}
        onNextPage={() => setMemberPage(view.currentMemberPage + 1)}
        onEditAccount={openEditAccount}
        onAddAccount={(employeeId) => openAddAccount(employeeId, () => { /* roster loading is wired by the page via openAddAccount */ })}
      />
    </section>
  );
}
