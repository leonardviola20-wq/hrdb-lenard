"use client";

import { Suspense, useState, type FormEvent as ReactFormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BackButton from "@/components/BackButton";
import { useSssReportData, useSssDraftPersistence } from "./sss-reports/hooks/useSssReportData";
import { useSssLoanManagement } from "./sss-reports/hooks/useSssLoanManagement";
import { useSssReportForm } from "./sss-reports/hooks/useSssReportForm";
import { CompensationRangePicker } from "./sss-reports/shared/CompensationRangePicker";
import { ReportDeleteDialog, ContributionTableDialog } from "./sss-reports/dialogs/ReportDialogs";
import { LoanReportDialog, LoanListDialog, LoanFormModal, LoanDeleteDialog } from "./sss-reports/dialogs/LoanDialogs";
import { EmployeeEntryPicker } from "./sss-reports/shared/EmployeeEntryPicker";
import { dateOnly } from "./sss-reports/shared/format";
import { ReportPreview } from "./sss-reports/tables/ReportsTables";
import type { PaymentFormState, Report, SssLoan, SssReportDraft } from "./sss-reports/shared/types";
// Components
import { ReportsPanelHeading } from "./sss-reports/page/ReportsPanelHeading";
import { ReportsToolbar } from "./sss-reports/page/ReportsToolbar";
import { AnnualReportsTable } from "./sss-reports/tables/AnnualReportsTable";
import { CreateReportModal } from "./sss-reports/dialogs/CreateReportModal";
import { CreateReportDialogFooter } from "./sss-reports/dialogs/CreateReportDialogFooter";
import { ReportFields } from "./sss-reports/dialogs/ReportFields";
import { EmployeeEntriesSection } from "./sss-reports/dialogs/EmployeeEntriesSection";
import { ViewReportModal } from "./sss-reports/dialogs/ViewReportModal";
import { PaymentDialogWrapper } from "./sss-reports/dialogs/PaymentDialog";
// Hooks
import { useReportDebouncedAutoSave } from "./sss-reports/hooks/useReportDebouncedAutoSave";
import { usePopoverMenu } from "./sss-reports/hooks/usePopoverMenu";
// Routines
import { filterLoanRecords, filterActiveLoanReportLoans } from "./sss-reports/routines/loanFilters";
import { handleLoanMenuAction } from "./sss-reports/routines/loanMenuAction";
import { deleteReport as deleteReportRoutine, deleteReportDraft as deleteReportDraftRoutine, resumeReportDraft as resumeReportDraftRoutine, saveReportRequest, savePaymentRequest } from "./sss-reports/routines/reportCrud";
import { draftHasContent, validateDraftFields } from "./sss-reports/routines/draftGuard";

export default function SssReportsPage() {
  return <Suspense fallback={<main className="flex-1 bg-slate-50 p-4 sm:p-6" />}><SssReportsContent /></Suspense>;
}

function SssReportsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employerIdParam = searchParams.get("employerId");
  const employerIdValue = Number(employerIdParam);
  const selectedEmployerId = Number.isSafeInteger(employerIdValue) && employerIdValue > 0 ? String(employerIdValue) : "";
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const kind: "CONTRIBUTION" | "LOAN" = searchParams.get("kind") === "LOAN" ? "LOAN" : "CONTRIBUTION";

  const data = useSssReportData({ kind, selectedEmployerId, currentYear });
  const {
    employers, reports, setReports, canEditPayments, visibleReportDrafts, removeDraft,
    loading, error, setError, notice, setNotice, yearFilter, setYearFilter, search, setSearch,
    refreshingRecords, refreshSssRecords, resetFiltersAndRefresh, years, annualReports,
  } = data;

  const loans = useSssLoanManagement({ selectedEmployerId, currentMonth, currentYear });
  const form = useSssReportForm({
    kind, selectedEmployerId, currentMonth, currentYear, reports, employers,
    setError, setNotice: setNotice,
  });
  const {
    createOpen, setCreateOpen, editReport, preview, setPreview,
    pickerOpen, setPickerOpen, selectedEmployeeId,
    employeeDropdownOpen, setEmployeeDropdownOpen, selectedLoanIds, setSelectedLoanIds,
    loanEntrySearch, setLoanEntrySearch, selectedMsc, setSelectedMsc,
    employeeSssSearch, setEmployeeSssSearch, loadingEmployerEmployees, loadingPreviousEntries,
    rangePickerTarget, setRangePickerTarget,
    draft, setDraft, entries, setEntries,
    selectedEmployer, chosenEmployeeIds, filteredContributionEmployees, availableLoanEntries,
    existingLoanReportMonths, employeeTotal, calculatedTotal, amountDue,
    hasLegacyLoanEntries, hasUnconfiguredEntries, isTally,
    selectedContributionEmployee, compensationEmployeeName,
    resetReportDraft, openCreate, addSelectedEmployee, selectEmployeeForContribution,
    openEmployeePicker, addAllEmployees, addPreviousEntries,
    updateLoanEntry, removeEntry, selectContributionRange, openReportEdit,
  } = form;

  const drafts = useSssDraftPersistence({ kind, draft, entries });
  const { draftId, draftSaveQueueRef, draftSaveStatus, setDraftSaveStatus, persistReportDraft, resetDraftId, setDraftIdDirect } = drafts;

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [deleteReportSaving, setDeleteReportSaving] = useState(false);
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({ amountPaid: "", paymentType: "", payDate: "", sssBranch: "", transactionReference: "" });
  const [saving, setSaving] = useState(false);
  const [draftMenuOpen, setDraftMenuOpen] = useState(false);
  const currentEmployer = employers.find((employer) => String(employer.id) === selectedEmployerId) ?? null;

  const loanMenu = usePopoverMenu();
  const reportMenu = usePopoverMenu();

  useReportDebouncedAutoSave({ createOpen, editReport: Boolean(editReport), saving, draft, entries, persistReportDraft, draftSaveQueueRef, setDraftSaveStatus, setError });

  const filteredLoanRecords = filterLoanRecords(loans.loanRecords, {
    selectedEmployerId,
    loanListSearch: loans.loanListSearch,
    loanAccountFilter: loans.loanAccountFilter,
    loanListStatus: loans.loanListStatus,
  });

  const filteredActiveLoanReportLoans = filterActiveLoanReportLoans({
    activeLoanReport: loans.activeLoanReport,
    activeLoanReportFilter: loans.activeLoanReportFilter,
    applicableYear: currentYear,
    applicableMonth: currentMonth,
  });

  const onLoanMenuAction = (loan: SssLoan, action: "menu" | "view" | "update" | "delete") => handleLoanMenuAction(loan, action, loanMenu.openId, loanMenu.setOpenId, loans);
  const onLoanSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveSssLoan(event, setNotice);
  const onLoanEditSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveLoanEdit(event, setNotice);
  const onLoanViewEditSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveLoanViewEdit(event, setNotice);
  const onLoanDeleteConfirm = () => void loans.deleteLoan(setNotice);

  const onDeleteReportConfirm = async () => {
    if (!deleteReportTarget) return;
    setDeleteReportSaving(true);
    try {
      await deleteReportRoutine(deleteReportTarget, {
        setReports, setViewReport, dismissDeleteTarget: () => setDeleteReportTarget(null),
        refreshSssRecords, setError, setNotice,
      });
    } finally {
      setDeleteReportSaving(false);
    }
  };

  const resumeReportDraft = async (savedDraft: SssReportDraft) => {
    setSaving(true);
    const resumed = await resumeReportDraftRoutine(savedDraft, {
      pathname, search: searchParams.toString(),
      routerReplace: (href) => router.replace(href, { scroll: false }),
      removeDraft, resetDraftId, setDraftIdDirect,
      setDraft, setEntries, setPreview, setPickerOpen, setCreateOpen,
      setError, setNotice: () => {},
    });
    setDraftMenuOpen(false);
    setSaving(false);
    if (!resumed) return;
  };

  const closeCreate = async () => {
    if (saving) return;
    if (editReport) {
      setCreateOpen(false);
      resetReportDraft();
      resetDraftId();
      return;
    }
    setSaving(true);
    try {
      await draftSaveQueueRef.current;
      const shouldPersist = draftHasContent({ draftId, draft, entries, currentMonth, currentYear }) && Boolean(draft.prn.trim());
      if (shouldPersist) await persistReportDraft(true);
      setCreateOpen(false);
      resetReportDraft();
      resetDraftId();
      if (shouldPersist) await refreshSssRecords();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Unable to return the draft to Saved Drafts");
    } finally {
      setSaving(false);
    }
  };

  const saveReportDraft = async () => {
    setSaving(true);
    setError("");
    try {
      const validationError = validateDraftFields(draft);
      if (validationError) {
        setError(validationError);
        return;
      }
      await draftSaveQueueRef.current;
      await persistReportDraft(true);
      await refreshSssRecords();
      setCreateOpen(false);
      resetReportDraft();
      resetDraftId();
      setNotice("Draft saved. You can reopen it from Saved Drafts.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save SSS report draft");
    } finally {
      setSaving(false);
    }
  };

  const deleteReportDraft = async (savedDraft: SssReportDraft) => {
    await deleteReportDraftRoutine(savedDraft, { removeDraft, refreshSssRecords, setError, setNotice });
  };

  const saveReport = async () => {
    if (!isTally || !selectedEmployer) return;
    const employer = selectedEmployer;
    if (!editReport && kind === "LOAN") {
      const applicableMonth = Number(draft.month);
      const applicableYear = Number(draft.year);
      const duplicate = reports.some((report) =>
        report.kind === "LOAN"
        && report.employerId === employer.id
        && report.applicableMonth === applicableMonth
        && report.applicableYear === applicableYear);
      if (duplicate) {
        setError(`A Loan report for ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][applicableMonth - 1]} ${applicableYear} already exists for ${employer.name}. Select another Applicable Month or edit the existing report.`);
        setPreview(false);
        return;
      }
    }
    if (!window.confirm(`${editReport ? "Update" : "Save"} this ${kind.toLocaleLowerCase()} report for ${employer.name}?`)) return;
    setSaving(true);
    setError("");
    try {
      if (!editReport) {
        await draftSaveQueueRef.current;
        if (draftId === null && draft.prn.trim()) await persistReportDraft(false);
      }
      const succeeded = await saveReportRequest({
        editReport, kind, employer,
        prn: draft.prn,
        applicableMonth: Number(draft.month),
        applicableYear: Number(draft.year),
        amountDue: String(amountDue),
        entries, draftId, prnTrimmed: Boolean(draft.prn.trim()),
      }, { refreshSssRecords, setError, setNotice });
      if (succeeded) {
        setCreateOpen(false);
        resetReportDraft();
        resetDraftId();
      }
    } finally {
      setSaving(false);
    }
  };

  const openPaymentForm = (report: Report) => {
    setPaymentReport(report);
    setPaymentForm({
      amountPaid: report.amountPaid ?? report.amountDue,
      paymentType: report.paymentType ?? "",
      payDate: dateOnly(report.payDate) === "—" ? "" : dateOnly(report.payDate),
      sssBranch: report.sssBranch ?? "",
      transactionReference: report.transactionReference ?? "",
    });
  };

  const savePayment = async (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentReport) return;
    setSaving(true);
    try {
      const updated = await savePaymentRequest(paymentReport, paymentForm, { refreshSssRecords, setError, setNotice });
      if (updated) {
        setViewReport(updated);
        setPaymentReport(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const addSelected = () => addSelectedEmployee(loans.loanRecords);
  const handleOpenEmployeePicker = () => void openEmployeePicker(async () => { await loans.loadOutstandingLoans(); });
  const handleAddAll = () => void addAllEmployees((period) => loans.loadOutstandingLoans({ employerId: selectedEmployer!.id, reportPeriod: period, forLoanEntry: true, forReportEntry: true }));
  const handleAddPrevious = () => void addPreviousEntries(
    (period) => loans.loadOutstandingLoans({ employerId: selectedEmployer!.id, reportPeriod: period, forLoanEntry: true, forReportEntry: true }),
    async () => { await refreshSssRecords(); },
  );

  if (!selectedEmployerId) {
    return (
      <main className="benefit-report-page min-h-[calc(100dvh-8rem)] overflow-x-clip p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="SSS Reports"
          subtitle="Monitor SSS employer contributions and loan payments."
          leadingContent={<BackButton fallbackHref="/reports" label="Back to Reports dashboard" />}
        />
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Select an employer</h2>
          <p className="mt-1 text-sm text-slate-600">Choose an employer from the Reports dashboard before opening SSS reports.</p>
          <Link href="/reports" className="mt-4 inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800">Choose employer</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="benefit-report-page min-h-[calc(100dvh-8rem)] overflow-x-clip p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="SSS Reports"
        subtitle="Monitor SSS employer contributions and loan payments."
        leadingContent={<BackButton fallbackHref={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} label="Back to Reports dashboard" />}
      />
      <div className="mx-auto w-full max-w-none space-y-3">
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <section className="benefit-report-panel flex h-[calc(100dvh-15rem)] flex-col">
          <ReportsPanelHeading
            kind={kind}
            employerName={currentEmployer?.name ?? null}
            employerSss={currentEmployer?.sss ?? null}
            visibleReportDrafts={visibleReportDrafts}
            draftMenuOpen={draftMenuOpen}
            setDraftMenuOpen={setDraftMenuOpen}
            employers={employers}
            saving={saving}
            onResumeDraft={(savedDraft) => void resumeReportDraft(savedDraft)}
            onDeleteDraft={(savedDraft) => void deleteReportDraft(savedDraft)}
            onOpenContributionTable={() => loans.setContributionTableOpen(true)}
            onOpenLoans={() => loans.openLoans(Boolean(currentEmployer))}
          />
          <ReportsToolbar
            search={search}
            setSearch={setSearch}
            years={years}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            refreshingRecords={refreshingRecords}
            onResetFilters={() => void resetFiltersAndRefresh()}
            onCreate={openCreate}
          />
          <AnnualReportsTable
            annualReports={annualReports}
            yearFilter={yearFilter}
            currentYear={currentYear}
            loading={loading}
            canEditPayments={canEditPayments}
            onViewReport={setViewReport}
            onAddPayment={openPaymentForm}
            onEditReport={(report) => { openReportEdit(report); resetDraftId(); }}
            onDeleteReport={setDeleteReportTarget}
            reportMenu={reportMenu}
          />
        </section>
      </div>

      {createOpen && <CreateReportModal kind={kind} editReport={editReport} preview={preview} onClose={() => void closeCreate()} footer={
        <CreateReportDialogFooter
          kind={kind}
          editReport={editReport}
          preview={preview}
          saving={saving}
          isTally={isTally}
          draftId={draftId}
          prnTrimmed={Boolean(draft.prn.trim())}
          onOpenContributionTable={() => loans.setContributionTableOpen(true)}
          onClose={() => void closeCreate()}
          onSaveDraft={() => void saveReportDraft()}
          onBackToEdit={() => setPreview(false)}
          onSaveReport={() => void saveReport()}
          onStartPreview={() => setPreview(true)}
        />
      }>
        {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {draftSaveStatus !== "idle" && <p role="status" className="mb-4 text-xs font-medium text-slate-500">{draftSaveStatus === "saving" ? "Saving draft..." : "Draft saved automatically."}</p>}
        {!preview ? <>
          <ReportFields
            kind={kind}
            editReport={editReport}
            employers={employers}
            draft={draft}
            setDraft={setDraft}
            existingLoanReportMonths={existingLoanReportMonths}
            currentYear={currentYear}
            clearError={() => setError("")}
            clearEntries={() => setEntries([])}
          />
          <EmployeeEntriesSection
            kind={kind}
            draft={draft}
            entries={entries}
            employeeTotal={employeeTotal}
            calculatedTotal={calculatedTotal}
            amountDue={String(amountDue)}
            isTally={isTally}
            hasUnconfiguredEntries={hasUnconfiguredEntries}
            hasLegacyLoanEntries={hasLegacyLoanEntries}
            loadingEmployerEmployees={loadingEmployerEmployees}
            loadingPreviousEntries={loadingPreviousEntries}
            hasEmployer={Boolean(selectedEmployer)}
            setRangePickerTarget={setRangePickerTarget}
            updateLoanEntry={updateLoanEntry}
            removeEntry={removeEntry}
            onAddPrevious={handleAddPrevious}
            onAddAll={handleAddAll}
            onOpenEmployeePicker={handleOpenEmployeePicker}
            onOpenContributionTable={() => loans.setContributionTableOpen(true)}
          />
        </> : <ReportPreview kind={kind} employer={selectedEmployer} draft={draft} entries={entries} year={Number(draft.year)} />}
      </CreateReportModal>}

      {pickerOpen && <EmployeeEntryPicker
        kind={kind}
        onClose={() => setPickerOpen(false)}
        employeeSssSearch={employeeSssSearch}
        setEmployeeSssSearch={setEmployeeSssSearch}
        loanEntrySearch={loanEntrySearch}
        setLoanEntrySearch={setLoanEntrySearch}
        filteredContributionEmployees={filteredContributionEmployees}
        chosenEmployeeIds={chosenEmployeeIds}
        selectedEmployeeId={selectedEmployeeId}
        selectEmployeeForContribution={selectEmployeeForContribution}
        selectedContributionEmployee={selectedContributionEmployee}
        employeeDropdownOpen={employeeDropdownOpen}
        setEmployeeDropdownOpen={setEmployeeDropdownOpen}
        loadingEmployerEmployees={loadingEmployerEmployees}
        selectedMsc={selectedMsc}
        setSelectedMsc={setSelectedMsc}
        setRangePickerTarget={setRangePickerTarget}
        availableLoanEntries={availableLoanEntries(loans.loanRecords)}
        loadingLoans={loans.loadingLoans}
        selectedLoanIds={selectedLoanIds}
        setSelectedLoanIds={setSelectedLoanIds}
        addSelected={addSelected}
      />}

      {rangePickerTarget !== null && <CompensationRangePicker employeeName={compensationEmployeeName} onClose={() => setRangePickerTarget(null)} onSelect={selectContributionRange} year={Number(draft.year)} />}

      {loans.contributionTableOpen && <ContributionTableDialog onClose={() => loans.setContributionTableOpen(false)} year={Number(draft.year)} />}

      {loans.activeLoanReport && <LoanReportDialog
        activeLoanReport={loans.activeLoanReport}
        filteredLoans={filteredActiveLoanReportLoans}
        activeLoanReportFilter={loans.activeLoanReportFilter}
        setActiveLoanReportFilter={loans.setActiveLoanReportFilter}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onClose={() => { loans.setActiveLoanReport(null); loans.setLoansOpen(true); }}
      />}

      {loans.loansOpen && <LoanListDialog
        loans={filteredLoanRecords}
        loanListSearch={loans.loanListSearch}
        setLoanListSearch={loans.setLoanListSearch}
        loanAccountFilter={loans.loanAccountFilter}
        setLoanAccountFilter={loans.setLoanAccountFilter}
        loanListStatus={loans.loanListStatus}
        setLoanListStatus={loans.setLoanListStatus}
        loanListError={loans.loanListError}
        loadingLoans={loans.loadingLoans}
        canManageLoans={loans.canManageLoans}
        kind={kind}
        loadingActiveLoanReport={loans.loadingActiveLoanReport}
        loadingLoanEmployees={loans.loadingLoanEmployees}
        openActiveLoanReport={() => void loans.openActiveLoanReport(currentEmployer?.name || "")}
        openSssLoanForm={() => void loans.openSssLoanForm()}
        onLoanMenuAction={onLoanMenuAction}
        onClose={() => loans.setLoansOpen(false)}
        loanMenuOpenId={loanMenu.openId}
        loanMenuRef={loanMenu.ref}
      />}

      {loans.loanViewTarget && <LoanFormModal
        mode="view"
        employers={employers}
        loanForm={loans.loanForm}
        setLoanForm={loans.setLoanForm}
        loanEmployees={loans.loanEmployees}
        loadingLoanEmployees={loans.loadingLoanEmployees}
        loanFormError={loans.loanViewEditError}
        loanFormSaving={loans.loanViewEditSaving}
        loanEditStatus={loans.loanEditStatus}
        setLoanEditStatus={loans.setLoanEditStatus}
        onSubmit={onLoanViewEditSubmit}
        onClose={() => { if (!loans.loanViewEditSaving) { loans.setLoanViewTarget(null); loans.setLoanViewEditMode(false); } }}
        selectedLoanEmployee={loans.loanEmployees.find((employee) => String(employee.id) === loans.loanForm.employeeId) ?? null}
      />}

      {loans.loanEditTarget && <LoanFormModal
        mode="edit"
        employers={employers}
        loanForm={loans.loanForm}
        setLoanForm={loans.setLoanForm}
        loanEmployees={loans.loanEmployees}
        loadingLoanEmployees={loans.loadingLoanEmployees}
        loanFormError={loans.loanEditError}
        loanFormSaving={loans.loanEditSaving}
        loanEditStatus={loans.loanEditStatus}
        setLoanEditStatus={loans.setLoanEditStatus}
        onSubmit={onLoanEditSubmit}
        onClose={() => { if (!loans.loanEditSaving) { loans.setLoanEditTarget(null); loans.setLoansOpen(true); } }}
        selectedLoanEmployee={null}
      />}

      {loans.loanEntryOpen && <LoanFormModal
        mode="create"
        employers={employers}
        loanForm={loans.loanForm}
        setLoanForm={loans.setLoanForm}
        loanEmployees={loans.loanEmployees}
        loadingLoanEmployees={loans.loadingLoanEmployees}
        loanFormError={loans.loanFormError}
        loanFormSaving={loans.loanFormSaving}
        loanEditStatus={loans.loanEditStatus}
        setLoanEditStatus={loans.setLoanEditStatus}
        onSubmit={onLoanSubmit}
        onClose={() => { loans.setLoanEntryOpen(false); loans.setLoansOpen(true); }}
        selectedLoanEmployee={loans.loanEmployees.find((employee) => String(employee.id) === loans.loanForm.employeeId) ?? null}
      />}

      <LoanDeleteDialog
        target={loans.loanDeleteTarget}
        saving={loans.loanDeleteSaving}
        error={loans.loanListError}
        onCancel={() => { if (!loans.loanDeleteSaving) loans.setLoanDeleteTarget(null); }}
        onConfirm={onLoanDeleteConfirm}
      />

      <ReportDeleteDialog
        target={deleteReportTarget}
        saving={deleteReportSaving}
        error={error}
        onCancel={() => { if (!deleteReportSaving) setDeleteReportTarget(null); }}
        onConfirm={() => void onDeleteReportConfirm()}
      />

      {viewReport && <ViewReportModal report={viewReport} onClose={() => setViewReport(null)} />}

      {paymentReport && <PaymentDialogWrapper
        report={paymentReport}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        saving={saving}
        error={error}
        onSubmit={(event) => void savePayment(event)}
        onClose={() => setPaymentReport(null)}
      />}

      {notice && <div className="benefit-report-notice benefit-report-notice-success fixed inset-x-4 bottom-5 z-[100] mx-auto max-w-lg bg-white font-medium shadow-xl" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 font-semibold text-emerald-800 underline underline-offset-2">Dismiss</button></div>}
    </main>
  );
}
