"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validPagibigYear } from "@/lib/pagibigYear";
import { getPagibigCreateEmployeeHref } from "@/lib/pagibigEmployeeWorkflow";
import { PagIbigReportsHeader } from '@/components/pagibig-reports/shared/ReportsHeader';
import { memberAccountYear } from '@/components/pagibig-reports/shared/constants';
import { usePagibigAccountForm } from '@/components/pagibig-reports/hooks/usePagibigAccountForm';
import { usePagibigDrafts } from '@/components/pagibig-reports/hooks/usePagibigDrafts';
import { usePagibigEmployeeRoster } from '@/components/pagibig-reports/hooks/usePagibigEmployeeRoster';
import { usePagibigPayments } from '@/components/pagibig-reports/hooks/usePagibigPayments';
import { usePagibigReportData } from '@/components/pagibig-reports/hooks/usePagibigReportData';
import { usePagibigReportForm } from '@/components/pagibig-reports/hooks/usePagibigReportForm';
import { usePagibigReportView } from '@/components/pagibig-reports/hooks/usePagibigReportView';
import { useDismissableMenu } from '@/components/pagibig-reports/shared/useDismissableMenu';
import { usePagibigAccountActions } from '@/components/pagibig-reports/hooks/usePagibigAccountActions';
import { usePagibigReportActions } from '@/components/pagibig-reports/hooks/usePagibigReportActions';
import { ReportNotices } from "@/components/pagibig-reports/page/ReportNotices";
import { ReportsDialogs } from "@/components/pagibig-reports/page/ReportsDialogs";
import { ReportsPanel } from "@/components/pagibig-reports/page/ReportsPanel";
import { useDeleteReport } from "@/components/pagibig-reports/page/useDeleteReport";
import { useReportDetailDrillThrough } from "@/components/pagibig-reports/page/useReportDetailDrillThrough";
import { useSaveAccount } from "@/components/pagibig-reports/page/useSaveAccount";
import type { ReportDraft } from '@/components/pagibig-reports/shared/types';

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

  const account = usePagibigAccountForm();
  const { accountFormOpen } = account.state;
  const { setAccountForm, setAccountError } = account;

  const form = usePagibigReportForm();
  const { reportFormOpen, previewMembers, previewFilter } = form.state;
  const { setReportFormOpen } = form;

  const drafts = usePagibigDrafts();
  const { reportDrafts, setReportDrafts, draftsOpen, setDraftsOpen, reportDraftId: currentDraftId } = drafts;

  const payments = usePagibigPayments(selectedEmployerId, setReports);
  const { deleteReportTarget, setDeleteReportTarget, openPayment } = payments;

  const roster = usePagibigEmployeeRoster({ onError: setError });
  const { allEmployees, setAllEmployees, allEmployeesError, clearRosterError, allEmployeesLoading, setAllEmployeesLoading, rosterLoadedRef } = roster;

  const accountActions = usePagibigAccountActions({
    account, accountYear, reportYear: form.state.reportYear, setReportFormOpen: (open) => setReportFormOpen(open),
  });
  const { openAddAccount, openEditAccount } = accountActions;

  const previewRequestRef = useRef(0);
  const [selectedReportEmployees, setSelectedReportEmployees] = useState<typeof allEmployees>([]);
  const reportActions = usePagibigReportActions({
    form, drafts, selectedEmployerId, paymentsView, yearFilter,
    reports, setReports, setError, setNotice,
    allEmployees, selectedReportEmployees, setSelectedReportEmployees, previewRequestRef,
  });
  const { openReportForm, openUpdateReport, resumeReportDraft, deleteReportDraft } = reportActions;

  const drillThrough = useReportDetailDrillThrough({ onPay: openPayment });
  const {
    selectedReport, selectedManualReports, setManualViewReturnReports,
    closeReportDetails, payFromDetails, closeManualReports, payFromManualReports, openReportDetails,
  } = drillThrough;

  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  useDismissableMenu(reportMenuRef, Boolean(reportMenuOpen), () => setReportMenuOpen(null));
  const draftsMenuRef = useRef<HTMLDivElement | null>(null);
  useDismissableMenu(draftsMenuRef, draftsOpen, () => setDraftsOpen(false));

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

  const dataReady = loading || loadedContext !== `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}`;

  const resetMemberFilters = (status: "ALL" | "ACTIVE") => {
    setSearch("");
    setMemberStatusFilter(status);
    setMemberPage(1);
  };

  const refresh = () => {
    setError("");
    setNotice("");
    if (paymentsView) {
      setSearch("");
      setYearFilter("");
      setPaymentStatusFilter("ALL");
      setReportPage(1);
    } else {
      resetMemberFilters("ALL");
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
    manualReport: form.state.manualReport,
    reportKind: form.state.reportKind,
    selectedEmployerId,
    reportEmployer,
  });

  /** Loads the roster and pre-selects the just-created employee in the account form. */
  const handleAddAccountRoster = (employeeId: string) => {
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
  };

  const autoAddEmployeeRef = useRef("");
  useEffect(() => {
    if (paymentsView || !selectedEmployerId || !Number.isSafeInteger(requestedNewEmployeeId) || requestedNewEmployeeId <= 0
      || loading || loadedContext !== `${selectedEmployerId}:members:${accountYear}`) return;
    const key = `${selectedEmployerId}:${accountYear}:${requestedNewEmployeeId}`;
    if (autoAddEmployeeRef.current === key) return;
    autoAddEmployeeRef.current = key;
    router.replace(`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(accountYear)}`, { scroll: false });
    openAddAccount(String(requestedNewEmployeeId), handleAddAccountRoster);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountYear, loadedContext, loading, paymentsView, requestedNewEmployeeId, selectedEmployerId]);

  const saveAccount = useSaveAccount({
    account, form, members, selectedEmployerId,
    setMembers, setError, setNotice, requestRefresh, resetMemberFilters,
  });

  const deleteReport = useDeleteReport({
    deleteReportTarget, setDeleteReportTarget, setReports,
    selectedReport: drillThrough.selectedReport,
    setSelectedReport: (report) => drillThrough.setSelectedReport(report),
    paymentReport: payments.paymentReport,
    setPaymentReport: payments.setPaymentReport,
    setError, setNotice,
  });

  const reportEmployeeOptions = allEmployees.filter((employee) => !previewMembers.some((member) => member.id === employee.id));
  const createEmployeeHref = getPagibigCreateEmployeeHref(selectedEmployerId, accountYear) ?? "";
  const closeReportForm = () => {
    form.setUpdatingReportId(null);
    setReportFormOpen(false);
  };
  const toggleEmployeePicker = () => {
    if (!rosterLoadedRef.current && !allEmployeesLoading && !allEmployeesError) void roster.loadReportEmployeeOptions();
    form.setReportEmployeePickerOpen((current) => !current);
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

      <ReportNotices
        selectedEmployerId={selectedEmployerId}
        error={error}
        notice={notice}
        onDismissError={() => setError("")}
        onDismissNotice={() => setNotice("")}
      />

      {selectedEmployerId && (
        <ReportsPanel
          paymentsView={paymentsView}
          dataReady={dataReady}
          view={view}
          canEditPayments={canEditPayments}
          reportMenuOpen={reportMenuOpen}
          setReportMenuOpen={setReportMenuOpen}
          reportMenuRef={reportMenuRef}
          openUpdateReport={(report) => void openUpdateReport(report)}
          setDeleteReportTarget={setDeleteReportTarget}
          openPayment={openPayment}
          drillThrough={{
            setManualReports: drillThrough.setSelectedManualReports,
            setSelectedReport: (report) => drillThrough.setSelectedReport(report),
            setManualViewReturnReports,
          }}
          setReportPage={setReportPage}
          setMemberPage={setMemberPage}
          openEditAccount={openEditAccount}
          openAddAccount={openAddAccount}
        />
      )}

      <ReportsDialogs
        account={account}
        accountActions={accountActions}
        accountFormOpen={accountFormOpen}
        accountError={account.state.accountError}
        savingAccount={account.state.savingAccount}
        allEmployees={allEmployees}
        allEmployeesError={allEmployeesError}
        allEmployeesLoading={allEmployeesLoading}
        createEmployeeHref={createEmployeeHref}
        onSaveAccount={saveAccount}
        form={form}
        reportActions={reportActions}
        employer={reportEmployer}
        selectedEmployerId={selectedEmployerId}
        reports={reports}
        reportDrafts={reportDrafts}
        reportEmployeeOptions={reportEmployeeOptions}
        savingDraft={drafts.savingDraft}
        currentDraftId={currentDraftId}
        closeReportForm={closeReportForm}
        onToggleEmployeePicker={toggleEmployeePicker}
        view={view}
        canEditPayments={canEditPayments}
        selectedReport={selectedReport}
        onCloseReportDetails={closeReportDetails}
        onPayFromDetails={payFromDetails}
        selectedManualReports={selectedManualReports}
        onCloseManualReports={closeManualReports}
        onViewManualReport={(report) => openReportDetails(report, selectedManualReports)}
        onPayFromManualReports={payFromManualReports}
        deleteReportTarget={deleteReportTarget}
        deletingReport={payments.deletingReport}
        onDeleteReport={() => void deleteReport()}
        onDeleteReportCancel={() => setDeleteReportTarget(null)}
        payments={payments}
        onClosePayment={() => payments.setPaymentReport(null)}
      />

    </main>
  );
}
