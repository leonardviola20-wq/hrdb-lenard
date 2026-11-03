"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, ChevronLeftIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getPagibigCreateEmployeeHref } from "@/lib/pagibigEmployeeWorkflow";
import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { AccountFormDialog } from "@/components/pagibig-reports/AccountFormDialog";
import { ReportDetails } from "@/components/pagibig-reports/ReportDetails";
import { MembersTable } from "@/components/pagibig-reports/MembersTable";
import { ReportsTable } from "@/components/pagibig-reports/ReportsTable";
import { DraftsMenu } from "@/components/pagibig-reports/DraftsMenu";
import { PaymentDialog } from "@/components/pagibig-reports/PaymentDialog";
import { ReportGenerationDialog } from "@/components/pagibig-reports/ReportGenerationDialog";
import { usePagibigReportData } from "@/components/pagibig-reports/usePagibigReportData";
import { usePagibigPayments } from "@/components/pagibig-reports/usePagibigPayments";
import { usePagibigDrafts } from "@/components/pagibig-reports/usePagibigDrafts";
import { usePagibigAccountForm } from "@/components/pagibig-reports/usePagibigAccountForm";
import { usePagibigReportForm } from "@/components/pagibig-reports/usePagibigReportForm";
import { useDismissableMenu } from "@/components/pagibig-reports/useDismissableMenu";
import {
  emptyAccountForm,
  emptyLoanDetail,
  formatMoney,
} from "@/components/pagibig-reports/format";
import { inputClass, memberAccountYear, monthNames } from "@/components/pagibig-reports/constants";
import type {
  Account,
  LoanDetail,
  Member,
  Report,
  ReportDraft,
} from "@/components/pagibig-reports/types";
import { mergePagibigPreviewMembers, sortPagibigPreviewMembers } from "@/lib/pagibigReportPreview";
import { validPagibigYear } from "@/lib/pagibigYear";
import { usePagibigReportView } from "@/components/pagibig-reports/usePagibigReportView";

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
  const [allEmployees, setAllEmployees] = useState<Member[]>([]);
  const [allEmployeesError, setAllEmployeesError] = useState("");
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [accountYear] = useState(String(requestedAccountYear ?? memberAccountYear));
  const {
    members,
    setMembers,
    reports,
    setReports,
    reportEmployer,
    canEditPayments,
    loading,
    loadedContext,
    refreshing,
    refreshKey,
    error,
    setError,
    requestRefresh,
  } = usePagibigReportData({ accountYear, paymentsView, selectedEmployerId });
  const {
    accountFormOpen,
    setAccountFormOpen,
    returnToReportPreview,
    setReturnToReportPreview,
    editingMember,
    setEditingMember,
    accountForm,
    setAccountForm,
    loanEditorType,
    setLoanEditorType,
    loanEditorDetail,
    setLoanEditorDetail,
    loanEditorReason,
    setLoanEditorReason,
    loanEditorSourceType,
    setLoanEditorSourceType,
    loanEditorBackup,
    setLoanEditorBackup,
    loanStatusFilter,
    setLoanStatusFilter,
    savingAccount,
    setSavingAccount,
    accountError,
    setAccountError,
    openLoanEditor,
    saveLoanDetail,
    deleteLoanDetail,
  } = usePagibigAccountForm();
  const {
    reportFormOpen,
    setReportFormOpen,
    previewMembers,
    setPreviewMembers,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,
    previewYear,
    setPreviewYear,
    previewFilter,
    setPreviewFilter,
    reportEmployeePickerOpen,
    setReportEmployeePickerOpen,
    reportEmployeeId,
    setReportEmployeeId,
    reportMonth,
    setReportMonth,
    reportYear,
    setReportYear,
    reportPin,
    setReportPin,
    manualReport,
    setManualReport,
    reportKind,
    setReportKind,
    updatingReportId,
    setUpdatingReportId,
    generating,
    generateReport: saveGeneratedReport,
  } = usePagibigReportForm();
  const [memberPage, setMemberPage] = useState(1);
  const [memberStatusFilter, setMemberStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [reportPage, setReportPage] = useState(1);
  const [selectedReportEmployees, setSelectedReportEmployees] = useState<Member[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [notice, error, setError]);
  const {
    reportDrafts,
    setReportDrafts,
    savingDraft,
    draftsOpen,
    setDraftsOpen,
    reportDraftId,
    setReportDraftId,
    saveReportDraft,
    deleteReportDraft,
  } = usePagibigDrafts({
    setError,
    setNotice,
    employerId: selectedEmployerId,
    paymentsView,
    refreshKey,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedManualReports, setSelectedManualReports] = useState<Report[] | null>(null);
  const [manualViewReturnReports, setManualViewReturnReports] = useState<Report[] | null>(null);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  const [newReportMenuOpen, setNewReportMenuOpen] = useState(false);
  const [viewReportMenuOpen, setViewReportMenuOpen] = useState(false);
  const viewReportMenuRef = useRef<HTMLDivElement | null>(null);
  const [reportView, setReportView] = useState<"PIF" | "MANUAL">("PIF");
  const newReportMenuRef = useRef<HTMLDivElement | null>(null);
  const previewRequestRef = useRef(0);
  const autoAddEmployeeRef = useRef("");
  const reportEmployeeRosterLoadedRef = useRef(false);

  const draftsMenuRef = useRef<HTMLDivElement | null>(null);

  useDismissableMenu(reportMenuRef, Boolean(reportMenuOpen), () => setReportMenuOpen(null));
  useDismissableMenu(newReportMenuRef, newReportMenuOpen, () => setNewReportMenuOpen(false));
  useDismissableMenu(viewReportMenuRef, viewReportMenuOpen, () => setViewReportMenuOpen(false));
  useDismissableMenu(draftsMenuRef, draftsOpen, () => setDraftsOpen(false));
  const {
    paymentReport,
    setPaymentReport,
    paymentForm,
    setPaymentForm,
    savingPayment,
    paymentError,
    deleteReportTarget,
    setDeleteReportTarget,
    deletingReport,
    openPayment,
    savePayment,
    deleteReport,
  } = usePagibigPayments({
    selectedEmployerId,
    setReports,
    setSelectedReport,
    setError,
    setNotice,
  });

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


  const {
    filteredMembers,
    memberPageCount,
    currentMemberPage,
    visibleMembers,
    memberFirstResult,
    memberLastResult,
    years,
    reportPageSize,
    reportPageCount,
    currentReportPage,
    pagedReports,
    displayedPagibigReports,
    memberTotals,
    memberSavingsTotal,
    memberOverallTotal,
    showSavingsColumns,
    showLoanColumns,
    previewColumnCount,
    filteredPreviewMembers,
    previewEntries,
    previewTotal,
    previewOverall,
  } = usePagibigReportView({
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

  const openAddAccount = useCallback((employeeId = "") => {
    setReturnToReportPreview(false);
    setEditingMember(null);
    setAccountForm({ ...emptyAccountForm(), employeeId, year: accountYear });
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanStatusFilter("ACTIVE");
    setAccountError("");
    setAllEmployeesError("");
    setAllEmployees([]);
    setAllEmployeesLoading(true);
    setAccountFormOpen(true);
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
  }, [
    accountYear,
    setAccountError,
    setAccountForm,
    setAccountFormOpen,
    setEditingMember,
    setLoanEditorDetail,
    setLoanEditorType,
    setLoanStatusFilter,
    setReturnToReportPreview,
  ]);

  useEffect(() => {
    if (paymentsView || !selectedEmployerId || !Number.isSafeInteger(requestedNewEmployeeId) || requestedNewEmployeeId <= 0
      || loading || loadedContext !== `${selectedEmployerId}:members:${accountYear}`) return;
    const key = `${selectedEmployerId}:${accountYear}:${requestedNewEmployeeId}`;
    if (autoAddEmployeeRef.current === key) return;
    autoAddEmployeeRef.current = key;
    router.replace(`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(accountYear)}`, { scroll: false });
    openAddAccount(String(requestedNewEmployeeId));
  }, [accountYear, loadedContext, loading, openAddAccount, paymentsView, requestedNewEmployeeId, router, selectedEmployerId]);

  const openEditAccount = (member: Member, fromReportPreview = false) => {
    setReturnToReportPreview(fromReportPreview);
    if (fromReportPreview) setReportFormOpen(false);
    const account = member.pagIbigAccount;
    setEditingMember(account ? member : null);
    setAccountError("");
    setAccountForm({
      employeeId: String(member.id),
      year: String(account?.year ?? (fromReportPreview ? reportYear : accountYear)),
      midNumber: member.pagIbigNumber ?? "",
      employeeSavings: account?.employeeSavings ?? "200",
      employerSavings: account?.employerSavings ?? "200",
      excludedFromReport: account?.excludedFromReport ?? false,
      mp2AccountNumber: account?.mp2AccountNumber ?? "",
      mp2Amount: account?.mp2Amount ?? "0",
      loanDetails: Object.fromEntries(PAGIBIG_LOAN_TYPES.map((type) => {
        const detail = account?.loanDetails[type];
        return [type, detail ? { ...detail, termYears: String(detail.termYears) } : emptyLoanDetail()];
      })) as Record<PagibigLoanType, LoanDetail>,
    });
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanStatusFilter("ACTIVE");
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    if (loanEditorBackup) {
      setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [loanEditorBackup.sourceType]: loanEditorBackup.detail } }));
    }
    setAccountFormOpen(false);
    setLoanEditorType(null);
    setLoanEditorSourceType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanEditorBackup(null);
    if (returnToReportPreview) setReportFormOpen(true);
    setReturnToReportPreview(false);
  };

  const loadReportEmployeeOptions = async () => {
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
  };

  const loadReportYearAccounts = async (
    year: string,
    retainedMembers = mergePagibigPreviewMembers(
      previewMembers.map((member) => ({ ...member, pagIbigAccount: null })),
      selectedReportEmployees,
    ),
  ) => {
    const requestId = ++previewRequestRef.current;
    const employerId = selectedEmployerId;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewYear("");
    setPreviewMembers(retainedMembers.map((member) => ({ ...member, pagIbigAccount: null })));
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(employerId)}&year=${encodeURIComponent(year)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employee Pag-IBIG accounts");
      if (requestId === previewRequestRef.current) {
        setPreviewMembers(mergePagibigPreviewMembers(data.employees as Member[], retainedMembers));
        setPreviewYear(year);
      }
    } catch (loadError) {
      if (requestId === previewRequestRef.current) {
        const message = loadError instanceof Error ? loadError.message : "Unable to load employee Pag-IBIG accounts";
        setPreviewError(message);
        setError(message);
      }
    } finally {
      if (requestId === previewRequestRef.current) setPreviewLoading(false);
    }
  };

  const openReportForm = async (initialEmployees: Member[] = [], manual = false) => {
    setError("");
    setNotice("");
    setReportDraftId(null);
    setUpdatingReportId(null);
    setReportFormOpen(true);
    setReportPin("");
    setManualReport(manual);
    setReportKind("CONTRIBUTION");
    setPreviewError("");
    setSelectedReportEmployees(initialEmployees);
    setPreviewMembers(initialEmployees);
    setReportEmployeeId("");
    setReportEmployeePickerOpen(false);
    // When in Payments view, seed the report year from the active year filter
    // so the employee preview loads for the selected year (e.g. 2025).
    const initialYear = paymentsView && yearFilter ? yearFilter : reportYear;
    setReportYear(initialYear);
    setPreviewYear(initialYear);
    // Default to the first month of the target year that does not already have a saved report.
    const monthsWithReports = new Set(reports.filter((report) => report.applicableYear === Number(initialYear)).map((report) => report.applicableMonth));
    if (monthsWithReports.has(Number(reportMonth))) {
      for (let m = 1; m <= 12; m++) {
        if (!monthsWithReports.has(m)) { setReportMonth(String(m)); break; }
      }
    }
  };

  const openUpdateReport = async (report: Report) => {
    setError("");
    setNotice("");
    setUpdatingReportId(report.id);
    setReportDraftId(null);
    setReportFormOpen(true);
    setReportPin(report.pin ?? "");
    setPreviewError("");
    setReportMonth(String(report.applicableMonth));
    setReportYear(String(report.applicableYear));
    setSelectedReportEmployees([]);
    setPreviewMembers([]);
    setReportEmployeeId("");
    setReportEmployeePickerOpen(false);
    await loadReportYearAccounts(String(report.applicableYear), []);
    const reportEmployeeIds = new Set(report.entries.map((entry) => entry.employeeId));
    setPreviewMembers((current) => current.filter((member) => reportEmployeeIds.has(member.id)));
    setSelectedReportEmployees((current) => current.filter((member) => reportEmployeeIds.has(member.id)));
    setPreviewYear(String(report.applicableYear));
    setPreviewFilter("ALL");
  };

  const addReportEmployee = async (employeeId: string = reportEmployeeId) => {
    const employee = allEmployees.find((item) => String(item.id) === employeeId);
    if (!employee || previewMembers.some((member) => member.id === employee.id)) return;
    setPreviewLoading(true);
    let account: Account | null = null;
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(reportYear)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        const yearEmployee = (data.employees as Member[]).find((item) => item.id === employee.id);
        account = yearEmployee?.pagIbigAccount ?? null;
        // If the account exists but is inactive, set it to active so the employee
        // is eligible for inclusion in generated reports.
        if (account && account.excludedFromReport && employee.pagIbigNumber) {
          const targetAccount = account;
          try {
            const updateResponse = await fetch("/api/reports/pagibig/members", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: String(employee.id),
                year: reportYear,
                midNumber: employee.pagIbigNumber,
                employeeSavings: targetAccount.employeeSavings,
                employerSavings: targetAccount.employerSavings,
                excludedFromReport: false,
                mp2AccountNumber: targetAccount.mp2AccountNumber ?? "",
                mp2Amount: targetAccount.mp2Amount,
                loanDetails: Object.fromEntries(
                  PAGIBIG_LOAN_TYPES.map((type) => {
                    const detail = targetAccount.loanDetails[type];
                    return [type, detail ? { ...detail, termYears: String(detail.termYears) } : emptyLoanDetail()];
                  })
                ) as Record<PagibigLoanType, LoanDetail>,
                employerId: Number(selectedEmployerId),
                isNewAccount: false,
              }),
            });
            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              account = updateData.account as Account;
            }
          } catch {
            // If setting the account to active fails, proceed with the account as-is.
          }
        }
      }
    } catch {
      // Fall back to adding the employee without a year account if the lookup fails.
    } finally {
      setPreviewLoading(false);
    }
    const restrictedAccount = manualReport && account ? (reportKind === "CONTRIBUTION"
      ? { ...account, calamityLoanAmount: "0", mplLoanAmount: "0", emergencyLoanAmount: "0", safeLoanAmount: "0" }
      : { ...account, employeeSavings: "0", employerSavings: "0", mp2Amount: "0" }) : account;
    const selectedEmployee: Member = { ...employee, pagIbigAccount: restrictedAccount };
    setSelectedReportEmployees((current) => mergePagibigPreviewMembers(current, [selectedEmployee]));
    setPreviewMembers((current) => mergePagibigPreviewMembers(current, [selectedEmployee]));
    setPreviewFilter("ALL");
    setReportEmployeeId("");
    setPreviewYear(reportYear);
  };


  const removeReportEmployee = (employeeId: number) => {
    setSelectedReportEmployees((current) => current.filter((member) => member.id !== employeeId));
    setPreviewMembers((current) => current.filter((member) => member.id !== employeeId));
  };


  const addAllReportEmployees = async () => {
    const targetYear = reportYear;
    if (!validPagibigYear(targetYear)) return;
    if (!reportFormOpen) await openReportForm([]);

    const currentMonth = Number(reportMonth);
    const currentYear = Number(targetYear);
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear -= 1;
    }

    let availableReports = reports;
    // Always refresh reports so Add All uses the same previous-month logic
    // regardless of view or user role.
    try {
      const reportsResponse = await
        fetch(`/api/reports/pagibig?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
      const reportsData = await reportsResponse.json();
      if (reportsResponse.ok && Array.isArray(reportsData.reports)) {
        availableReports = reportsData.reports as Report[];
        setReports(availableReports);
      }
    } catch {
      // Fall back to the currently loaded reports, if any.
    }

    const previousReport = availableReports.find((report) =>
      report.applicableMonth === previousMonth && report.applicableYear === previousYear);
    const previousEmployeeCodes = previousReport
      ? new Set(previousReport.entries.map((entry) => entry.employeeCode))
      : null;

    const requestId = ++previewRequestRef.current;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewYear("");
    setPreviewMembers([]);
    setSelectedReportEmployees([]);
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(targetYear)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employee Pag-IBIG accounts");
      if (requestId !== previewRequestRef.current) return;
      const yearEmployees = data.employees as Member[];
      let employeesToAdd = previousEmployeeCodes
        ? yearEmployees.filter((employee) => previousEmployeeCodes.has(employee.employeeCode))
        : yearEmployees;
      if (manualReport) {
        employeesToAdd = employeesToAdd.map((employee) => ({
          ...employee,
          pagIbigAccount: employee.pagIbigAccount ? (reportKind === "CONTRIBUTION"
            ? { ...employee.pagIbigAccount, calamityLoanAmount: "0", mplLoanAmount: "0", emergencyLoanAmount: "0", safeLoanAmount: "0" }
            : { ...employee.pagIbigAccount, employeeSavings: "0", employerSavings: "0", mp2Amount: "0" }) : null,
        }));
      }
      if (employeesToAdd.length === 0) {
        setPreviewError(previousReport
          ? `No matching employees found for ${monthNames[previousMonth - 1]} ${previousYear}.`
          : "No employees found for the selected year.");
        setError(previousReport
          ? `No matching employees found for ${monthNames[previousMonth - 1]} ${previousYear}.`
          : "No employees found for the selected year.");
        return;
      }
      setPreviewMembers(sortPagibigPreviewMembers(employeesToAdd));
      setSelectedReportEmployees(sortPagibigPreviewMembers(employeesToAdd));
      setPreviewYear(targetYear);
    } catch (loadError) {
      if (requestId === previewRequestRef.current) {
        const message = loadError instanceof Error ? loadError.message : "Unable to load employee Pag-IBIG accounts";
        setPreviewError(message);
        setError(message);
      }
    } finally {
      if (requestId === previewRequestRef.current) setPreviewLoading(false);
    }
    setPreviewFilter("ALL");
  };

  const resumeReportDraft = async (draft: ReportDraft) => {
    setDraftsOpen(false);
    setReportDraftId(draft.id);
    setReportMonth(String(draft.applicableMonth));
    setReportYear(String(draft.applicableYear));
    setReportPin(draft.pin);
    setReportKind(draft.kind === "LOAN" ? "LOAN" : "CONTRIBUTION");
    setReportFormOpen(true);
    setSelectedReportEmployees([]);
    setPreviewMembers([]);
    setReportEmployeeId("");
    setReportEmployeePickerOpen(false);
    // Do not auto-load the entire year roster when resuming a draft; employees
    // are added explicitly via Add All / Add Employee to avoid loading all accounts.
    setPreviewYear(String(draft.applicableYear));
  };

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
        setReturnToReportPreview(false);
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

  const handleGenerateReport = (event?: FormEvent<HTMLFormElement>) =>
    saveGeneratedReport(event, {
      employerId: selectedEmployerId,
      reportDraftId,
      setReports,
      setReportDrafts,
      setSelectedReport,
      setError,
      setNotice,
    });
  const reportEmployeeOptions = allEmployees.filter((employee) => !previewMembers.some((member) => member.id === employee.id));
  const createEmployeeHref = getPagibigCreateEmployeeHref(selectedEmployerId, accountYear);
  const handleReportYearChange = (year: string) => {
    setReportYear(year);
    previewRequestRef.current += 1;
    setPreviewLoading(false);
    setPreviewError("");
    setPreviewYear("");
    setPreviewMembers([]);
    setSelectedReportEmployees([]);
  };
  const toggleReportEmployeePicker = () => {
    if (!reportEmployeeRosterLoadedRef.current && !allEmployeesLoading && !allEmployeesError) {
      void loadReportEmployeeOptions();
    }
    setReportEmployeePickerOpen((current) => !current);
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
            <button type="button" onClick={() => openAddAccount()} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />Add</button>
          ))}
          <input id="pagibig-search" aria-label="Search Pag-IBIG records" value={search} onChange={(event) => { setSearch(event.target.value); if (!paymentsView) setMemberPage(1); }} placeholder={paymentsView ? "Search period or employee" : "Search employee, code, or MID"} className={`${inputClass} min-w-[14rem] flex-[2_1_16rem]`} />
          {!paymentsView ? (
            <>
              <select id="pagibig-member-status" aria-label="Filter employee accounts by status" value={memberStatusFilter} onChange={(event) => {
                const status = event.target.value;
                if (status === "ALL" || status === "ACTIVE" || status === "INACTIVE") setMemberStatusFilter(status);
                setMemberPage(1);
              }} className={`${inputClass} flex-[0_0_10rem]`}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </>
          ) : <>
            <select id="pagibig-year" aria-label="Filter reports by year" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setReportPage(1); }} className={`${inputClass} flex-[0_0_8rem]`}>
              <option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select id="pagibig-payment-status" aria-label="Filter reports by payment status" value={paymentStatusFilter} onChange={(event) => { const value = event.target.value; if (value === "ALL" || value === "PAID" || value === "UNPAID") setPaymentStatusFilter(value); setReportPage(1); }} className={`${inputClass} flex-[0_0_8rem]`}>
              <option value="ALL">All statuses</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option>

            </select>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
          </>}
          {!paymentsView && <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>}
          {selectedEmployerId && paymentsView && <DraftsMenu
            open={draftsOpen}
            drafts={reportDrafts}
            menuRef={draftsMenuRef}
            onToggle={() => setDraftsOpen((open) => !open)}
            onResume={(draft) => { void resumeReportDraft(draft); }}
            onDelete={(draft) => { void deleteReportDraft(draft); }}
          />}
        </div>
      </section>

      {!selectedEmployerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view Pag-IBIG records.</p>}
      {error && <div role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0 flex items-center gap-2"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0 rounded-md p-1 text-rose-800 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-600"><XMarkIcon className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}

      {selectedEmployerId && <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
      {loading || loadedContext !== `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}` ? <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700"><ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" /><p>Loading Pag-IBIG records...</p></div>
        : paymentsView ? (
          <ReportsTable
            displayedPagibigReports={displayedPagibigReports}
            pagedReports={pagedReports}
            reportPageSize={reportPageSize}
            currentReportPage={currentReportPage}
            reportPageCount={reportPageCount}
            canEditPayments={canEditPayments}
            reportMenuOpen={reportMenuOpen}
            setReportMenuOpen={setReportMenuOpen}
            reportMenuRef={reportMenuRef}
            openUpdateReport={openUpdateReport}
            setDeleteReportTarget={setDeleteReportTarget}
            openPayment={openPayment}
            onViewReport={(report) => {
              if (!report.manual) {
                setSelectedReport(report);
                return;
              }
              const siblings = reports
                .filter((item) => item.manual && item.employerId === report.employerId
                  && item.applicableMonth === report.applicableMonth && item.applicableYear === report.applicableYear)
                .sort((left, right) => (left.kind === "CONTRIBUTION" ? 0 : 1) - (right.kind === "CONTRIBUTION" ? 0 : 1));
              setSelectedManualReports(siblings.length ? siblings : [report]);
            }}
            setReportPage={setReportPage}
          />
        ) : (
          <MembersTable
            visibleMembers={visibleMembers}
            filteredMembers={filteredMembers}
            memberTotals={memberTotals}
            memberSavingsTotal={memberSavingsTotal}
            memberOverallTotal={memberOverallTotal}
            memberFirstResult={memberFirstResult}
            memberLastResult={memberLastResult}
            currentMemberPage={currentMemberPage}
            memberPageCount={memberPageCount}
            onPrevPage={() => setMemberPage(currentMemberPage - 1)}
            onNextPage={() => setMemberPage(currentMemberPage + 1)}
            onOpenAccount={openEditAccount}
          />
        )}
      </section>}

      <AccountFormDialog
        open={accountFormOpen}
        editingMember={editingMember}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        allEmployees={allEmployees}
        allEmployeesError={allEmployeesError}
        allEmployeesLoading={allEmployeesLoading}
        accountError={accountError}
        savingAccount={savingAccount}
        createEmployeeHref={createEmployeeHref}
        loanEditorType={loanEditorType}
        setLoanEditorType={setLoanEditorType}
        loanEditorDetail={loanEditorDetail}
        setLoanEditorDetail={setLoanEditorDetail}
        loanEditorReason={loanEditorReason}
        setLoanEditorReason={setLoanEditorReason}
        loanEditorSourceType={loanEditorSourceType}
        setLoanEditorSourceType={setLoanEditorSourceType}
        loanEditorBackup={loanEditorBackup}
        setLoanEditorBackup={setLoanEditorBackup}
        loanStatusFilter={loanStatusFilter}
        setLoanStatusFilter={setLoanStatusFilter}
        onClose={closeAccountForm}
        onSubmit={saveAccount}
        onSelectEmployee={(employeeId) => {
          const picked = allEmployees.find((employee) => String(employee.id) === employeeId);
          setAccountForm((current) => ({
            ...current,
            employeeId,
            midNumber: picked?.pagIbigNumber ?? current.midNumber,
            year: accountYear,
            excludedFromReport: false,
          }));
          setAccountError("");
        }}
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
          draftId: reportDraftId,
          updatingReportId,
          pickerOpen: reportEmployeePickerOpen,
          employeeId: reportEmployeeId,
        }}
        employer={reportEmployer}
        selectedEmployerId={selectedEmployerId}
        reports={reports}
        reportDrafts={reportDrafts}
        monthNames={monthNames}
        employees={{
          loading: allEmployeesLoading,
          error: allEmployeesError,
          options: reportEmployeeOptions,
        }}
        preview={{
          loading: previewLoading,
          error: previewError,
          year: previewYear,
          filter: previewFilter,
          filteredMembers: filteredPreviewMembers,
          entryCount: previewEntries.length,
          showSavingsColumns,
          showLoanColumns,
          columnCount: previewColumnCount,
          total: previewTotal,
          overall: previewOverall,
        }}
        savingDraft={savingDraft}
        generating={generating}
        onClose={() => {
          setUpdatingReportId(null);
          setReportFormOpen(false);
        }}
        onCancel={() => setReportFormOpen(false)}
        onSubmit={handleGenerateReport}
        onSetKind={setReportKind}
        onSetPin={setReportPin}
        onSetMonth={setReportMonth}
        onSetEmployeePickerOpen={setReportEmployeePickerOpen}
        onSetEmployeeId={setReportEmployeeId}
        onYearChange={handleReportYearChange}
        onAddAllEmployees={() => void addAllReportEmployees()}
        onToggleEmployeePicker={toggleReportEmployeePicker}
        onAddEmployee={(employeeId) => void addReportEmployee(employeeId)}
        onSaveDraft={() =>
          void saveReportDraft({
            reports,
            employerId: selectedEmployerId,
            month: reportMonth,
            year: reportYear,
            pin: reportPin,
            manual: manualReport,
            kind: reportKind,
          })
        }
        onGenerateReport={() => void handleGenerateReport()}
        onEditAccount={openEditAccount}
        onRemoveEmployee={removeReportEmployee}
      />
      {selectedReport && <ReportDetails report={selectedReport} onClose={() => { setSelectedReport(null); if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); } }} onPayment={(paidReport) => { setSelectedReport(null); if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); } openPayment(paidReport); }} employerAddress={reportEmployer?.address ?? null} />}
     {selectedManualReports && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
         <section className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
           <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
             <div>
               <h2 className="text-lg font-bold text-slate-900">Manual Reports - {monthNames[selectedManualReports[0].applicableMonth - 1]} {selectedManualReports[0].applicableYear}</h2>
               <p className="text-xs text-slate-600">{selectedManualReports[0].employerName}</p>
             </div>
             <button type="button" onClick={() => setSelectedManualReports(null)} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
           </header>
           <div className="max-h-[70vh] overflow-auto p-5 space-y-4">
             {selectedManualReports.map((report) => (
               <div key={report.id} className="rounded-xl border border-slate-200 p-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-base font-bold text-slate-900">{report.kind === 'CONTRIBUTION' ? 'Contribution' : 'Loan'} Manual Report</h3>
                   <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${report.amountPaid !== null && report.payDate !== null ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{report.amountPaid !== null && report.payDate !== null ? 'Paid' : 'Unpaid'}</span>
                 </div>
                 <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                   <p className="font-semibold text-slate-500">Invoice No.</p>
                   <p className="font-bold text-slate-900">{report.pin}</p>
                   <p className="font-semibold text-slate-500">Amount Due</p>
                   <p className="font-bold text-slate-900">{formatMoney(report.amountDue)}</p>
                   <p className="font-semibold text-slate-500">Members</p>
                   <p className="font-bold text-slate-900">{report.entries.length}</p>
                 </div>
                 <div className="mt-3 flex gap-2">
                   <button type="button" onClick={() => { setManualViewReturnReports(selectedManualReports); setSelectedManualReports(null); setSelectedReport(report); }} className="h-9 rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50">View Details</button>
{(!(report.amountPaid !== null && report.payDate !== null) || canEditPayments) &&                    <button type="button" onClick={() => { setSelectedManualReports(null); openPayment(report); }} className="h-9 rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800">{report.amountPaid !== null && report.payDate !== null ? 'Update Payment' : 'Record Payment'}</button>}
                 </div>
               </div>
             ))}
           </div>
           <footer className="flex justify-end border-t border-slate-200 px-5 py-4">
             <button type="button" onClick={() => setSelectedManualReports(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
           </footer>
         </section>
       </div>
     )}
      {deleteReportTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">Delete Pag-IBIG Report?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">Delete the report for <strong>{deleteReportTarget.employerName}</strong> covering <strong>{monthNames[deleteReportTarget.applicableMonth - 1]} {deleteReportTarget.applicableYear}</strong>? Its {deleteReportTarget.entries.length} employee {deleteReportTarget.entries.length === 1 ? "entry" : "entries"} and any recorded payment details will also be removed. This action cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteReportTarget(null)} disabled={deletingReport} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="button" onClick={() => void deleteReport()} disabled={deletingReport} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{deletingReport ? "Deleting..." : "Delete Report"}</button></div>
        </section>
      </div>}
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
