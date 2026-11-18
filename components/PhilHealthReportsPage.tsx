"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/BackButton";
// Hooks
import { usePhilHealthReportData } from "@/components/philhealth-reports/hooks/usePhilHealthReportData";
import { usePhilHealthReportForm } from "@/components/philhealth-reports/hooks/usePhilHealthReportForm";
import { usePhilHealthPayments } from "@/components/philhealth-reports/hooks/usePhilHealthPayments";
import { usePhilHealthAccountForm } from "@/components/philhealth-reports/hooks/usePhilHealthAccountForm";
import { usePhilHealthReportView } from "@/components/philhealth-reports/hooks/usePhilHealthReportView";
// Tables
import { EmployeesTable } from "@/components/philhealth-reports/tables/EmployeesTable";
import { ReportsTable } from "@/components/philhealth-reports/tables/ReportsTable";
import { PhilHealthReportDetails } from "@/components/philhealth-reports/tables/PhilHealthReportDetails";
// Dialogs
import { AccountFormDialog } from "@/components/philhealth-reports/dialogs/AccountFormDialog";
import { ReportGenerationDialog } from "@/components/philhealth-reports/dialogs/ReportGenerationDialog";
import { PaymentDialog } from "@/components/philhealth-reports/dialogs/PaymentDialog";
import { DeleteReportDialog } from "@/components/philhealth-reports/dialogs/DeleteReportDialog";
// Shared + routines
import { inputClass, reportPageSize as REPORT_PAGE_SIZE } from "@/components/philhealth-reports/shared/constants";
import type { Report } from "@/components/philhealth-reports/shared/types";
import { deleteReportRequest, savePaymentRequest } from "@/components/philhealth-reports/routines/reportActions";
import { useDismissableMenu } from "@/components/sss-reports/shared/useDismissableMenu";

export default function PhilHealthReportsPage() {
  return <Suspense fallback={<main className="min-h-0 flex-1 bg-slate-50 p-4 sm:p-6" />}><PhilHealthReportsContent /></Suspense>;
}

function PhilHealthReportsContent() {
  const params = useSearchParams();
  const requestedEmployerId = params.get("employerId") ?? "";
  const employerNumber = Number(requestedEmployerId);
  const employerId = Number.isSafeInteger(employerNumber) && employerNumber > 0 ? String(employerNumber) : "";
  const view = params.get("view") === "employees" ? "employees" : "reports";

  const data = usePhilHealthReportData({ employerId, view });
  const { employer, setEmployer, employees, setEmployees, reports, canEditPayments, loadedContext, loading, error, setError, requestRefresh } = data;

  const [notice, setNotice] = useState("");
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [paymentSavedOpen, setPaymentSavedOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [employeePage, setEmployeePage] = useState(1);
  const [reportSearch, setReportSearch] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState(String(new Date().getFullYear()));
  const [reportPage, setReportPage] = useState(1);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useReportMenuDismiss(reportMenuOpen, setReportMenuOpen);

  const form = usePhilHealthReportForm({ employerId, view, employees, setEmployer, setEmployees, setError, setNotice, requestRefresh });
  const { reportOpen, setReportOpen, reportMonth, setReportMonth, reportYear, setReportYear, saving: formSaving, openReportForm, createReport, defaultPs, defaultEs, activeEmployees } = form;

  const payments = usePhilHealthPayments({ employerId, employer, setViewReport, setPaymentSavedOpen, setError, requestRefresh });
  const { paymentReport, setPaymentReport, paymentForm, setPaymentForm, saving: paymentSaving, openPaymentForm } = payments;

  const accounts = usePhilHealthAccountForm({ employerId, setEmployer, setEmployees, setError, setNotice, requestRefresh });
  const {
    accountOpen, setAccountOpen, selectedEmployeeId, setSelectedEmployeeId,
    accountEmployeePickerOpen, setAccountEmployeePickerOpen, accountEmployeeSearch, setAccountEmployeeSearch,
    accountPickerRef, employeeOptions, openAccountForm, saveAccount, setAccountActive,
    accountAssignedEmployees, accountOtherEmployees, selectedAccountEmployee,
  } = accounts;

  const views = usePhilHealthReportView({ employees, reports, search, statusFilter, employeePage, reportSearch, reportYearFilter, reportPage, defaultPs, defaultEs });
  const { filteredEmployees, activeCount, inactiveCount, visibleEmployees, employeePageCount, currentEmployeePage, firstEmployeeResult, lastEmployeeResult, reportYears, filteredReports, reportPageCount, currentReportPage, displayedReports, reportAmountDue } = views;
  const title = view === "employees" ? "Employee List" : "Monthly Contribution Reports";

  useEffect(() => {
    if (!paymentSavedOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaymentSavedOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [paymentSavedOpen]);

  const savePayment = async () => {
    if (!paymentReport || !paymentForm) return;
    const saved = await savePaymentRequest(paymentReport, paymentForm, employerId, { setError, setNotice });
    if (!saved) return;
    setViewReport((current) => (current && current.id === paymentReport.id ? { ...current, payment: saved } : current));
    setPaymentReport(null);
    setPaymentForm(null);
    setPaymentSavedOpen(true);
    requestRefresh();
  };

  const onDeleteReportConfirm = async () => {
    if (!deleteReportTarget) return;
    const succeeded = await deleteReportRequest(deleteReportTarget, employerId, { setError, setNotice });
    if (!succeeded) return;
    const deletedId = deleteReportTarget.id;
    setDeleteReportTarget(null);
    setViewReport((current) => (current?.id === deletedId ? null : current));
    setNotice("PhilHealth report deleted.");
    requestRefresh();
  };

  const saving = formSaving || paymentSaving;

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-8.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-0 sm:p-2 lg:p-4">
      <section className="benefit-report-header shrink-0 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BackButton
              fallbackHref={`/reports?employerId=${encodeURIComponent(employerId)}`}
              label="Back to Reports"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">PhilHealth Reports</p>
              <h1 className="benefit-report-title">PhilHealth {title}</h1>
              <p className="text-xs text-slate-600">Manage PhilHealth employer contributions, reports, and payments.</p>
              {employer && <p className="truncate text-sm font-semibold text-slate-700">{employer.name} · {employer.phic || "—"}</p>}
            </div>
          </div>
          {employerId && <nav aria-label="PhilHealth report pages" className="flex flex-wrap gap-2">
            {view !== "employees" && <Link href={`/reports/philhealth?view=employees&employerId=${encodeURIComponent(employerId)}`} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Employee List</Link>}
            {view !== "reports" && <Link href={`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reports</Link>}
          </nav>}
        </div>
        {view === "employees" && employerId && <div className="benefit-report-toolbar mt-3 min-w-0 overflow-x-auto border-t border-slate-100 pt-3">
          <button type="button" onClick={() => void openAccountForm()} className="benefit-report-primary">Add</button>
          <input aria-label="Search employees" value={search} onChange={(event) => { setSearch(event.target.value); setEmployeePage(1); }} placeholder="Search employees" className={inputClass} />
          <select aria-label="Account status filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setEmployeePage(1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
            <option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("ACTIVE"); setEmployeePage(1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset</button>
        </div>}
        {view === "reports" && <div className="benefit-report-toolbar mt-3 min-w-0 overflow-x-auto border-t border-slate-100 pt-3">
          {employerId && <button type="button" onClick={() => void openReportForm()} className="benefit-report-primary">Create Monthly Report</button>}
          <input aria-label="Search reports" value={reportSearch} onChange={(event) => { setReportSearch(event.target.value); setReportPage(1); }} placeholder="Search reports" className={inputClass} />
          <select aria-label="Report year filter" value={reportYearFilter} onChange={(event) => { setReportYearFilter(event.target.value); setReportPage(1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
            <option value="ALL">All years</option>
            {reportYears.map((year) => <option key={year} value={String(year)}>{year}</option>)}
          </select>
        </div>}
      </section>

      {!employerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view PhilHealth records.</p>}
      {error && <p role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0">{error}</p>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}

      {employerId && <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
        {loading || loadedContext !== `${employerId}:${view}` ? <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700"><ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" /><p>Loading PhilHealth records...</p></div> : view === "employees" ? (
          <>
            <div className="benefit-report-section-heading"><h2 className="text-sm font-semibold text-slate-900">Employee Accounts</h2><p className="text-xs text-slate-500">{filteredEmployees.length} shown · {activeCount} active · {inactiveCount} inactive</p></div>
            <EmployeesTable
              visibleEmployees={visibleEmployees}
              filteredEmployees={filteredEmployees}
              defaultPs={defaultPs}
              defaultEs={defaultEs}
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              currentEmployeePage={currentEmployeePage}
              employeePageCount={employeePageCount}
              firstEmployeeResult={firstEmployeeResult}
              lastEmployeeResult={lastEmployeeResult}
              onSetAccountActive={(accountId, active) => void setAccountActive(accountId, active)}
              onPrevPage={() => setEmployeePage(currentEmployeePage - 1)}
              onNextPage={() => setEmployeePage(currentEmployeePage + 1)}
            />
          </>
        ) : (
          <ReportsTable
            displayedReports={displayedReports}
            filteredReports={filteredReports}
            canEditPayments={canEditPayments}
            reportMenuOpen={reportMenuOpen}
            setReportMenuOpen={setReportMenuOpen}
            reportMenuRef={reportMenuRef}
            onViewReport={setViewReport}
            onOpenPayment={(report) => { setViewReport(null); openPaymentForm(report); }}
            onDeleteReport={setDeleteReportTarget}
            reportYearFilter={reportYearFilter}
            currentReportPage={currentReportPage}
            reportPageCount={reportPageCount}
            reportPageSize={REPORT_PAGE_SIZE}
            onPrevPage={() => setReportPage(currentReportPage - 1)}
            onNextPage={() => setReportPage(currentReportPage + 1)}
          />
        )}
      </section>}

      <AccountFormDialog
        open={accountOpen}
        employer={employer}
        employeeOptions={employeeOptions}
        setEmployeeOptions={accounts.setEmployeeOptions}
        setError={setError}
        setNotice={setNotice}
        saving={saving}
        accountEmployeePickerOpen={accountEmployeePickerOpen}
        setAccountEmployeePickerOpen={setAccountEmployeePickerOpen}
        accountEmployeeSearch={accountEmployeeSearch}
        setAccountEmployeeSearch={setAccountEmployeeSearch}
        accountPickerRef={accountPickerRef}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        selectedAccountEmployee={selectedAccountEmployee}
        accountAssignedEmployees={accountAssignedEmployees}
        accountOtherEmployees={accountOtherEmployees}
        onClose={() => setAccountOpen(false)}
        onSubmit={(event) => void saveAccount(event)}
      />

      <ReportGenerationDialog
        open={reportOpen}
        employer={employer}
        activeEmployees={activeEmployees}
        defaultPs={defaultPs}
        defaultEs={defaultEs}
        reportMonth={reportMonth}
        reportYear={reportYear}
        reportAmountDue={reportAmountDue}
        saving={saving}
        setReportMonth={setReportMonth}
        setReportYear={setReportYear}
        onClose={() => setReportOpen(false)}
        onSubmit={() => void createReport()}
      />

      {viewReport && <PhilHealthReportDetails report={viewReport} canEditPayments={canEditPayments} onClose={() => setViewReport(null)} onPayment={(target) => { setViewReport(null); openPaymentForm(target); }} />}

      <PaymentDialog
        open={Boolean(paymentReport && paymentForm)}
        paymentReport={paymentReport}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        saving={saving}
        onClose={() => { setPaymentReport(null); setPaymentForm(null); }}
        onSubmit={() => void savePayment()}
      />

      <DeleteReportDialog
        open={Boolean(deleteReportTarget)}
        report={deleteReportTarget}
        saving={saving}
        onClose={() => setDeleteReportTarget(null)}
        onDelete={() => void onDeleteReportConfirm()}
      />

      {paymentSavedOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentSavedOpen(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="philhealth-payment-saved-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <header className="page-header-surface flex items-center justify-between gap-3">
              <h2 id="philhealth-payment-saved-title" className="text-lg font-bold text-slate-900">Payment saved</h2>
              <button type="button" onClick={() => setPaymentSavedOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <p className="mt-3 text-sm text-slate-700">PhilHealth payment details saved.</p>
            <div className="mt-5 flex justify-end">
              <button type="button" autoFocus onClick={() => setPaymentSavedOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

// Local thin adapters kept out of the module graph on purpose.

function useReportMenuDismiss(open: number | null, setOpen: (value: number | null) => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useDismissableMenu(open !== null, ref, () => setOpen(null));
  return ref;
}
