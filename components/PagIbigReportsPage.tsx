"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, ChevronLeftIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getPagibigCreateEmployeeHref } from "@/lib/pagibigEmployeeWorkflow";
import { sortPagibigPreviewMembers } from "@/lib/pagibigReportPreview";
import { validPagibigYear } from "@/lib/pagibigYear";
import {
  AccountFormDialog,
  DeleteReportDialog,
  DraftsMenu,
  ManualReportsDialog,
  MembersTable,
  PaymentDialog,
  ReportDetails,
  ReportGenerationDialog,
  ReportsTable,
} from "@/components/pagibig-reports";
import { inputClass, memberAccountYear, monthNames } from "@/components/pagibig-reports/constants";
import { usePagibigAccountForm } from "@/components/pagibig-reports/usePagibigAccountForm";
import { usePagibigDrafts } from "@/components/pagibig-reports/usePagibigDrafts";
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

  const [allEmployees, setAllEmployees] = useState<Member[]>([]);
  const [allEmployeesError, setAllEmployeesError] = useState("");
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const [selectedReportEmployees, setSelectedReportEmployees] = useState<Member[]>([]);
  const reportEmployeeRosterLoadedRef = useRef(false);
  const previewRequestRef = useRef(0);
  const autoAddEmployeeRef = useRef("");

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

  const accountActions = usePagibigAccountActions({
    account, accountYear, reportYear, setReportFormOpen: (open) => setReportFormOpen(open),
  });
  const { openAddAccount, openEditAccount, closeAccountForm, openLoanEditor, saveLoanDetail, deleteLoanDetail, onSelectEmployeeForAccount } = accountActions;

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
  const newReportMenuRef = useRef<HTMLDivElement | null>(null);
  const [newReportMenuOpen, setNewReportMenuOpen] = useState(false);
  useDismissableMenu(newReportMenuRef, newReportMenuOpen, () => setNewReportMenuOpen(false));
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

  const loadReportEmployeeOptions = useCallback(async () => {
    setAllEmployeesLoading(true);
    setAllEmployeesError("");
    try {
      const response = await fetch("/api/reports/pagibig/employees", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employees");
      setAllEmployees(data.employees as Member[]);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load employees";
      setAllEmployeesError(message);
      setError(message);
    } finally {
      setAllEmployeesLoading(false);
      reportEmployeeRosterLoadedRef.current = true;
    }
  }, [setError]);

  const handleAddAccountRoster = useCallback((employeeId: string) => {
    setAllEmployeesError("");
    setAllEmployees([]);
    setAllEmployeesLoading(true);
    fetch("/api/reports/pagibig/employees", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employees");
        return data.employees as Member[];
      })
      .then((employees) => {
        setAllEmployees(employees);
        if (!employeeId) return;
        const employee = employees.find((item) => String(item.id) === employeeId);
        if (!employee) {
          setAccountError("The new employee could not be found. Refresh the employee list and try again.");
          return;
        }
        setAccountForm((current) => ({ ...current, employeeId, midNumber: employee.pagIbigNumber ?? "" }));
      })
      .catch((loadError: unknown) => {
        setAllEmployeesError(loadError instanceof Error ? loadError.message : "Unable to load employees");
      })
      .finally(() => {
        setAllEmployeesLoading(false);
        reportEmployeeRosterLoadedRef.current = true;
      });
  }, [setAccountError, setAccountForm]);

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
      if (!editingMember && !returnToReportPreview) {
        setSearch("");
        setMemberStatusFilter("ALL");
        setMemberPage(1);
      }
      setAccountFormOpen(false);
      setLoanEditorBackup(null);
      if (returnToReportPreview) {
        setReportFormOpen(true);
      } else {
        setSearch("");
        setMemberStatusFilter("ACTIVE");
        setMemberPage(1);
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

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-0 sm:p-2 lg:p-4 md:h-[calc(100dvh-7.75rem)]">
      <section className="benefit-report-header shrink-0 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">Benefits reports</p>
              <h1 className="benefit-report-title">{paymentsView ? "Payments" : "Employee List"}</h1>
              {reportEmployer?.id === Number(selectedEmployerId) && <p className="truncate text-sm font-semibold text-slate-700" title={`${reportEmployer.name} · ${reportEmployer.pagibigNumber || "-"}`}>{reportEmployer.name} · {reportEmployer.pagibigNumber || "-"}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {paymentsView ? (
              <Link href={`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}`} aria-current="page" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">Employees</Link>
            ) : (
              <Link href={`/reports/pagibig?view=payments&employerId=${encodeURIComponent(selectedEmployerId)}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">Payments</Link>
            )}
          </div>
        </div>

        <div className="benefit-report-toolbar mt-3 min-w-0 border-t border-slate-100 pt-3">
          {selectedEmployerId && (paymentsView ? (
            <>
              <div ref={newReportMenuOpen ? newReportMenuRef : null} className="relative">
                <button type="button" onClick={() => setNewReportMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={newReportMenuOpen} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />New</button>
                {newReportMenuOpen && (
                  <div role="menu" className="absolute left-0 z-20 mt-2 min-w-[9rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    <button type="button" role="menuitem" onClick={() => { setNewReportMenuOpen(false); void openReportForm([], true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><PlusIcon className="h-4 w-4" />Manual</button>
                    <button type="button" role="menuitem" onClick={() => { setNewReportMenuOpen(false); void openReportForm(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><PlusIcon className="h-4 w-4" />PIF</button>
                  </div>
                )}
              </div>
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1" role="tablist" aria-label="Pag-IBIG payment view">
                <button type="button" role="tab" aria-selected={reportView === "PIF"} onClick={() => { setReportView("PIF"); setReportPage(1); }} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${reportView === "PIF" ? "bg-violet-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>PIF</button>
                <button type="button" role="tab" aria-selected={reportView === "MANUAL"} onClick={() => { setReportView("MANUAL"); setReportPage(1); }} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${reportView === "MANUAL" ? "bg-violet-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>Manual</button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => openAddAccount("", handleAddAccountRoster)} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />Add</button>
          ))}
          <input id="pagibig-search" aria-label="Search Pag-IBIG records" value={search} onChange={(event) => { setSearch(event.target.value); if (!paymentsView) setMemberPage(1); }} placeholder={paymentsView ? "Search period or employee" : "Search employee, code, or MID"} className={`${inputClass} min-w-[14rem] flex-[2_1_16rem]`} />
          {paymentsView ? (
            <>
              <select id="pagibig-year" aria-label="Filter reports by year" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setReportPage(1); }} className={`${inputClass} flex-[0_0_8rem]`}>
                <option value="">All years</option>{view.years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <select id="pagibig-payment-status" aria-label="Filter reports by payment status" value={paymentStatusFilter} onChange={(event) => { const value = event.target.value; if (value === "ALL" || value === "PAID" || value === "UNPAID") setPaymentStatusFilter(value); setReportPage(1); }} className={`${inputClass} flex-[0_0_8rem]`}>
                <option value="ALL">All statuses</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option>
              </select>
            </>
          ) : (
            <select id="pagibig-member-status" aria-label="Filter employee accounts by status" value={memberStatusFilter} onChange={(event) => {
              const status = event.target.value;
              if (status === "ALL" || status === "ACTIVE" || status === "INACTIVE") setMemberStatusFilter(status);
              setMemberPage(1);
            }} className={`${inputClass} flex-[0_0_10rem]`}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          )}
          <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
          {selectedEmployerId && paymentsView && <DraftsMenu open={draftsOpen} drafts={reportDrafts} onToggle={() => setDraftsOpen((open) => !open)} onResume={(draft) => void resumeReportDraft(draft)} onDelete={(draft) => void deleteReportDraft(draft)} />}
        </div>
      </section>

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
          if (!reportEmployeeRosterLoadedRef.current && !allEmployeesLoading && !allEmployeesError) void loadReportEmployeeOptions();
          setReportEmployeePickerOpen((current) => !current);
        }}
        onAddEmployee={(employeeId) => void addReportEmployee(employeeId)}
        onSaveDraft={() => void saveReportDraft()}
        onGenerateReport={() => void generateReport()}
        onEditAccount={(member, fromPreview) => openEditAccount(member, fromPreview)}
        onRemoveEmployee={removeReportEmployee}
      />

      {selectedReport && <ReportDetails report={selectedReport} onClose={() => { setSelectedReport(null); if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); } }} onPayment={(paidReport) => { setSelectedReport(null); if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); } openPayment(paidReport); }} employerAddress={reportEmployer?.address ?? null} />}

      {selectedManualReports && <ManualReportsDialog reports={selectedManualReports} canEditPayments={canEditPayments} onClose={() => setSelectedManualReports(null)} onViewDetails={(report) => { setManualViewReturnReports(selectedManualReports); setSelectedManualReports(null); setSelectedReport(report); }} onOpenPayment={(report) => { setSelectedManualReports(null); openPayment(report); }} />}

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
