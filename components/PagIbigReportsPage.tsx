"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getPagibigCreateEmployeeHref } from "@/lib/pagibigEmployeeWorkflow";
import { sortPagibigPreviewMembers } from "@/lib/pagibigReportPreview";
import { validPagibigYear } from "@/lib/pagibigYear";
import {
  AccountFormDialog,
  DeleteReportDialog,
  ManualReportsDialog,
  MembersTable,
  PaymentDialog,
  ReportDetails,
  ReportGenerationDialog,
  ReportsTable,
} from "@/components/pagibig-reports";
import { PagIbigReportsHeader } from "@/components/pagibig-reports/ReportsHeader";
import { memberAccountYear, monthNames } from "@/components/pagibig-reports/constants";
import { usePagibigAccountForm } from "@/components/pagibig-reports/usePagibigAccountForm";
import { usePagibigDrafts } from "@/components/pagibig-reports/usePagibigDrafts";
import { usePagibigEmployeeRoster } from "@/components/pagibig-reports/usePagibigEmployeeRoster";
import { usePagibigPayments } from "@/components/pagibig-reports/usePagibigPayments";
import { usePagibigReportData } from "@/components/pagibig-reports/usePagibigReportData";
import { usePagibigReportForm } from "@/components/pagibig-reports/usePagibigReportForm";
import { usePagibigReportView } from "@/components/pagibig-reports/usePagibigReportView";
import { useDismissableMenu } from "@/components/pagibig-reports/useDismissableMenu";
import { usePagibigAccountActions } from "@/components/pagibig-reports/usePagibigAccountActions";
import { usePagibigReportActions } from "@/components/pagibig-reports/usePagibigReportActions";
import type { Account, Member, Report, ReportDraft } from "@/components/pagibig-reports/types";

export default function PagIbigReportsPage() {
  return <Suspense fallback={<main className="flex-1 bg-slate-50 p-4 sm:p-6" />}><PagIbigReportsContent /></Suspense>;
}

function PagIbigReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEmployerId = searchParams.get("employerId") ?? "";
  const employerIdValue = Number(requestedEmployerId);
  const selectedEmployerId = Number.isSafeInteger(employerIdValue) && employerIdValue > 0 ? String(employerIdValue) : "";
  const paymentsView = searchParams.get("view") === "payments";
  const requestedAccountYear = validPagibigYear(searchParams.get("year"));
  const requestedNewEmployeeId = Number(searchParams.get("addEmployeeId"));

  const [accountYear] = useState(String(requestedAccountYear ?? memberAccountYear));
  const {
    members, setMembers,
    reports, setReports,
    reportEmployer,
    canEditPayments,
    loading, loadedContext,
    refreshing,
    error, setError,
    requestRefresh,
  } = usePagibigReportData({ accountYear, paymentsView, selectedEmployerId });
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberStatusFilter, setMemberStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [reportPage, setReportPage] = useState(1);
  const [reportView, setReportView] = useState<"PIF" | "MANUAL">("PIF");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedManualReports, setSelectedManualReports] = useState<Report[] | null>(null);
  const [manualViewReturnReports, setManualViewReturnReports] = useState<Report[] | null>(null);

  const account = usePagibigAccountForm();
  const {
    accountFormOpen, returnToReportPreview, editingMember, accountForm,
    loanEditorType, loanEditorDetail, loanEditorReason, loanEditorSourceType, loanEditorBackup,
    loanStatusFilter, savingAccount, accountError,
  } = account.state;
  const {
    setAccountFormOpen, setAccountForm,
    setLoanEditorBackup, setSavingAccount, setAccountError,
  } = account;

  const form = usePagibigReportForm();
  const {
    reportFormOpen, previewMembers, previewLoading, previewError, previewYear, previewFilter,
    reportEmployeePickerOpen, reportEmployeeId, reportMonth, reportYear, reportPin,
    manualReport, reportKind, updatingReportId, generating,
  } = form.state;
  const {
    setReportFormOpen, setPreviewMembers, setReportYear,
    setReportEmployeePickerOpen, setReportEmployeeId, setReportMonth, setReportPin,
    setReportKind,
  } = form;

  const drafts = usePagibigDrafts();
  const { reportDrafts, setReportDrafts, savingDraft, draftsOpen, setDraftsOpen, reportDraftId: currentDraftId } = drafts;
  // `currentDraftId` is passed to ReportGenerationDialog; draft mutations live in usePagibigReportActions.

  const payments = usePagibigPayments(selectedEmployerId, setReports);
  const {
    paymentReport, setPaymentReport, paymentForm, setPaymentForm,
    savingPayment, paymentError, deleteReportTarget, setDeleteReportTarget,
    deletingReport, openPayment, savePayment,
  } = payments;

  const roster = usePagibigEmployeeRoster({ onError: setError });
  const { allEmployees, setAllEmployees, allEmployeesError, clearRosterError, allEmployeesLoading, setAllEmployeesLoading, rosterLoadedRef } = roster;

  const accountActions = usePagibigAccountActions({
    account, accountYear, reportYear, setReportFormOpen: (open) => setReportFormOpen(open),
  });
  const { openAddAccount, openEditAccount, closeAccountForm, openLoanEditor, saveLoanDetail, deleteLoanDetail, onSelectEmployeeForAccount } = accountActions;

  const previewRequestRef = useRef(0);
  const autoAddEmployeeRef = useRef("");
  const [selectedReportEmployees, setSelectedReportEmployees] = useState<Member[]>([]);
  const reportActions = usePagibigReportActions({
    form, drafts, selectedEmployerId, paymentsView, yearFilter,
    reports, setReports, setError, setNotice,
    allEmployees, selectedReportEmployees, setSelectedReportEmployees, previewRequestRef,
  });
  const {
    openReportForm, openUpdateReport, addReportEmployee, removeReportEmployee, addAllReportEmployees,
    resetReportYearPreview, saveReportDraft, resumeReportDraft, deleteReportDraft, generateReport,
  } = reportActions;

  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  useEffect(() => {
    if (!paymentsView || !selectedEmployerId) return;
    let cancelled = false;
    fetch(`/api/reports/pagibig/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load Pag-IBIG drafts");
        return data.drafts as ReportDraft[];
      })
      .then((loaded) => { if (!cancelled) setReportDrafts(loaded); })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load Pag-IBIG drafts"); });
    return () => { cancelled = true; };
  }, [paymentsView, selectedEmployerId, setReportDrafts, setError]);

  useDismissableMenu(reportMenuRef, Boolean(reportMenuOpen), () => setReportMenuOpen(null));
  const draftsMenuRef = useRef<HTMLDivElement | null>(null);
  useDismissableMenu(draftsMenuRef, draftsOpen, () => setDraftsOpen(false));

  const dataReady = loading || loadedContext !== `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}`;

  const refresh = () => {
    setError("");
    setNotice("");
    if (paymentsView) {
      setSearch("");
      setYearFilter("");
      setPaymentStatusFilter("ALL");
      setReportPage(1);
    } else {
      setSearch("");
      setMemberStatusFilter("ALL");
      setMemberPage(1);
    }
    requestRefresh();
  };

  const view = usePagibigReportView({
    members,
    reports,
    reportView,
    yearFilter,
    paymentStatusFilter,
    search,
    memberStatusFilter,
    memberPage,
    reportPage,
    previewMembers,
    previewFilter,
    manualReport,
    reportKind,
    selectedEmployerId,
    reportEmployer,
  });

  const resetMemberFilters = (status: "ALL" | "ACTIVE") => {
    setSearch("");
    setMemberStatusFilter(status);
    setMemberPage(1);
  };

  /** Loads the roster and pre-selects the just-created employee in the account form. */
  const handleAddAccountRoster = useCallback((employeeId: string) => {
    clearRosterError();
    setAllEmployees([]);
    setAllEmployeesLoading(true);
    roster.handleAddAccountRoster(employeeId, (employee) => {
      if (!employee) {
        setAccountError("The new employee could not be found. Refresh the employee list and try again.");
        return;
      }
      setAccountForm((current) => ({ ...current, employeeId: employee.id ? String(employee.id) : employeeId, midNumber: employee.pagIbigNumber ?? "" }));
    });
  }, [clearRosterError, setAccountError, setAccountForm, roster]);

  useEffect(() => {
    if (paymentsView || !selectedEmployerId || !Number.isSafeInteger(requestedNewEmployeeId) || requestedNewEmployeeId <= 0
      || loading || loadedContext !== `${selectedEmployerId}:members:${accountYear}`) return;
    const key = `${selectedEmployerId}:${accountYear}:${requestedNewEmployeeId}`;
    if (autoAddEmployeeRef.current === key) return;
    autoAddEmployeeRef.current = key;
    router.replace(`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(accountYear)}`, { scroll: false });
    openAddAccount(String(requestedNewEmployeeId), handleAddAccountRoster);
  }, [accountYear, loadedContext, loading, openAddAccount, paymentsView, requestedNewEmployeeId, router, selectedEmployerId, handleAddAccountRoster]);

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountForm.employeeId) {
      setAccountError("Select an employee.");
      return;
    }
    setSavingAccount(true);
    setAccountError("");
    try {
      const response = await fetch("/api/reports/pagibig/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountForm,
          employerId: selectedEmployerId,
          isNewAccount: !editingMember,
          excludedFromReport: editingMember ? accountForm.excludedFromReport : false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save Pag-IBIG account");
      const previousMember = editingMember
        ?? members.find((member) => member.id === Number(accountForm.employeeId))
        ?? previewMembers.find((member) => member.id === Number(accountForm.employeeId));
      if (previousMember) {
        const updatedMember = { ...previousMember, pagIbigNumber: data.account.employee.pagIbigNumber, pagIbigAccount: data.account as Account };
        setMembers((current) => current.map((member) => member.id === updatedMember.id ? updatedMember : member));
        setPreviewMembers((current) => current.map((member) => member.id === updatedMember.id ? updatedMember : member));
      } else {
        const newMember: Member = {
          id: data.account.employee.id,
          employeeCode: data.account.employee.employeeCode,
          firstName: data.account.employee.firstName,
          middleName: data.account.employee.middleName,
          lastName: data.account.employee.lastName,
          status: data.account.employee.status,
          pagIbigNumber: data.account.employee.pagIbigNumber,
          pagIbigAccount: data.account as Account,
        };
        setMembers((current) => sortPagibigPreviewMembers([...current, newMember]));
        setPreviewMembers((current) => sortPagibigPreviewMembers([...current, newMember]));
      }
      setAccountFormOpen(false);
      setLoanEditorBackup(null);
      if (returnToReportPreview) {
        setReportFormOpen(true);
      } else {
        resetMemberFilters("ACTIVE");
        setError("");
        setNotice("");
        requestRefresh();
      }
    } catch (saveError) {
      // Restore the old loan type's data if a type switch was in progress
      if (loanEditorBackup) {
        setAccountForm((current) => ({
          ...current,
          loanDetails: { ...current.loanDetails, [loanEditorBackup.sourceType]: loanEditorBackup.detail },
        }));
        setLoanEditorBackup(null);
      }
      setAccountError(saveError instanceof Error ? saveError.message : "Unable to save Pag-IBIG account");
    } finally {
      setSavingAccount(false);
    }
  };

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setError("");
    try {
      const response = await fetch(`/api/reports/pagibig/${deleteReportTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error((data as { error?: string } | null)?.error || "Unable to delete Pag-IBIG report");
      const deletedId = deleteReportTarget.id;
      setReports((current) => current.filter((report) => report.id !== deletedId));
      if (selectedReport?.id === deletedId) setSelectedReport(null);
      if (paymentReport?.id === deletedId) setPaymentReport(null);
      setDeleteReportTarget(null);
      setNotice("Pag-IBIG report deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Pag-IBIG report");
    }
  };

  const reportEmployeeOptions = allEmployees.filter((employee) => !previewMembers.some((member) => member.id === employee.id));
  const createEmployeeHref = getPagibigCreateEmployeeHref(selectedEmployerId, accountYear);
  const closeReportForm = () => {
    form.setUpdatingReportId(null);
    setReportFormOpen(false);
  };
  /** Shows the details dialog, remembering which manual-reports list to return to afterwards. */
  const openReportDetails = (report: Report, fromManualReports: Report[] | null) => {
    if (fromManualReports) { setSelectedManualReports(fromManualReports); setManualViewReturnReports(null); }
    setSelectedReport(report);
  };
  const closeReportDetails = () => {
    setSelectedReport(null);
    if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); }
  };
  const closeManualReports = () => setSelectedManualReports(null);
  const openPaymentFromManualReports = (report: Report) => {
    setSelectedManualReports(null);
    openPayment(report);
  };

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-0 sm:p-2 lg:p-4 md:h-[calc(100dvh-7.75rem)]">
      <PagIbigReportsHeader
        selectedEmployerId={selectedEmployerId}
        paymentsView={paymentsView}
        reportEmployer={reportEmployer}
        refreshing={refreshing}
        onRefresh={refresh}
        search={search}
        onSearchChange={(value) => { setSearch(value); if (!paymentsView) setMemberPage(1); }}
        years={view.years}
        yearFilter={yearFilter}
        onYearFilterChange={(value) => { setYearFilter(value); setReportPage(1); }}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusFilterChange={(value) => { setPaymentStatusFilter(value); setReportPage(1); }}
        memberStatusFilter={memberStatusFilter}
        onMemberStatusFilterChange={(value) => { setMemberStatusFilter(value); setMemberPage(1); }}
        reportView={reportView}
        onReportViewChange={(value) => { setReportView(value); setReportPage(1); }}
        onOpenManualReportForm={() => void openReportForm([], true)}
        onOpenPifReportForm={() => void openReportForm()}
        onOpenAddAccount={() => openAddAccount("", handleAddAccountRoster)}
        drafts={selectedEmployerId && paymentsView ? {
          open: draftsOpen,
          drafts: reportDrafts,
          onToggle: () => setDraftsOpen((open) => !open),
          onResume: (draft) => void resumeReportDraft(draft),
          onDelete: (draft) => void deleteReportDraft(draft),
        } : undefined}
      />

      {!selectedEmployerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view Pag-IBIG records.</p>}
      {error && <div role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0 flex items-center gap-2"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0 rounded-md p-1 text-rose-800 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-600"><XMarkIcon className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}

      {selectedEmployerId && <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
        {dataReady ? <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700"><ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" /><p>Loading Pag-IBIG records...</p></div>
          : paymentsView ? (
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
              setDeleteReportTarget={setDeleteReportTarget}
              openPayment={openPayment}
              setSelectedManualReports={setSelectedManualReports}
              setSelectedReport={setSelectedReport}
              setManualViewReturnReports={setManualViewReturnReports}
              setReportPage={setReportPage}
            />
          ) : (
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
              onEditAccount={(member) => openEditAccount(member)}
              onAddAccount={(employeeId) => openAddAccount(employeeId, handleAddAccountRoster)}
            />
          )}
      </section>}

      <AccountFormDialog
        open={accountFormOpen}
        editingMember={editingMember}
        accountForm={accountForm}
        setAccountForm={account.setAccountForm}
        allEmployees={allEmployees}
        allEmployeesError={allEmployeesError}
        allEmployeesLoading={allEmployeesLoading}
        accountError={accountError}
        savingAccount={savingAccount}
        createEmployeeHref={createEmployeeHref}
        loanEditorType={loanEditorType}
        setLoanEditorType={account.setLoanEditorType}
        loanEditorDetail={loanEditorDetail}
        setLoanEditorDetail={account.setLoanEditorDetail}
        loanEditorReason={loanEditorReason}
        setLoanEditorReason={account.setLoanEditorReason}
        loanEditorSourceType={loanEditorSourceType}
        setLoanEditorSourceType={account.setLoanEditorSourceType}
        loanEditorBackup={loanEditorBackup}
        setLoanEditorBackup={setLoanEditorBackup}
        loanStatusFilter={loanStatusFilter}
        setLoanStatusFilter={account.setLoanStatusFilter}
        onClose={closeAccountForm}
        onSubmit={saveAccount}
        onSelectEmployee={(employeeId) => onSelectEmployeeForAccount(employeeId, allEmployees)}
        onOpenLoanEditor={openLoanEditor}
        onSaveLoanDetail={saveLoanDetail}
        onDeleteLoanDetail={deleteLoanDetail}
      />

      <ReportGenerationDialog
        open={reportFormOpen}
        form={{
          manual: manualReport,
          kind: reportKind,
          pin: reportPin,
          month: reportMonth,
          year: reportYear,
          draftId: currentDraftId,
          updatingReportId,
          pickerOpen: reportEmployeePickerOpen,
          employeeId: reportEmployeeId,
        }}
        employer={reportEmployer}
        selectedEmployerId={selectedEmployerId}
        reports={reports}
        reportDrafts={reportDrafts}
        monthNames={monthNames}
        employees={{ loading: allEmployeesLoading, error: allEmployeesError, options: reportEmployeeOptions }}
        preview={{
          loading: previewLoading,
          error: previewError,
          year: previewYear,
          filter: previewFilter,
          filteredMembers: view.filteredPreviewMembers,
          entryCount: view.previewEntries.length,
          showSavingsColumns: view.showSavingsColumns,
          showLoanColumns: view.showLoanColumns,
          columnCount: view.previewColumnCount,
          total: view.previewTotal,
          overall: view.previewOverall,
        }}
        savingDraft={savingDraft}
        generating={generating}
        onClose={closeReportForm}
        onCancel={() => setReportFormOpen(false)}
        onSubmit={generateReport}
        onSetKind={setReportKind}
        onSetPin={setReportPin}
        onSetMonth={setReportMonth}
        onSetEmployeePickerOpen={setReportEmployeePickerOpen}
        onSetEmployeeId={setReportEmployeeId}
        onYearChange={(year) => {
          setReportYear(year);
          resetReportYearPreview();
        }}
        onAddAllEmployees={() => void addAllReportEmployees()}
        onToggleEmployeePicker={() => {
          if (!rosterLoadedRef.current && !allEmployeesLoading && !allEmployeesError) void roster.loadReportEmployeeOptions();
          setReportEmployeePickerOpen((current) => !current);
        }}
        onAddEmployee={(employeeId) => void addReportEmployee(employeeId)}
        onSaveDraft={() => void saveReportDraft()}
        onGenerateReport={() => void generateReport()}
        onEditAccount={(member, fromPreview) => openEditAccount(member, fromPreview)}
        onRemoveEmployee={removeReportEmployee}
      />

      {selectedReport && <ReportDetails report={selectedReport} onClose={closeReportDetails} onPayment={(paidReport) => { setSelectedReport(null); openPayment(paidReport); }} employerAddress={reportEmployer?.address ?? null} />}

      {selectedManualReports && <ManualReportsDialog reports={selectedManualReports} canEditPayments={canEditPayments} onClose={closeManualReports} onViewDetails={(report) => openReportDetails(report, selectedManualReports)} onOpenPayment={openPaymentFromManualReports} />}

      {deleteReportTarget && <DeleteReportDialog report={deleteReportTarget} deleting={deletingReport} onCancel={() => setDeleteReportTarget(null)} onDelete={() => void deleteReport()} />}

      <PaymentDialog
        report={paymentReport}
        reports={reports}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        savingPayment={savingPayment}
        paymentError={paymentError}
        onClose={() => setPaymentReport(null)}
        onSave={savePayment}
        openPayment={openPayment}
      />
    </main>
  );
}
