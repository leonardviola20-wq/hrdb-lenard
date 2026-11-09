"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent as ReactFormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowPathIcon, BanknotesIcon, ChevronLeftIcon, EllipsisVerticalIcon, EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { getSssLoanReportCategory, parseSssLoanDateFromApi } from "@/lib/sssLoanBalance";
import { useSssReportData, useSssDraftPersistence } from "./sss-reports/useSssReportData";
import { useSssLoanManagement } from "./sss-reports/useSssLoanManagement";
import { useSssReportForm } from "./sss-reports/useSssReportForm";
import { Modal } from "./sss-reports/Modal";
import { CompensationRangePicker } from "./sss-reports/CompensationRangePicker";
import { AmountDueInput, Field } from "./sss-reports/SmallComponents";
import { inputClass } from "./sss-reports/constants";
import { dateOnly, formatMoney, monthNames } from "./sss-reports/format";
import { DraftsMenu, EntriesTable, ReportPreview, ReportSavedView, ReportMetaLine } from "./sss-reports/ReportsTables";
import { EmployeeEntryPicker } from "./sss-reports/EmployeeEntryPicker";
import { LoanReportDialog, LoanListDialog, LoanFormModal, LoanDeleteDialog } from "./sss-reports/LoanDialogs";
import { ReportDeleteDialog, PaymentDialog, ContributionTableDialog } from "./sss-reports/ReportDialogs";
import type { PaymentFormState, Report, SssLoan, SssReportDraft } from "./sss-reports/types";

export default function SssReportsPage() {
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
  const draftIdRef = useRef<number | null>(null);
  draftIdRef.current = draftId;

  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [deleteReportSaving, setDeleteReportSaving] = useState(false);
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({ amountPaid: "", paymentType: "", payDate: "", sssBranch: "", transactionReference: "" });
  const [saving, setSaving] = useState(false);
  const [loanMenuOpen, setLoanMenuOpen] = useState<number | null>(null);
  const [draftMenuOpen, setDraftMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const loanMenuRef = useRef<HTMLDivElement>(null);
  const currentEmployer = employers.find((employer) => String(employer.id) === selectedEmployerId) ?? null;

  useEffect(() => {
    if (!loanMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !loanMenuRef.current?.contains(event.target)) setLoanMenuOpen(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoanMenuOpen(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [loanMenuOpen]);

  useEffect(() => {
    if (!createOpen || editReport || saving || !draft.prn.trim() || (!entries.length && !draft.employerId && !draft.prn && !draft.amountDue)) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setDraftSaveStatus("saving");
      draftSaveQueueRef.current = draftSaveQueueRef.current.then(async () => {
        try {
          await persistReportDraft(false);
          if (!cancelled) setDraftSaveStatus("saved");
        } catch (saveError) {
          if (!cancelled) {
            setDraftSaveStatus("idle");
            setError(saveError instanceof Error ? saveError.message : "Unable to save SSS report draft");
          }
        }
      });
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [createOpen, draft, editReport, entries, persistReportDraft, saving, draftSaveQueueRef, setDraftSaveStatus, setError]);

  const filteredLoanRecords = loans.loanRecords.filter((loan) => {
    const needle = loans.loanListSearch.trim().toLocaleLowerCase();
    const accountNeedle = loans.loanAccountFilter.trim().toLocaleLowerCase();
    const matchesStatus = loans.loanListStatus === "ACTIVE" ? loan.status === "ACTIVE" : loan.status !== "ACTIVE";
    const matchesEmployer = String(loan.employerId) === selectedEmployerId;
    const matchesSearch = !needle || [loan.employeeName, loan.employeeSssNumber ?? ""].some((value) => value.toLocaleLowerCase().includes(needle));
    const matchesAccount = !accountNeedle || loan.loanAccountNumber.toLocaleLowerCase().includes(accountNeedle);
    return matchesStatus && matchesEmployer && matchesSearch && matchesAccount;
  });

  const filteredActiveLoanReportLoans = (() => {
    if (!loans.activeLoanReport) return [];
    const applicableDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    return loans.activeLoanReport.loans.filter((loan) => {
      const loanDate = parseSssLoanDateFromApi(loan.loanDate);
      if (!loanDate) return false;
      const category = getSssLoanReportCategory({
        status: loan.status,
        employeeId: loan.employeeId,
        employeeStatus: loan.employeeStatus ?? null,
        loanDate,
        loanType: loan.loanType,
      }, applicableDate);
      return loans.activeLoanReportFilter === "ALL" ? category !== null : category === loans.activeLoanReportFilter;
    });
  })();

  const openLoanMenuAction = (loan: SssLoan, action: "menu" | "view" | "update" | "delete") => {
    if (action === "menu") {
      setLoanMenuOpen(loanMenuOpen === loan.id ? null : loan.id);
      return;
    }
    setLoanMenuOpen(null);
    if (action === "view") loans.setLoanViewTarget(loan);
    else if (action === "update") loans.openLoanEdit(loan);
    else loans.setLoanDeleteTarget(loan);
  };

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setDeleteReportSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/sss/${deleteReportTarget.id}`, { method: "DELETE" });
      const responseText = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseText?.error || "Unable to delete SSS report");
      const deletedId = deleteReportTarget.id;
      setDeleteReportTarget(null);
      setViewReport((current) => (current?.id === deletedId ? null : current));
      setReports((current) => current.filter((report) => report.id !== deletedId));
      setNotice("SSS report deleted.");
      await refreshSssRecords();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS report");
    } finally {
      setDeleteReportSaving(false);
    }
  };

  const resumeReportDraft = async (savedDraft: SssReportDraft) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/sss/drafts/${savedDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "continue" }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to continue this SSS report draft");
      removeDraft(savedDraft.id);
      setDraftMenuOpen(false);
    } catch (resumeError) {
      setError(resumeError instanceof Error ? resumeError.message : "Unable to continue this SSS report draft");
      setSaving(false);
      return;
    }
    const routeParams = new URLSearchParams(searchParams.toString());
    if (savedDraft.employerId) routeParams.set("employerId", String(savedDraft.employerId));
    const routeQuery = routeParams.toString();
    router.replace(`${pathname}${routeQuery ? `?${routeQuery}` : ""}`, { scroll: false });
    resetDraftId();
    setDraftIdDirect(savedDraft.id);
    setDraft({
      employerId: savedDraft.employerId ? String(savedDraft.employerId) : "",
      prn: savedDraft.prn,
      month: String(savedDraft.applicableMonth),
      year: String(savedDraft.applicableYear),
      amountDue: savedDraft.amountDue,
    });
    setEntries(savedDraft.entries);
    setPreview(false);
    setPickerOpen(false);
    setError("");
    setCreateOpen(true);
    setSaving(false);
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
    const hasDraftContent = draftIdRef.current !== null
      || Boolean(draft.employerId || draft.prn.trim() || draft.amountDue.trim() || entries.length)
      || Number(draft.month) !== currentMonth
      || Number(draft.year) !== currentYear;
    try {
      await draftSaveQueueRef.current;
      const shouldPersist = hasDraftContent && draft.prn.trim();
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
      if (!draft.prn.trim()) {
        setError("PRN (Payment Reference Number) is required before saving the draft.");
        return;
      }
      if (!draft.employerId) {
        setError("Employer is required before saving the draft.");
        return;
      }
      if (!draft.month || Number(draft.month) < 1 || Number(draft.month) > 12) {
        setError("Applicable Month is required before saving the draft.");
        return;
      }
      if (!draft.year || Number(draft.year) < 2023) {
        setError("Applicable Year is required before saving the draft.");
        return;
      }
      if (!draft.amountDue || !Number.isFinite(Number(draft.amountDue))) {
        setError("Amount Due is required before saving the draft.");
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
    if (!window.confirm("Delete this saved SSS report draft?")) return;
    try {
      const response = await fetch(`/api/reports/sss/drafts/${savedDraft.id}`, { method: "DELETE" });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to delete SSS report draft");
      removeDraft(savedDraft.id);
      await refreshSssRecords();
      setNotice("Draft deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS report draft");
    }
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
        setError(`A Loan report for ${monthNames[applicableMonth - 1]} ${applicableYear} already exists for ${employer.name}. Select another Applicable Month or edit the existing report.`);
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
        if (draftIdRef.current === null && draft.prn.trim()) await persistReportDraft(false);
      }
      const response = await fetch(editReport ? `/api/reports/sss/${editReport.id}` : "/api/reports/sss", {
        method: editReport ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editReport ? {} : { draftId: draftIdRef.current }),
          kind,
          employerId: employer.id,
          prn: draft.prn,
          applicableMonth: Number(draft.month),
          applicableYear: Number(draft.year),
          amountDue,
          entries: entries.map((entry) => ({ employeeId: entry.employeeId, sssLoanId: entry.sssLoanId, monthlySalaryCredit: entry.monthlySalaryCredit, loanAmount: entry.loanAmount })),
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to save report");
      await refreshSssRecords();
      window.dispatchEvent(new Event("hrdb-sss-records-updated"));
      setNotice(editReport ? "The SSS report was updated." : "The SSS report was saved. Payment details can be added after the payment is made.");
      setCreateOpen(false);
      resetReportDraft();
      resetDraftId();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save report");
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
    setError("");
    try {
      const response = await fetch(`/api/reports/sss/${paymentReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to save payment details");
      const updated = responseData.report as Report;
      await refreshSssRecords();
      window.dispatchEvent(new Event("hrdb-sss-records-updated"));
      setViewReport(updated);
      setPaymentReport(null);
      setNotice("Payment details saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSaving(false);
    }
  };

  const onLoanMenuAction = useCallback((loan: SssLoan, action: "menu" | "view" | "update" | "delete") => openLoanMenuAction(loan, action), [loans, loanMenuOpen]);
  const onLoanSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveSssLoan(event, setNotice);
  const onLoanEditSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveLoanEdit(event, setNotice);
  const onLoanViewEditSubmit = (event: ReactFormEvent<HTMLFormElement>) => void loans.saveLoanViewEdit(event, setNotice);
  const onLoanDeleteConfirm = () => void loans.deleteLoan(setNotice);
  const onDeleteReportConfirm = () => void deleteReport();

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
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Select an employer</h1>
          <p className="mt-1 text-sm text-slate-600">Choose an employer from the Reports dashboard before opening SSS reports.</p>
          <Link href="/reports" className="mt-4 inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800">Choose employer</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="benefit-report-page min-h-[calc(100dvh-8rem)] overflow-x-clip p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-none space-y-3">
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <section className="benefit-report-panel flex h-[calc(100dvh-10rem)] flex-col">
          <div className="benefit-report-section-heading gap-3 sm:px-5">
            <div className="flex-1">
              <h2 className="benefit-report-title">{kind === "CONTRIBUTION" ? "Contribution Reports" : "Loan Reports"}</h2>
              {currentEmployer && <p className="text-xs text-slate-600">{currentEmployer.name} · {currentEmployer.sss || "—"}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DraftsMenu
                visibleReportDrafts={visibleReportDrafts}
                draftMenuOpen={draftMenuOpen}
                setDraftMenuOpen={setDraftMenuOpen}
                kind={kind}
                employers={employers}
                saving={saving}
                resumeReportDraft={(savedDraft) => void resumeReportDraft(savedDraft)}
                deleteReportDraft={(savedDraft) => void deleteReportDraft(savedDraft)}
              />
              {kind === "CONTRIBUTION"
                ? <button type="button" onClick={() => loans.setContributionTableOpen(true)} className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">SSS Table</button>
                : <button type="button" onClick={() => loans.openLoans(Boolean(currentEmployer))} title="View or add employee SSS loans" className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">View Loans</button>}
            </div>
          </div>
          <div className="benefit-report-toolbar border-b border-slate-200 px-4 py-3 sm:px-5">
            <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports dashboard" title="Back to Reports dashboard" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronLeftIcon className="h-4 w-4" /></Link>
            <button type="button" onClick={openCreate} className="benefit-report-primary"><PlusIcon className="h-4 w-4" /> Add</button>
            <div className="min-w-[180px] flex-1 basis-[260px]"><label htmlFor="sss-search" className="sr-only">Search PRN or employer</label><input id="sss-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PRN or employer..." className={inputClass} /></div>
            <button type="button" onClick={() => void resetFiltersAndRefresh()} disabled={refreshingRecords} aria-label="Reset filters and refresh SSS reports" title="Reset filters and refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"><ArrowPathIcon className={`h-4 w-4 ${refreshingRecords ? "animate-spin" : ""}`} /></button>
            <label htmlFor="sss-year-filter" className="sr-only">Filter by year</label>
            <select id="sss-year-filter" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={`${inputClass} min-w-[140px] flex-1 sm:flex-none sm:w-[150px]`}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="benefit-report-table min-w-[880px] w-full table-fixed text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]"><tr><th className="w-[14%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Period</th><th className="w-[18%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">PRN</th><th className="w-[5%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Emp</th><th className="w-[15%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Due</th><th className="w-[10%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Status</th><th className="w-[14%] whitespace-nowrap px-1.5 py-2 font-semibold sm:px-2 md:px-3">Pay Date</th><th className="w-[14%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Trans Ref#</th><th className="w-[10%] px-1.5 py-2 text-right font-semibold sm:px-2 md:px-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {annualReports.map((report, index) => {
                  if (!report) {
                    const selectedYear = yearFilter || String(currentYear);
                    return <tr key={`missing-${index}`} className="text-slate-400">
                      <td className="whitespace-nowrap px-1.5 py-1.5 sm:px-2 md:px-3">{monthNames[index]} {selectedYear}</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="whitespace-nowrap tabular-nums px-1.5 py-1.5 sm:px-2 md:px-3">0</td>
                      <td className="whitespace-nowrap tabular-nums px-1.5 py-1.5 sm:px-2 md:px-3">₱0.00</td>
                      <td className="px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="px-1.5 py-1.5 text-right sm:px-2 md:px-3">—</td>
                    </tr>;
                  }
                  return <tr key={report.id} className="text-slate-700 hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-1.5 py-1.5 sm:px-2 md:px-3">{monthNames[report.applicableMonth - 1]} {report.applicableYear}</td><td className="px-1.5 py-1.5 sm:px-2 md:px-3"><span className="block break-all font-mono text-xs">{report.prn}</span></td><td className="whitespace-nowrap tabular-nums px-1.5 py-1.5 sm:px-2 md:px-3">{report.entries.length}</td><td className="whitespace-nowrap tabular-nums px-1.5 py-1.5 font-semibold sm:px-2 md:px-3">{formatMoney(report.amountDue)}</td>
                    <td className="whitespace-nowrap px-1.5 py-1.5 sm:px-2 md:px-3"><span className={`rounded-full px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:text-xs ${report.amountPaid ? Number(report.amountPaid) >= Number(report.amountDue) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{report.amountPaid ? Number(report.amountPaid) >= Number(report.amountDue) ? "Paid" : "Partial" : "Unpaid"}</span></td>
                    <td className="whitespace-nowrap tabular-nums px-1.5 py-1.5 sm:px-2 md:px-3">{dateOnly(report.payDate)}</td><td className="break-all px-1.5 py-1.5 font-mono text-xs sm:px-2 md:px-3">{report.transactionReference || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right sm:px-2 md:px-3"><div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <button type="button" onClick={() => setViewReport(report)} aria-label={`View ${report.employerName} report`} title="View report and payment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"><EyeIcon className="h-4 w-4" /></button>
                      {canEditPayments ? (
                        <div ref={reportMenuOpen === report.id ? reportMenuRef : null} className="relative">
                          <button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} aria-label={`Actions for ${report.employerName} report`} title="Report actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"><EllipsisVerticalIcon className="h-4 w-4" /></button>
                          {reportMenuOpen === report.id && <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                            <button type="button" onClick={() => { setReportMenuOpen(null); openPaymentForm(report); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{report.amountPaid ? "Edit payment" : "Add payment"}</button>
                            <button type="button" onClick={() => { setReportMenuOpen(null); openReportEdit(report); resetDraftId(); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit report</button>
                            <button type="button" onClick={() => { setReportMenuOpen(null); setDeleteReportTarget(report); }} className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50">Delete report</button>
                          </div>}
                        </div>
                      ) : !report.amountPaid && (
                        <button type="button" onClick={() => openPaymentForm(report)} aria-label={`Add payment for ${report.employerName}`} title="Add payment" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" /></button>
                      )}
                    </div></td>
                  </tr>;
                })}
                {loading && <tr><td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-500">Loading SSS reports…</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {createOpen && <Modal title={preview ? "Review SSS Report" : editReport ? "Edit SSS Report" : `Generate ${kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report`} subtitle={preview ? "Check the totals and employer details before saving." : editReport ? "Correct the report information and employee breakdown." : "Build the report first. Payment details are recorded after payment."} onClose={() => void closeCreate()} wide fullHeight footer={
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
          <button type="button" onClick={() => loans.setContributionTableOpen(true)} className="text-xs font-semibold text-blue-700 hover:underline">Contribution table · Effective Jan 2025</button>
          <div className="ml-auto flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void closeCreate()} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>{!editReport && <button type="button" disabled={saving || !draft.prn.trim()} onClick={() => void saveReportDraft()} className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">{draftId ? "Update Draft" : "Save Draft"}</button>}{preview ? <><button type="button" onClick={() => setPreview(false)} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Back to edit</button><button type="button" disabled={!isTally || saving} onClick={() => void saveReport()} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? (editReport ? "Updating..." : "Saving...") : (editReport ? "Update Report" : "Save Report")}</button></> : <button type="button" disabled={!isTally} onClick={() => setPreview(true)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{editReport ? "Review Changes" : "Generate Report"}</button>}</div>
        </div>
      }>
        {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {draftSaveStatus !== "idle" && <p role="status" className="mb-4 text-xs font-medium text-slate-500">{draftSaveStatus === "saving" ? "Saving draft..." : "Draft saved automatically."}</p>}
        {!preview ? <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Employer" required><select required value={draft.employerId} onChange={(event) => { setDraft((current) => ({ ...current, employerId: event.target.value })); setError(""); if (!editReport) setEntries([]); }} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}</select></Field>
            <Field label="PRN (Payment Reference Number)" required><input required value={draft.prn} onChange={(event) => setDraft((current) => ({ ...current, prn: event.target.value }))} className={inputClass} placeholder="Enter PRN" /></Field>
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3 lg:col-span-3">
              <Field label="Applicable Month" required><select value={draft.month} onChange={(event) => { setDraft((current) => ({ ...current, month: event.target.value })); setError(""); }} className={inputClass}>{monthNames.map((month, index) => {
                const monthNumber = index + 1;
                const unavailable = !editReport && existingLoanReportMonths.has(monthNumber);
                return <option key={month} value={String(monthNumber)} disabled={unavailable}>{month}{unavailable ? " (Paid)" : ""}</option>;
              })}</select>{kind === "LOAN" && !editReport && <p className="mt-1 text-xs text-slate-500">Months marked “Paid” are unavailable for this employer and year.</p>}</Field>
              <Field label="Applicable Year" required><select value={draft.year} onChange={(event) => { setDraft((current) => ({ ...current, year: event.target.value })); setError(""); }} className={inputClass}>{Array.from({ length: Math.max(1, currentYear - 2023 + 2) }, (_, index) => String(currentYear + 1 - index)).filter((year) => Number(year) >= 2023).map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
              <Field label="Amount Due" required><AmountDueInput value={draft.amountDue} onChange={(value) => setDraft((current) => ({ ...current, amountDue: value }))} /></Field>
            </div>
          </div>

          <section className="mt-5 flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div><h3 className="text-sm font-bold text-slate-800">Employee Entries</h3><p className="mt-0.5 text-xs text-slate-500">{kind === "CONTRIBUTION" ? "Add employees of any status from the full database." : "Add current-month active loan accounts for this employer. Past-due active accounts are available in Add Entry; future loans and inactive employees are excluded."}</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={handleAddPrevious} className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">{loadingPreviousEntries ? "Loading previous..." : "Add Prev"}</button><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={handleAddAll} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{loadingEmployerEmployees ? "Loading employees..." : "Add All"}</button><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={handleOpenEmployeePicker} className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" /> Add Entry</button></div>
            </div>
            {hasLegacyLoanEntries && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">This older draft has employee-only loan rows. Remove those rows, then re-add saved loan accounts to continue; account numbers are required for a new loan report.</p>}
            <EntriesTable
              kind={kind}
              draftYear={draft.year}
              entries={entries}
              employeeTotal={employeeTotal}
              updateLoanEntry={updateLoanEntry}
              removeEntry={removeEntry}
              setRangePickerTarget={setRangePickerTarget}
            />
            <div className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <button type="button" onClick={() => loans.setContributionTableOpen(true)} className="text-xs font-semibold text-blue-700 hover:underline">Open official contribution table</button>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700"><span>{kind === "LOAN" ? "Loan Accounts" : "Employees"}: <strong className="text-slate-950">{entries.length}</strong></span><span>Calculated total: <strong className="text-slate-950">{formatMoney(calculatedTotal)}</strong></span><span>Amount Due: <strong className="text-slate-950">{formatMoney(amountDue)}</strong></span><span className={`font-bold ${isTally ? "text-emerald-700" : "text-amber-700"}`}>{isTally ? "Totals tally" : hasUnconfiguredEntries ? "Complete every employee entry" : "Totals do not tally"}</span></div>
            </div>
          </section>
        </> : <ReportPreview kind={kind} employer={selectedEmployer} draft={draft} entries={entries} year={Number(draft.year)} />}
      </Modal>}

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
        loanMenuOpenId={loanMenuOpen}
        loanMenuRef={loanMenuRef}
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
        onConfirm={onDeleteReportConfirm}
      />

      {viewReport && <Modal title={`${viewReport.kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report`} subtitle={`${monthNames[viewReport.applicableMonth - 1]} ${viewReport.applicableYear} · PRN ${viewReport.prn}`} meta={<ReportMetaLine report={viewReport} />} onClose={() => setViewReport(null)} wide fullWidth footer={
        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <button type="button" onClick={() => setViewReport(null)} className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      }>
        <ReportSavedView report={viewReport} />
      </Modal>}

      {paymentReport && <PaymentDialog
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
