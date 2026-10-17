"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, BanknotesIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, EllipsisVerticalIcon, EyeIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, PrinterIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SSS_CONTRIBUTION_EFFECTIVE_DATE, SSS_CONTRIBUTION_TABLE, getSssContributionBracket } from "@/lib/sssContributionTable";
import { getSssLoanFirstAmortizationDate, getSssLoanReportCategory, getSssLoanStartDate, parseSssLoanDateFromApi, parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { getSssLoanStatusLabel, isSssLoanStatus, type SssLoanStatus } from "@/lib/sssLoanStatus";
import { getSssLoanTypeLabel, getSssLoanTypeListLabel, isSssLoanType, sssLoanTypes, type SssLoanType } from "@/lib/sssLoanTypes";

type PaymentKind = "CONTRIBUTION" | "LOAN";
type DraftSaveStatus = "idle" | "saving" | "saved";
type Employee = { id: number; employeeCode: string; firstName: string; middleName: string | null; lastName: string; sssNumber: string | null; biometricNo?: string | null; status: string | null; employerId?: number | null; employerName?: string | null };
type Employer = { id: number; name: string; shortAddress: string | null; longAddress: string | null; sss: string | null; employees: Employee[] };
type SssLoan = { id: number; employerId: number; employerName: string; employeeId: number | null; employeeName: string; employeeCode: string; employeeSssNumber: string | null; employeeEmployerId: number | null; employeeEmployerName: string | null; employeeStatus?: string | null; biometricNo: string; loanAccountNumber: string; transactionNumber: string | null; loanType: SssLoanType; loanDate: string; loanAmount: string | null; monthlyAmortization: string; outstandingBalance: string | null; monthlyPayment: string; status: SssLoanStatus; statusReason: string | null; reportTiming?: "DUE" | "OVERDUE" };
type ActiveLoanReport = { employerName: string; loans: SssLoan[] };
type DraftEntry = { employeeId: number; employeeCode: string; employeeName: string; employeeSssNumber: string | null; employeeEmployerId?: number | null; employeeEmployerName?: string | null; sssLoanId?: number | null; loanAccountNumber?: string | null; monthlySalaryCredit: number | null; loanAmount: string };
type SssReportDraft = { id: number; kind: PaymentKind; employerId: number | null; prn: string; applicableMonth: number; applicableYear: number; amountDue: string; entries: DraftEntry[]; updatedAt: string };
type SavedEntry = DraftEntry & { id: number; salaryRange: string | null; employeeSs: string; employerSs: string; employeeMpf: string; employerMpf: string; ec: string; loanAmount: string; totalAmount: string };
type Report = {
  id: number; kind: PaymentKind; employerId: number; employerName: string; employerAddress: string | null; employerSssNumber: string | null;
  prn: string; applicableMonth: number; applicableYear: number; amountDue: string; amountPaid: string | null; paymentType: string | null;
  payDate: string | null; sssBranch: string | null; transactionReference: string | null; createdAt: string;
  createdBy: number | null; creator: { name: string | null; email: string } | null; entries: SavedEntry[];
};

const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];
const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const formatMoney = (value: number | string | null | undefined) => `₱${(Number(value) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const employeeName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};
const reportEmployerLabel = (_entries: Pick<DraftEntry, "employeeEmployerName">[], selectedEmployer: string) => selectedEmployer;
const notifySssRecordsUpdated = () => window.dispatchEvent(new Event("hrdb-sss-records-updated"));
const monthEnd = (month: number, year: number) => new Date(Date.UTC(year, month, 0)).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const localDateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateOnly = (value: string | null) => value ? value.slice(0, 10) : "—";
const creatorLabel = (report: Pick<Report, "creator">) => report.creator?.name?.trim() || report.creator?.email || "Unknown";
const formatReportCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};
const loanFirstPaymentStart = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const loanDate = parseSssLoanDateFromApi(loan.loanDate);
  return loanDate ? getSssLoanStartDate(loanDate, loan.loanType) : null;
};
const formatLoanStartDate = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const startDate = loanFirstPaymentStart(loan);
  return startDate ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(startDate) : "—";
};
const loanStartDateClass = (loan: Pick<SssLoan, "loanDate" | "loanType">) => {
  const startDate = loanFirstPaymentStart(loan);
  if (!startDate) return "bg-slate-100 text-slate-600";
  const currentMonth = new Date();
  const isUrgent = startDate.getUTCFullYear() < currentMonth.getFullYear()
    || (startDate.getUTCFullYear() === currentMonth.getFullYear() && startDate.getUTCMonth() <= currentMonth.getMonth());
  return isUrgent ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800";
};
const loanReportEntryAmount = (loan: SssLoan) => {
  const scheduledPayment = Number(loan.monthlyPayment);
  return (scheduledPayment > 0 ? scheduledPayment : Number(loan.monthlyAmortization)).toFixed(2);
};
const formatAmountDue = (value: string) => {
  if (!value || !Number.isFinite(Number(value))) return "";
  return Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function SssReportsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employerIdParam = searchParams.get("employerId");
  const employerIdValue = Number(employerIdParam);
  const selectedEmployerId = Number.isSafeInteger(employerIdValue) && employerIdValue > 0 ? String(employerIdValue) : "";
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [reportDrafts, setReportDrafts] = useState<SssReportDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const kind: PaymentKind = searchParams.get("kind") === "LOAN" ? "LOAN" : "CONTRIBUTION";
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [refreshingRecords, setRefreshingRecords] = useState(false);
  const [contributionTableOpen, setContributionTableOpen] = useState(false);
  const [loansOpen, setLoansOpen] = useState(false);
  const [loanEntryOpen, setLoanEntryOpen] = useState(false);
  const [loanRecords, setLoanRecords] = useState<SssLoan[]>([]);
  const [loanEmployees, setLoanEmployees] = useState<Employee[]>([]);
  const [loadingLoanEmployees, setLoadingLoanEmployees] = useState(false);
  const [canManageLoans, setCanManageLoans] = useState(false);
  const [loanListSearch, setLoanListSearch] = useState("");
  const [loanAccountFilter, setLoanAccountFilter] = useState("");
  const [loanListStatus, setLoanListStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanListError, setLoanListError] = useState("");
  const [activeLoanReport, setActiveLoanReport] = useState<ActiveLoanReport | null>(null);
  const [activeLoanReportFilter, setActiveLoanReportFilter] = useState<"ALL" | "ACTIVE" | "UPCOMING" | "INACTIVE">("ACTIVE");
  const [loadingActiveLoanReport, setLoadingActiveLoanReport] = useState(false);
  const [loanViewTarget, setLoanViewTarget] = useState<SssLoan | null>(null);
  const [loanViewEditMode, setLoanViewEditMode] = useState(false);
  const [loanViewEditSaving, setLoanViewEditSaving] = useState(false);
  const [loanViewEditError, setLoanViewEditError] = useState("");
  const [loanEditTarget, setLoanEditTarget] = useState<SssLoan | null>(null);
  const [loanEditSaving, setLoanEditSaving] = useState(false);
  const [loanEditError, setLoanEditError] = useState("");
  const [loanDeleteTarget, setLoanDeleteTarget] = useState<SssLoan | null>(null);
  const [loanDeleteSaving, setLoanDeleteSaving] = useState(false);
  const [loanFormSaving, setLoanFormSaving] = useState(false);
  const [loanFormError, setLoanFormError] = useState("");
  const [loanForm, setLoanForm] = useState({ employerId: "", employeeId: "", loanAccountNumber: "", transactionNumber: "", loanType: "S" as SssLoanType, loanDate: localDateInputValue(new Date()), loanAmount: "", monthlyAmortization: "" });
  const [loanEditStatus, setLoanEditStatus] = useState({ status: "ACTIVE" as SssLoanStatus, reason: "" });
  const [draftMenuOpen, setDraftMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);
  const [loanEntrySearch, setLoanEntrySearch] = useState("");
  const [selectedMsc, setSelectedMsc] = useState("");
  const [employeeSssSearch, setEmployeeSssSearch] = useState("");
  const [contributionEmployees, setContributionEmployees] = useState<Employee[]>([]);
  const [loadingEmployerEmployees, setLoadingEmployerEmployees] = useState(false);
  const [loadingPreviousEntries, setLoadingPreviousEntries] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);
  const [rangePickerTarget, setRangePickerTarget] = useState<"new" | number | null>(null);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [deleteReportSaving, setDeleteReportSaving] = useState(false);
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amountPaid: "", paymentType: "", payDate: "", sssBranch: "", transactionReference: "" });
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const draftIdRef = useRef<number | null>(null);
  const draftSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const draftMenuRef = useRef<HTMLDivElement>(null);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [draft, setDraft] = useState({ employerId: "", prn: "", month: String(currentMonth), year: String(currentYear), amountDue: "" });
  const [entries, setEntries] = useState<DraftEntry[]>([]);

  const persistReportDraft = useCallback(async (release: boolean) => {
    const response = await fetch("/api/reports/sss/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draftIdRef.current,
        release,
        kind,
        employerId: Number(draft.employerId) || null,
        prn: draft.prn,
        applicableMonth: Number(draft.month),
        applicableYear: Number(draft.year),
        amountDue: draft.amountDue,
        entries,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save SSS report draft");
    const savedDraft = data.draft as SssReportDraft;
    draftIdRef.current = savedDraft.id;
    setDraftId(savedDraft.id);
    return savedDraft;
  }, [draft, entries, kind]);

  const loadReports = async () => {
    if (!selectedEmployerId) {
      setReports([]);
      setCanEditPayments(false);
      return;
    }
    const response = await fetch(`/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load SSS reports");
    setReports(data.reports as Report[]);
    setCanEditPayments(data.canEditPayments === true);
  };

  const loadReportDrafts = async () => {
    const response = await fetch(`/api/reports/sss/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load SSS report drafts");
    setReportDrafts(data.drafts as SssReportDraft[]);
  };

  const refreshSssRecords = async () => {
    await Promise.all([loadReports(), loadReportDrafts()]);
  };

  const resetFiltersAndRefresh = async () => {
    setYearFilter(String(currentYear));
    setSearch("");
    setRefreshingRecords(true);
    setError("");
    try {
      await refreshSssRecords();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh SSS reports");
    } finally {
      setRefreshingRecords(false);
    }
  };

  useEffect(() => {
    if (!draftMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !draftMenuRef.current?.contains(event.target)) setDraftMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraftMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [draftMenuOpen]);

  useEffect(() => {
    if (!reportMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !reportMenuRef.current?.contains(event.target)) setReportMenuOpen(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReportMenuOpen(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [reportMenuOpen]);

  useEffect(() => {
    if (!selectedEmployerId) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/reports/sss/employers", { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employers");
        return data.employers as Employer[];
      }),
      fetch(`/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load SSS reports");
        return { reports: data.reports as Report[], canEditPayments: data.canEditPayments === true };
      }),
      fetch(`/api/reports/sss/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load SSS report drafts");
        return data.drafts as SssReportDraft[];
      }),
    ]).then(([employerRows, reportResult, draftRows]) => {
      if (cancelled) return;
      setEmployers(employerRows);
      setReports(reportResult.reports);
      setCanEditPayments(reportResult.canEditPayments);
      setReportDrafts(draftRows);
      setError("");
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load SSS data");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEmployerId]);

  useEffect(() => {
    const hasDraftContent = draftIdRef.current !== null
      || Boolean(draft.employerId || draft.prn.trim() || draft.amountDue.trim() || entries.length)
      || Number(draft.month) !== currentMonth
      || Number(draft.year) !== currentYear;
    if (!createOpen || editReport || saving || !hasDraftContent) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setDraftSaveStatus("saving");
      const queuedSave = draftSaveQueueRef.current.then(async () => {
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
      draftSaveQueueRef.current = queuedSave;
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [createOpen, currentMonth, currentYear, draft, editReport, entries, persistReportDraft, saving]);

  const currentEmployer = employers.find((employer) => String(employer.id) === selectedEmployerId) ?? null;
  const selectedEmployer = employers.find((employer) => String(employer.id) === draft.employerId) ?? null;
  const existingLoanReportMonths = useMemo(() => {
    if (kind !== "LOAN" || !draft.employerId) return new Set<number>();
    return new Set(reports
      .filter((report) => report.kind === "LOAN"
        && report.employerId === Number(draft.employerId)
        && report.applicableYear === Number(draft.year))
      .map((report) => report.applicableMonth));
  }, [draft.employerId, draft.year, kind, reports]);
  const loanEmployer = employers.find((employer) => String(employer.id) === loanForm.employerId) ?? null;
  const selectedLoanEmployee = loanEmployees.find((employee) => String(employee.id) === loanForm.employeeId) ?? null;
  const visibleReportDrafts = reportDrafts.filter((savedDraft) => savedDraft.kind === kind && String(savedDraft.employerId) === selectedEmployerId);
  const availableLoanEntries = useMemo(() => {
    const needle = loanEntrySearch.trim().toLocaleLowerCase();
    return loanRecords.filter((loan) => loan.employeeId !== null
      && !entries.some((entry) => entry.sssLoanId === loan.id)
      && (!needle
        || loan.employeeName.toLocaleLowerCase().includes(needle)
        || (loan.employeeSssNumber ?? "").toLocaleLowerCase().includes(needle)
        || loan.loanAccountNumber.toLocaleLowerCase().includes(needle)));
  }, [entries, loanEntrySearch, loanRecords]);
  const years = useMemo(() => [...new Set([String(currentYear), ...reports.map((report) => String(report.applicableYear))])].sort((a, b) => b.localeCompare(a)), [reports, currentYear]);
  const annualReports = useMemo(() => {
    const selectedYear = yearFilter || String(currentYear);
    const yearReports = reports.filter((report) => report.kind === kind && String(report.employerId) === selectedEmployerId && String(report.applicableYear) === selectedYear);
    const monthlyMap = new Map(yearReports.map((report) => [report.applicableMonth, report]));
    const monthlyList: (Report | null)[] = [];
    for (let month = 1; month <= 12; month++) {
      monthlyList.push(monthlyMap.get(month) || null);
    }
    return monthlyList;
  }, [reports, kind, selectedEmployerId, yearFilter, currentYear]);
  const filteredLoanRecords = useMemo(() => {
    const needle = loanListSearch.trim().toLocaleLowerCase();
    const accountNeedle = loanAccountFilter.trim().toLocaleLowerCase();
    return loanRecords.filter((loan) => {
      const matchesStatus = loanListStatus === "ACTIVE" ? loan.status === "ACTIVE" : loan.status !== "ACTIVE";
      const matchesEmployer = String(loan.employerId) === selectedEmployerId;
      const matchesSearch = !needle || [loan.employeeName, loan.employeeSssNumber ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(needle));
      const matchesAccount = !accountNeedle || loan.loanAccountNumber.toLocaleLowerCase().includes(accountNeedle);
      return matchesStatus && matchesEmployer && matchesSearch && matchesAccount;
    });
  }, [loanAccountFilter, loanListSearch, loanListStatus, loanRecords, selectedEmployerId]);
  const filteredActiveLoanReportLoans = useMemo(() => {
    if (!activeLoanReport) return [];
    const applicableDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    return activeLoanReport.loans.filter((loan) => {
      const loanDate = parseSssLoanDateFromApi(loan.loanDate);
      if (!loanDate) return false;
      const category = getSssLoanReportCategory({
        status: loan.status,
        employeeId: loan.employeeId,
        employeeStatus: loan.employeeStatus ?? null,
        loanDate,
        loanType: loan.loanType,
      }, applicableDate);
      return activeLoanReportFilter === "ALL" ? category !== null : category === activeLoanReportFilter;
    });
  }, [activeLoanReport, activeLoanReportFilter, currentMonth, currentYear]);

  const employeeTotal = (entry: DraftEntry) => {
    if (kind === "LOAN") return Math.round((Number(entry.loanAmount) || 0) * 100) / 100;
    return getSssContributionBracket(Number(entry.monthlySalaryCredit))?.total ?? 0;
  };
  const calculatedTotal = entries.reduce((sum, entry) => sum + employeeTotal(entry), 0);
  const amountDue = Number(draft.amountDue);
  const hasLegacyLoanEntries = kind === "LOAN" && entries.some((entry) => !Number.isSafeInteger(entry.sssLoanId) || !entry.sssLoanId);
  const hasUnconfiguredEntries = entries.some((entry) => kind === "CONTRIBUTION"
    ? !entry.monthlySalaryCredit
    : !entry.sssLoanId || !entry.loanAccountNumber || !entry.loanAmount || Number(entry.loanAmount) <= 0);
  const isTally = entries.length > 0 && !hasUnconfiguredEntries && Number.isFinite(amountDue) && amountDue > 0 && Math.round(calculatedTotal * 100) === Math.round(amountDue * 100);
  const chosenEmployeeIds = new Set(entries.map((entry) => entry.employeeId));
  const pickerEmployees = contributionEmployees;
  const employeeSearchQuery = employeeSssSearch.trim().toLocaleLowerCase();
  const employeeSearchDigits = employeeSssSearch.replace(/\D/g, "");
  const filteredContributionEmployees = pickerEmployees.filter((employee) => {
    if (!employeeSearchQuery) return true;
    const searchableName = [
      employeeName(employee),
      employee.firstName,
      employee.middleName,
      employee.lastName,
      employee.employeeCode,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    const searchableSssNumber = (employee.sssNumber ?? "").replace(/\D/g, "");
    return searchableName.includes(employeeSearchQuery)
      || (employeeSearchDigits.length > 0 && searchableSssNumber.includes(employeeSearchDigits));
  });
  const rangeEmployee = pendingEmployee ?? pickerEmployees.find((employee) => String(employee.id) === selectedEmployeeId);
  const compensationEmployeeName = rangePickerTarget === "new"
    ? (rangeEmployee ? employeeName(rangeEmployee) : "Employee")
    : entries.find((entry) => entry.employeeId === rangePickerTarget)?.employeeName ?? "Employee";

  const resetReportDraft = () => {
    setEditReport(null);
    draftIdRef.current = null;
    setDraftId(null);
    setDraftSaveStatus("idle");
    setDraft({ employerId: selectedEmployerId, prn: "", month: String(currentMonth), year: String(currentYear), amountDue: "" });
    setEntries([]);
    setPendingEmployee(null);
    setPreview(false);
    setPickerOpen(false);
  };

  const openCreate = () => {
    resetReportDraft();
    setCreateOpen(true);
  };

  const loadOutstandingLoans = async (employerId?: number, reportPeriod?: { month: number; year: number }, forReport = false, forLoanEntry = false, forReportEntry = false) => {
    setLoadingLoans(true);
    setLoanListError("");
    try {
      const employerQuery = employerId === undefined ? "" : `employerId=${employerId}`;
      const periodQuery = reportPeriod ? `&month=${reportPeriod.month}&year=${reportPeriod.year}` : "";
      const reportQuery = forReport ? "&forReport=true" : "";
      const loanEntryQuery = forLoanEntry ? "&forLoanEntry=true" : "";
      const reportEntryQuery = forReportEntry ? "&forReportEntry=true" : "";
      const query = [employerQuery, periodQuery.replace(/^&/, ""), reportQuery.replace(/^&/, ""), loanEntryQuery.replace(/^&/, ""), reportEntryQuery.replace(/^&/, "")]
        .filter(Boolean)
        .join("&");
      const response = await fetch(`/api/reports/sss/loans${query ? `?${query}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load outstanding SSS loans");
      setLoanRecords(data.loans as SssLoan[]);
      setCanManageLoans(data.canManageLoans === true);
      return data.loans as SssLoan[];
    } catch (loadError) {
      setLoanRecords([]);
      setLoanListError(loadError instanceof Error ? loadError.message : "Unable to load outstanding SSS loans");
      throw loadError;
    } finally {
      setLoadingLoans(false);
    }
  };

  const openLoans = () => {
    if (!currentEmployer) return;
    setLoanListSearch("");
    setLoanAccountFilter("");
    setLoanListStatus("ACTIVE");
    setLoanRecords([]);
    setLoanListError("");
    setLoansOpen(true);
    void loadOutstandingLoans(currentEmployer.id);
  };

  const openActiveLoanReport = async () => {
    if (!currentEmployer) return;
    setLoadingActiveLoanReport(true);
    setActiveLoanReportFilter("ACTIVE");
    setLoanListError("");
    try {
      const query = new URLSearchParams({
        employerId: String(currentEmployer.id),
        month: String(currentMonth),
        year: String(currentYear),
        forLoanStatusReport: "true",
      });
      const response = await fetch(`/api/reports/sss/loans?${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load SSS loan report");
      setActiveLoanReport({
        employerName: typeof data.employerName === "string" ? data.employerName : currentEmployer.name,
        loans: data.loans as SssLoan[],
      });
      setLoansOpen(false);
    } catch (loadError) {
      setLoanListError(loadError instanceof Error ? loadError.message : "Unable to load SSS loan report");
    } finally {
      setLoadingActiveLoanReport(false);
    }
  };

  const openSssLoanForm = async () => {
    setLoadingLoanEmployees(true);
    setLoanListError("");
    try {
      const response = await fetch("/api/reports/sss/employees?all=true", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employees for SSS loans");
      setLoanEmployees(data.employees as Employee[]);
    } catch (loadError) {
      setLoanListError(loadError instanceof Error ? loadError.message : "Unable to load employees for SSS loans");
      setLoadingLoanEmployees(false);
      return;
    }
    setLoadingLoanEmployees(false);
    const employerId = selectedEmployerId;
    setLoanForm({
      employerId,
      employeeId: "",
      loanAccountNumber: "",
      transactionNumber: "",
      loanType: "S",
      loanDate: localDateInputValue(new Date()),
      loanAmount: "",
      monthlyAmortization: "",
    });
    setLoanFormError("");
    setLoansOpen(false);
    setLoanEntryOpen(true);
  };

  const saveSssLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanFormError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanFormSaving(true);
    setLoanFormError("");
    try {
      const response = await fetch("/api/reports/sss/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...loanForm,
          employerId: Number(loanForm.employerId),
          employeeId: Number(loanForm.employeeId),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save the SSS loan");
      setLoanEntryOpen(false);
      notifySssRecordsUpdated();
      setNotice(data.outstandingBalance === null
        ? "SSS loan saved. Approved amount and outstanding balance are unknown until the approved amount is recorded."
        : "SSS loan saved.");
      setLoanListStatus("ACTIVE");
      setLoansOpen(true);
      await loadOutstandingLoans(Number(selectedEmployerId));
    } catch (saveError) {
      setLoanFormError(saveError instanceof Error ? saveError.message : "Unable to save the SSS loan");
    } finally {
      setLoanFormSaving(false);
    }
  };

  const openLoanEdit = (loan: SssLoan) => {
    setLoanEditTarget(loan);
    setLoanForm({
      employerId: String(loan.employerId),
      employeeId: loan.employeeId === null ? "" : String(loan.employeeId),
      loanAccountNumber: loan.loanAccountNumber,
      transactionNumber: loan.transactionNumber ?? "",
      loanType: loan.loanType,
      loanDate: dateOnly(loan.loanDate) === "—" ? "" : dateOnly(loan.loanDate),
      loanAmount: loan.loanAmount ?? "",
      monthlyAmortization: loan.monthlyAmortization,
    });
    setLoanEditStatus({ status: loan.status, reason: loan.statusReason ?? "" });
    setLoanEditError("");
    setLoansOpen(false);
  };

  const saveLoanEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loanEditTarget || !parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanEditError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanEditSaving(true);
    setLoanEditError("");
    try {
      const response = await fetch(`/api/reports/sss/loans/${loanEditTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanAccountNumber: loanForm.loanAccountNumber,
          transactionNumber: loanForm.transactionNumber,
          loanType: loanForm.loanType,
          loanDate: loanForm.loanDate,
          loanAmount: loanForm.loanAmount,
          monthlyAmortization: loanForm.monthlyAmortization,
          status: loanEditStatus.status,
          reason: loanEditStatus.reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update SSS loan");
      setLoanListStatus(loanEditStatus.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
      setLoanEditTarget(null);
      setNotice("SSS loan updated.");
      setLoansOpen(true);
      await loadOutstandingLoans(Number(selectedEmployerId));
    } catch (updateError) {
      setLoanEditError(updateError instanceof Error ? updateError.message : "Unable to update SSS loan");
    } finally {
      setLoanEditSaving(false);
    }
  };

  const toggleLoanViewEditMode = () => {
    if (!loanViewTarget) return;
    if (loanViewEditMode) {
      setLoanViewEditMode(false);
      setLoanViewEditError("");
    } else {
      setLoanForm({
        employerId: String(loanViewTarget.employerId),
        employeeId: loanViewTarget.employeeId === null ? "" : String(loanViewTarget.employeeId),
        loanAccountNumber: loanViewTarget.loanAccountNumber,
        transactionNumber: loanViewTarget.transactionNumber ?? "",
        loanType: loanViewTarget.loanType,
        loanDate: dateOnly(loanViewTarget.loanDate) === "—" ? "" : dateOnly(loanViewTarget.loanDate),
        loanAmount: loanViewTarget.loanAmount ?? "",
        monthlyAmortization: loanViewTarget.monthlyAmortization,
      });
      setLoanEditStatus({ status: loanViewTarget.status, reason: loanViewTarget.statusReason ?? "" });
      setLoanViewEditError("");
      setLoanViewEditMode(true);
    }
  };

  const saveLoanViewEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loanViewTarget || !parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanViewEditError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanViewEditSaving(true);
    setLoanViewEditError("");
    try {
      const response = await fetch(`/api/reports/sss/loans/${loanViewTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanAccountNumber: loanForm.loanAccountNumber,
          transactionNumber: loanForm.transactionNumber,
          loanType: loanForm.loanType,
          loanDate: loanForm.loanDate,
          loanAmount: loanForm.loanAmount,
          monthlyAmortization: loanForm.monthlyAmortization,
          status: loanEditStatus.status,
          reason: loanEditStatus.reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update SSS loan");
      setLoanListStatus(loanEditStatus.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
      setLoanViewTarget({ ...loanViewTarget, ...data.loan });
      setLoanViewEditMode(false);
      setNotice("SSS loan updated.");
      await loadOutstandingLoans(Number(selectedEmployerId));
    } catch (updateError) {
      setLoanViewEditError(updateError instanceof Error ? updateError.message : "Unable to update SSS loan");
    } finally {
      setLoanViewEditSaving(false);
    }
  };

  const deleteLoan = async () => {
    if (!loanDeleteTarget) return;
    setLoanDeleteSaving(true);
    setLoanListError("");
    try {
      const response = await fetch(`/api/reports/sss/loans/${loanDeleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete SSS loan");
      setLoanDeleteTarget(null);
      setNotice("SSS loan deleted. Existing report rows retain their saved account-number snapshots.");
      await loadOutstandingLoans(Number(selectedEmployerId));
    } catch (deleteError) {
      setLoanListError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS loan");
    } finally {
      setLoanDeleteSaving(false);
    }
  };

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setDeleteReportSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/sss/${deleteReportTarget.id}`, { method: "DELETE" });
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to delete SSS report");
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

  const openReportEdit = (report: Report) => {
    setEditReport(report);
    draftIdRef.current = null;
    setDraftId(null);
    setDraftSaveStatus("idle");
    setDraft({
      employerId: String(report.employerId),
      prn: report.prn,
      month: String(report.applicableMonth),
      year: String(report.applicableYear),
      amountDue: report.amountDue,
    });
    setEntries(report.entries.map((entry) => ({
      employeeId: entry.employeeId,
      employeeCode: entry.employeeCode,
      employeeName: entry.employeeName,
      employeeSssNumber: entry.employeeSssNumber,
      employeeEmployerId: entry.employeeEmployerId,
      employeeEmployerName: entry.employeeEmployerName,
      sssLoanId: entry.sssLoanId,
      loanAccountNumber: entry.loanAccountNumber,
      monthlySalaryCredit: entry.monthlySalaryCredit === null ? null : Number(entry.monthlySalaryCredit),
      loanAmount: entry.loanAmount,
    })));
    setPreview(false);
    setPickerOpen(false);
    setCreateOpen(true);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue this SSS report draft");
      setReportDrafts((current) => current.filter((item) => item.id !== savedDraft.id));
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
    draftIdRef.current = savedDraft.id;
    setDraftId(savedDraft.id);
    setDraft({ employerId: savedDraft.employerId ? String(savedDraft.employerId) : "", prn: savedDraft.prn, month: String(savedDraft.applicableMonth), year: String(savedDraft.applicableYear), amountDue: savedDraft.amountDue });
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
      return;
    }
    setSaving(true);
    const hasDraftContent = draftIdRef.current !== null
      || Boolean(draft.employerId || draft.prn.trim() || draft.amountDue.trim() || entries.length)
      || Number(draft.month) !== currentMonth
      || Number(draft.year) !== currentYear;
    try {
      await draftSaveQueueRef.current;
      if (hasDraftContent) {
        await persistReportDraft(true);
      }
      setCreateOpen(false);
      resetReportDraft();
      if (hasDraftContent) await refreshSssRecords();
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
      await draftSaveQueueRef.current;
      await persistReportDraft(true);
      await refreshSssRecords();
      setCreateOpen(false);
      resetReportDraft();
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete SSS report draft");
      setReportDrafts((current) => current.filter((item) => item.id !== savedDraft.id));
      setNotice("Draft deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS report draft");
    }
  };

  const addSelectedEmployee = () => {
    if (kind === "LOAN") {
      if (hasLegacyLoanEntries) return;
      const selectedLoans = loanRecords.filter((loan) =>
        selectedLoanIds.includes(loan.id)
        && loan.employeeId !== null
        && !entries.some((entry) => entry.sssLoanId === loan.id),
      );
      if (selectedLoans.length === 0) return;
      setEntries((current) => [...current, ...selectedLoans.map((loan): DraftEntry => ({
        employeeId: loan.employeeId!,
        employeeCode: loan.employeeCode,
        employeeName: loan.employeeName,
        employeeSssNumber: loan.employeeSssNumber,
        employeeEmployerId: loan.employeeEmployerId,
        employeeEmployerName: loan.employeeEmployerName,
        sssLoanId: loan.id,
        loanAccountNumber: loan.loanAccountNumber,
        monthlySalaryCredit: null,
        loanAmount: loanReportEntryAmount(loan),
      }))]);
      setSelectedLoanIds([]);
      setLoanEntrySearch("");
      setPickerOpen(false);
      return;
    }
    const employee = pickerEmployees.find((candidate) => String(candidate.id) === selectedEmployeeId);
    if (!employee) return;
    setEntries((current) => [...current, {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employeeName(employee),
      employeeSssNumber: employee.sssNumber,
      employeeEmployerId: employee.employerId ?? null,
      employeeEmployerName: employee.employerName ?? null,
      monthlySalaryCredit: Number(selectedMsc) || null,
      loanAmount: "",
    }]);
    setSelectedEmployeeId("");
    setSelectedMsc("");
    setEmployeeSssSearch("");
    setPickerOpen(false);
  };

  const selectEmployeeForContribution = (employee: Employee) => {
    setSelectedEmployeeId(String(employee.id));
    setPendingEmployee(employee);
    setSelectedMsc("");
    setRangePickerTarget("new");
  };

  const loadAllReportEmployees = async () => {
    const response = await fetch("/api/reports/sss/employees?all=true", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load SSS report employees");
    const employeeRows = data.employees as Employee[];
    setContributionEmployees(employeeRows);
    return employeeRows;
  };

  const openEmployeePicker = async () => {
    setSelectedEmployeeId("");
    setSelectedLoanIds([]);
    setLoanEntrySearch("");
    setEmployeeSssSearch("");
    setSelectedMsc("");
    setPendingEmployee(null);
    setContributionEmployees([]);
    setPickerOpen(true);
    setLoadingEmployerEmployees(true);
    setError("");
    try {
      if (kind === "LOAN") {
        if (!selectedEmployer) {
          throw new Error("Select an employer before adding a loan account.");
        }
        await loadOutstandingLoans();
        return;
      }
      await loadAllReportEmployees();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load SSS report employees");
    } finally {
      setLoadingEmployerEmployees(false);
    }
  };

  const addAllEmployees = async () => {
    if (!selectedEmployer) return;
    if (kind === "LOAN" && hasLegacyLoanEntries) {
      setError("Remove each older employee-only loan row and re-add its saved loan account before adding more loans.");
      return;
    }
    setLoadingEmployerEmployees(true);
    setError("");
    try {
      if (kind === "LOAN") {
        const month = Number(draft.month);
        const year = Number(draft.year);
        if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
          setError("Select a valid applicable month and year before adding active loan accounts.");
          return;
        }
        const loans = await loadOutstandingLoans(selectedEmployer.id, { month, year }, false, true, true);
        const alreadySelected = new Set(entries.map((entry) => entry.sssLoanId).filter((id): id is number => typeof id === "number"));
        const availableLoans = loans.filter((loan) => loan.employeeId !== null && loan.reportTiming === "DUE" && !alreadySelected.has(loan.id));
        if (availableLoans.length === 0) {
          setNotice("No unselected current-month active loan accounts are available.");
          return;
        }
        if (!window.confirm(`Add ${availableLoans.length} current-month active loan account${availableLoans.length === 1 ? "" : "s"} for ${selectedEmployer.name}? Each amount starts with the scheduled payment and can be adjusted to match SSS.`)) return;
        setEntries((current) => [...current, ...availableLoans.map((loan) => ({
          employeeId: loan.employeeId!,
          employeeCode: loan.employeeCode,
          employeeName: loan.employeeName,
          employeeSssNumber: loan.employeeSssNumber,
          employeeEmployerId: loan.employeeEmployerId,
          employeeEmployerName: loan.employeeEmployerName,
          sssLoanId: loan.id,
          loanAccountNumber: loan.loanAccountNumber,
          monthlySalaryCredit: null,
          loanAmount: loanReportEntryAmount(loan),
        }))]);
        return;
      }
      const alreadySelected = new Set(entries.map((entry) => entry.employeeId));
      const availableEmployees = (await loadAllReportEmployees()).filter((employee) => !alreadySelected.has(employee.id));
      if (availableEmployees.length === 0) {
        setNotice("All employees from the database are already in this report.");
        return;
      }
      if (!window.confirm(`Add all ${availableEmployees.length} employees from the database, including inactive employees and employees without an employer? You can set each employee's contribution range in the report.`)) return;
      setEntries((current) => [...current, ...availableEmployees.map((employee) => ({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employeeName(employee),
        employeeSssNumber: employee.sssNumber,
        employeeEmployerId: employee.employerId ?? null,
        employeeEmployerName: employee.employerName ?? null,
        monthlySalaryCredit: null,
        loanAmount: "",
      }))]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load SSS report employees");
    } finally {
      setLoadingEmployerEmployees(false);
    }
  };

  const addPreviousEntries = async () => {
    if (!selectedEmployer) return;
    if (kind === "LOAN" && hasLegacyLoanEntries) {
      setError("Remove each older employee-only loan row and re-add its saved loan account before adding previous loan entries.");
      return;
    }
    const month = Number(draft.month);
    const year = Number(draft.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      setError("Select a valid applicable month and year before adding previous entries.");
      return;
    }
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    setLoadingPreviousEntries(true);
    setError("");
    setNotice("");
    try {
      if (kind === "LOAN") {
        const loans = await loadOutstandingLoans(selectedEmployer.id, { month: previousMonth, year: previousYear }, false, true, true);
        const existingLoanIds = new Set(entries.map((entry) => entry.sssLoanId));
        const newLoanEntries = loans.filter((loan) => loan.employeeId !== null && !existingLoanIds.has(loan.id)).map((loan): DraftEntry => ({
          employeeId: loan.employeeId!,
          employeeCode: loan.employeeCode,
          employeeName: loan.employeeName,
          employeeSssNumber: loan.employeeSssNumber,
          employeeEmployerId: loan.employeeEmployerId,
          employeeEmployerName: loan.employeeEmployerName,
          sssLoanId: loan.id,
          loanAccountNumber: loan.loanAccountNumber,
          monthlySalaryCredit: null,
          loanAmount: loanReportEntryAmount(loan),
        }));
        if (newLoanEntries.length === 0) {
          setNotice(`No new active loan accounts are due for ${selectedEmployer.name} in ${monthNames[previousMonth - 1]} ${previousYear}.`);
          return;
        }
        setEntries((current) => [...current, ...newLoanEntries]);
        setNotice(`Added ${newLoanEntries.length} loan account${newLoanEntries.length === 1 ? "" : "s"} from ${monthNames[previousMonth - 1]} ${previousYear}.`);
        return;
      }
      const response = await fetch(`/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load previous SSS report entries");
      const savedReports = data.reports as Report[];
      setReports(savedReports);
      setCanEditPayments(data.canEditPayments === true);
      const previousReport = savedReports
        .filter((report) => report.kind === kind
          && report.employerId === selectedEmployer.id
          && report.applicableMonth === previousMonth
          && report.applicableYear === previousYear)
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())[0];
      if (!previousReport) {
        throw new Error(`No ${kind === "CONTRIBUTION" ? "contribution" : "loan"} report was found for ${selectedEmployer.name} in ${monthNames[previousMonth - 1]} ${previousYear}.`);
      }

      const alreadySelected = new Set(entries.map((entry) => entry.employeeId));
      const newEntries = previousReport.entries.filter((entry) => !alreadySelected.has(entry.employeeId)).map((entry): DraftEntry => ({
        employeeId: entry.employeeId,
        employeeCode: entry.employeeCode,
        employeeName: entry.employeeName,
        employeeSssNumber: entry.employeeSssNumber,
        employeeEmployerId: entry.employeeEmployerId,
        employeeEmployerName: entry.employeeEmployerName,
        monthlySalaryCredit: null,
        loanAmount: "",
      }));
      if (newEntries.length === 0) {
        setNotice("All employees from the previous month are already in this report.");
        return;
      }
      setEntries((current) => {
        const currentIds = new Set(current.map((entry) => entry.employeeId));
        return [...current, ...newEntries.filter((entry) => !currentIds.has(entry.employeeId))];
      });
      setNotice(`Added ${newEntries.length} employee${newEntries.length === 1 ? "" : "s"} from ${monthNames[previousMonth - 1]} ${previousYear}. Enter their ${kind === "CONTRIBUTION" ? "MSC" : "loan amount"} to complete the report.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load previous SSS report entries");
    } finally {
      setLoadingPreviousEntries(false);
    }
  };

  const updateEntry = (employeeId: number, changes: Partial<DraftEntry>) => {
    setEntries((current) => current.map((entry) => entry.employeeId === employeeId ? { ...entry, ...changes } : entry));
  };

  const updateLoanEntry = (sssLoanId: number, changes: Partial<DraftEntry>) => {
    setEntries((current) => current.map((entry) => entry.sssLoanId === sssLoanId ? { ...entry, ...changes } : entry));
  };

  const selectContributionRange = (monthlySalaryCredit: number) => {
    if (rangePickerTarget === "new") {
      const employee = pendingEmployee ?? pickerEmployees.find((candidate) => String(candidate.id) === selectedEmployeeId);
      if (employee) {
        setEntries((current) => current.some((entry) => entry.employeeId === employee.id) ? current : [...current, {
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employeeName(employee),
          employeeSssNumber: employee.sssNumber,
          employeeEmployerId: employee.employerId ?? selectedEmployer?.id ?? null,
          employeeEmployerName: employee.employerName ?? selectedEmployer?.name ?? null,
          monthlySalaryCredit,
          loanAmount: "",
        }]);
        setPendingEmployee(null);
        setSelectedEmployeeId("");
        setEmployeeSssSearch("");
        setPickerOpen(false);
      }
    }
    else if (typeof rangePickerTarget === "number") updateEntry(rangePickerTarget, { monthlySalaryCredit });
    setRangePickerTarget(null);
  };

  const saveReport = async () => {
    if (!isTally) return;
    const employer = selectedEmployer;
    if (!employer) return;
    if (!editReport && kind === "LOAN") {
      const applicableMonth = Number(draft.month);
      const applicableYear = Number(draft.year);
      const duplicate = reports.some((report) =>
        report.kind === "LOAN"
        && report.employerId === employer.id
        && report.applicableMonth === applicableMonth
        && report.applicableYear === applicableYear,
      );
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
        if (draftIdRef.current === null) await persistReportDraft(false);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save report");
      await refreshSssRecords();
      notifySssRecordsUpdated();
      if (editReport) setNotice("The SSS report was updated.");
      else setNotice("The SSS report was saved. Payment details can be added after the payment is made.");
      setCreateOpen(false);
      resetReportDraft();
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

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save payment details");
      const updated = data.report as Report;
      await refreshSssRecords();
      notifySssRecordsUpdated();
      setViewReport(updated);
      setPaymentReport(null);
      setNotice("Payment details saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedEmployerId) {
    return (
      <main className="min-h-[calc(100dvh-8rem)] bg-slate-50 p-4 sm:p-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Select an employer</h1>
          <p className="mt-1 text-sm text-slate-600">Choose an employer from the Reports dashboard before opening SSS reports.</p>
          <Link href="/reports" className="mt-4 inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800">Choose employer</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-8rem)] bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-none space-y-5">
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <section className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{kind === "CONTRIBUTION" ? "Contribution Reports" : "Loan Reports"}</h2>
              {currentEmployer && <p className="text-xs text-slate-600">{currentEmployer.name} · {currentEmployer.sss || "—"}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div ref={draftMenuRef} className="relative">
                <button type="button" aria-expanded={draftMenuOpen} aria-controls="sss-drafts-menu" onClick={() => setDraftMenuOpen((open) => !open)} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${visibleReportDrafts.length ? "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  Drafts
                  <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${visibleReportDrafts.length ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"}`}>{visibleReportDrafts.length}</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${draftMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {draftMenuOpen && <div id="sss-drafts-menu" className="absolute right-0 z-30 mt-2 max-h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-amber-200 bg-white shadow-xl">
                  <div className="sticky top-0 border-b border-amber-100 bg-amber-50 px-4 py-3">
                    <h2 className="font-bold text-slate-900">Saved Drafts</h2>
                    <p className="mt-0.5 text-xs text-slate-600">Select a {kind === "CONTRIBUTION" ? "contribution" : "loan"} draft to continue.</p>
                  </div>
                  {visibleReportDrafts.length ? <ul className="divide-y divide-slate-100">{visibleReportDrafts.map((savedDraft) => <li key={savedDraft.id} className="flex items-start gap-3 px-4 py-3">
                    <button type="button" disabled={saving} onClick={() => void resumeReportDraft(savedDraft)} className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      <span className="block truncate text-sm font-semibold text-slate-800">{reportEmployerLabel(savedDraft.entries, employers.find((employer) => employer.id === savedDraft.employerId)?.name || "Employer not selected")}</span>
                      <span className="mt-1 block text-xs text-slate-600">{savedDraft.prn ? `PRN ${savedDraft.prn} · ` : ""}{monthNames[savedDraft.applicableMonth - 1]} {savedDraft.applicableYear} · {savedDraft.entries.length} {savedDraft.kind === "LOAN" ? `loan account${savedDraft.entries.length === 1 ? "" : "s"}` : `employee${savedDraft.entries.length === 1 ? "" : "s"}`}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">Updated {new Date(savedDraft.updatedAt).toLocaleString()}</span>
                    </button>
                    <button type="button" disabled={saving} onClick={() => void deleteReportDraft(savedDraft)} className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Delete</button>
                  </li>)}</ul> : <p className="px-4 py-6 text-center text-sm text-slate-500">No saved drafts for this report type.</p>}
                </div>}
              </div>
              {kind === "CONTRIBUTION"
                ? <button type="button" onClick={() => setContributionTableOpen(true)} className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">SSS Table</button>
                : <button type="button" onClick={openLoans} title="View or add employee SSS loans" className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">View Loans</button>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
            <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports dashboard" title="Back to Reports dashboard" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronLeftIcon className="h-4 w-4" /></Link>
            <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"><PlusIcon className="h-4 w-4" /> Add</button>
            <div className="min-w-[180px] flex-1 basis-[260px]"><label htmlFor="sss-search" className="sr-only">Search PRN or employer</label><input id="sss-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PRN or employer..." className={inputClass} /></div>
            <button type="button" onClick={() => void resetFiltersAndRefresh()} disabled={refreshingRecords} aria-label="Reset filters and refresh SSS reports" title="Reset filters and refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"><ArrowPathIcon className={`h-4 w-4 ${refreshingRecords ? "animate-spin" : ""}`} /></button>
            <label htmlFor="sss-year-filter" className="sr-only">Filter by year</label>
            <select id="sss-year-filter" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={`${inputClass} min-w-[140px] flex-1 sm:flex-none sm:w-[150px]`}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]"><tr><th className="w-[13%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Period</th><th className="w-[15%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">PRN</th><th className="w-[6%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Emp</th><th className="w-[11%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Due</th><th className="w-[9%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Status</th><th className="w-[12%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Pay Date</th><th className="w-[18%] px-1.5 py-2 font-semibold sm:px-2 md:px-3">Trans Ref#</th><th className="w-[16%] px-1.5 py-2 text-right font-semibold sm:px-2 md:px-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {annualReports.map((report, index) => {
                  if (!report) {
                    const selectedYear = yearFilter || String(currentYear);
                    return <tr key={`missing-${index}`} className="text-slate-400">
                      <td className="break-words px-1.5 py-1.5 sm:px-2 md:px-3">{monthNames[index]} {selectedYear}</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="px-1.5 py-1.5 sm:px-2 md:px-3">0</td>
                      <td className="px-1.5 py-1.5 sm:px-2 md:px-3">₱0.00</td>
                      <td className="px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">—</td>
                      <td className="px-1.5 py-1.5 text-right sm:px-2 md:px-3">—</td>
                    </tr>;
                  }
                  return <tr key={report.id} className="text-slate-700 hover:bg-blue-50/40">
                    <td className="break-words px-1.5 py-1.5 sm:px-2 md:px-3">{monthNames[report.applicableMonth - 1]} {report.applicableYear}</td><td className="px-1.5 py-1.5 sm:px-2 md:px-3"><span className="block break-all font-mono text-xs">{report.prn}</span></td><td className="px-1.5 py-1.5 sm:px-2 md:px-3">{report.entries.length}</td><td className="break-words px-1.5 py-1.5 font-semibold sm:px-2 md:px-3">{formatMoney(report.amountDue)}</td>
                    <td className="px-1.5 py-1.5 sm:px-2 md:px-3"><span className={`rounded-full px-1.5 py-1 text-[10px] font-semibold sm:px-2 sm:text-xs ${report.amountPaid ? Number(report.amountPaid) >= Number(report.amountDue) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{report.amountPaid ? Number(report.amountPaid) >= Number(report.amountDue) ? "Paid" : "Partial" : "Unpaid"}</span></td>
                    <td className="break-all px-1.5 py-1.5 sm:px-2 md:px-3">{dateOnly(report.payDate)}</td><td className="break-all px-1.5 py-1.5 font-mono text-xs sm:px-2 md:px-3">{report.transactionReference || "—"}</td>
                    <td className="px-1.5 py-1.5 text-right sm:px-2 md:px-3"><div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <button type="button" onClick={() => setViewReport(report)} aria-label={`View ${report.employerName} report`} title="View report and payment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"><EyeIcon className="h-4 w-4" /></button>
                      {canEditPayments ? (
                        <div ref={reportMenuOpen === report.id ? reportMenuRef : null} className="relative">
                          <button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} aria-label={`Actions for ${report.employerName} report`} title="Report actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"><EllipsisVerticalIcon className="h-4 w-4" /></button>
                          {reportMenuOpen === report.id && <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                            <button type="button" onClick={() => { setReportMenuOpen(null); openPaymentForm(report); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{report.amountPaid ? "Edit payment" : "Add payment"}</button>
                            <button type="button" onClick={() => { setReportMenuOpen(null); openReportEdit(report); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit report</button>
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
          <button type="button" onClick={() => setContributionTableOpen(true)} className="text-xs font-semibold text-blue-700 hover:underline">Contribution table · Effective Jan 2025</button>
          <div className="ml-auto flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void closeCreate()} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>{!editReport && <button type="button" disabled={saving} onClick={() => void saveReportDraft()} className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">{draftId ? "Update Draft" : "Save Draft"}</button>}{preview ? <><button type="button" onClick={() => setPreview(false)} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Back to edit</button><button type="button" disabled={!isTally || saving} onClick={() => void saveReport()} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? (editReport ? "Updating..." : "Saving...") : (editReport ? "Update Report" : "Save Report")}</button></> : <button type="button" disabled={!isTally} onClick={() => setPreview(true)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{editReport ? "Review Changes" : "Generate Report"}</button>}</div>
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
                const alreadyExists = existingLoanReportMonths.has(monthNumber);
                const unavailable = !editReport && alreadyExists;
                return <option key={month} value={String(monthNumber)} disabled={unavailable}>{month}{unavailable ? " (Paid)" : ""}</option>;
              })}</select>{kind === "LOAN" && !editReport && <p className="mt-1 text-xs text-slate-500">Months marked “Paid” are unavailable for this employer and year.</p>}</Field>
              <Field label="Applicable Year" required><select value={draft.year} onChange={(event) => { setDraft((current) => ({ ...current, year: event.target.value })); setError(""); }} className={inputClass}>{Array.from({ length: Math.max(1, currentYear - 2025 + 2) }, (_, index) => String(currentYear + 1 - index)).filter((year) => Number(year) >= 2025).map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
              <Field label="Amount Due" required><AmountDueInput value={draft.amountDue} onChange={(value) => setDraft((current) => ({ ...current, amountDue: value }))} /></Field>
            </div>
          </div>

          <section className="mt-5 flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div><h3 className="text-sm font-bold text-slate-800">Employee Entries</h3><p className="mt-0.5 text-xs text-slate-500">{kind === "CONTRIBUTION" ? "Add employees of any status from the full database." : "Add current-month active loan accounts for this employer. Past-due active accounts are available in Add Entry; future loans and inactive employees are excluded."}</p></div>
              <div className="flex flex-wrap gap-2"><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={() => void addPreviousEntries()} className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">{loadingPreviousEntries ? "Loading previous..." : "Add Prev"}</button><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={() => void addAllEmployees()} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{loadingEmployerEmployees ? "Loading employees..." : "Add All"}</button><button type="button" disabled={!selectedEmployer || loadingEmployerEmployees || loadingPreviousEntries || hasLegacyLoanEntries} onClick={() => void openEmployeePicker()} className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" /> Add Entry</button></div>
            </div>
            {hasLegacyLoanEntries && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">This older draft has employee-only loan rows. Remove those rows, then re-add saved loan accounts to continue; account numbers are required for a new loan report.</p>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="sticky top-0 z-10 bg-white text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="break-words w-[5%] px-1.5 py-3 text-center font-semibold">#</th><th className={`${kind === "CONTRIBUTION" ? "w-[25%]" : "w-[19%]"} break-words px-2 py-2 font-semibold`}>Name</th>{kind === "CONTRIBUTION" ? <><th className="break-words w-[14%] px-1.5 py-2 font-semibold">SS Number</th><th className="break-words w-[18%] px-1.5 py-2 font-semibold">MSC</th><th className="break-words w-[11%] px-1.5 py-2 text-right font-semibold">SS</th><th className="break-words w-[8%] px-1.5 py-2 text-right font-semibold">EC</th><th className="break-words w-[14%] px-1.5 py-2 text-right font-semibold">Total Contribution</th></> : <><th className="break-words w-[16%] px-1.5 py-2 font-semibold">SS Number</th><th className="break-words w-[23%] px-1.5 py-2 font-semibold">Loan Account Number</th><th className="break-words w-[23%] px-1.5 py-2 font-semibold">Loan Amount Due</th><th className="break-words w-[14%] px-1.5 py-2 text-right font-semibold">Total</th></>}<th className="break-words w-[4%] px-1 py-3"><span className="sr-only">Remove</span></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry, index) => {
                    const bracket = entry.monthlySalaryCredit ? getSssContributionBracket(entry.monthlySalaryCredit) : null;
                    return <tr key={kind === "LOAN" ? entry.sssLoanId ?? `${entry.employeeId}-${index}` : entry.employeeId}>
                      <td className="px-1.5 py-2 text-center font-medium text-slate-600">{index + 1}</td>
                      <td className="px-2 py-2"><span className="font-semibold text-slate-800">{entry.employeeName}</span></td>
                      {kind === "CONTRIBUTION" ? <><td className="px-1.5 py-2 font-mono text-slate-700">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2"><button type="button" aria-label={`Choose compensation range for ${entry.employeeName}`} onClick={() => setRangePickerTarget(entry.employeeId)} className="flex h-9 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-slate-300 bg-white px-1.5 text-left text-xs font-semibold text-slate-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"><span className="min-w-0 break-words">{bracket ? formatMoney(bracket.monthlySalaryCredit) : "Select range"}</span><ChevronDownIcon className="h-3 w-3 shrink-0 text-slate-600" /></button></td><td className="px-1.5 py-2 text-right font-semibold text-slate-900">{bracket ? formatMoney(bracket.employerSs + bracket.employerMpf + bracket.employeeSs + bracket.employeeMpf) : "—"}</td><td className="px-1.5 py-2 text-right font-medium text-slate-900">{bracket ? formatMoney(bracket.ec) : "—"}</td><td className="px-1.5 py-2 text-right font-bold text-slate-950">{bracket ? formatMoney(bracket.total) : "—"}</td></> : <><td className="px-1.5 py-2 font-mono text-slate-700">{entry.employeeSssNumber || "—"}</td><td className="px-1.5 py-2 font-mono text-slate-700">{entry.loanAccountNumber || "—"}</td><td className="px-1.5 py-2"><MoneyInput value={entry.loanAmount} disabled={!entry.sssLoanId} onChange={(value) => entry.sssLoanId !== null && entry.sssLoanId !== undefined && updateLoanEntry(entry.sssLoanId, { loanAmount: value })} /></td><td className="px-1.5 py-2 text-right font-bold text-slate-800">{employeeTotal(entry) ? formatMoney(employeeTotal(entry)) : "—"}</td></>}
                      <td className="px-2 py-2"><button type="button" onClick={() => setEntries((current) => current.filter((row, rowIndex) => kind === "LOAN" ? rowIndex !== index : row.employeeId !== entry.employeeId))} aria-label={`Remove ${entry.employeeName}${kind === "LOAN" ? ` loan ${entry.loanAccountNumber ?? ""}` : ""}`} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><XMarkIcon className="h-4 w-4" /></button></td>
                    </tr>;
                  })}
                  {entries.length === 0 && <tr><td colSpan={kind === "CONTRIBUTION" ? 8 : 7} className="px-4 py-8 text-center text-sm text-slate-400">Select an employer, then add employee entries.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <button type="button" onClick={() => setContributionTableOpen(true)} className="text-xs font-semibold text-blue-700 hover:underline">Open official contribution table</button>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700"><span>{kind === "LOAN" ? "Loan Accounts" : "Employees"}: <strong className="text-slate-950">{entries.length}</strong></span><span>Calculated total: <strong className="text-slate-950">{formatMoney(calculatedTotal)}</strong></span><span>Amount Due: <strong className="text-slate-950">{formatMoney(amountDue)}</strong></span><span className={`font-bold ${isTally ? "text-emerald-700" : "text-amber-700"}`}>{isTally ? "Totals tally" : hasUnconfiguredEntries ? "Complete every employee entry" : "Totals do not tally"}</span></div>
            </div>
          </section>
        </> : <ReportPreview kind={kind} employer={selectedEmployer} draft={draft} entries={entries} />}

        {pickerOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 pb-4 pt-[8vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) setPickerOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="employee-entry-title" className="flex h-[min(80dvh,42rem)] w-full max-w-xl flex-col rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex shrink-0 items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{kind === "CONTRIBUTION" ? "Contribution entry" : "Loan entry"}</p><h3 id="employee-entry-title" className="mt-1 text-lg font-bold text-slate-900">{kind === "CONTRIBUTION" ? "Select employee" : "Select loan account"}</h3><p className="mt-1 text-xs text-slate-500">{kind === "CONTRIBUTION" ? "Choose any employee from the database, regardless of employer or status." : "Choose any saved loan account linked to an employee, regardless of status or report period."}</p></div><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
            <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
              {kind === "CONTRIBUTION" && <Field label="Search by employee name or SS Number"><input type="search" value={employeeSssSearch} onChange={(event) => setEmployeeSssSearch(event.target.value)} className={inputClass} placeholder="Type a name or SS Number" autoComplete="off" /></Field>}
              {kind === "LOAN" && <Field label="Search by name or SS Number"><input type="search" value={loanEntrySearch} onChange={(event) => setLoanEntrySearch(event.target.value)} className={inputClass} placeholder="Type a name or SS Number" autoComplete="off" /></Field>}
              {kind === "CONTRIBUTION" && employeeSearchQuery && <div className="-mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white" role="listbox" aria-label="Matching employees">
                {filteredContributionEmployees.filter((employee) => !chosenEmployeeIds.has(employee.id)).length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No employees match this name or SS Number.</p>}
                {filteredContributionEmployees.filter((employee) => !chosenEmployeeIds.has(employee.id)).map((employee) => <button key={employee.id} type="button" role="option" aria-selected={selectedEmployeeId === String(employee.id)} onClick={() => selectEmployeeForContribution(employee)} className={`block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-blue-50 ${selectedEmployeeId === String(employee.id) ? "bg-blue-50" : "bg-white"}`}><span className="block text-sm font-semibold text-slate-900">{employeeName(employee)} <span className="font-mono font-medium">· {employee.sssNumber || "No SS Number"}</span></span><span className="mt-0.5 block text-xs text-slate-600">{employee.employerName || "No employer assigned"}{employee.status ? ` · ${employee.status}` : ""}</span></button>)}
              </div>}
              {kind === "CONTRIBUTION"
                ? <Field label="Employee from database" required><select value={selectedEmployeeId} onChange={(event) => { const employee = pickerEmployees.find((candidate) => String(candidate.id) === event.target.value) ?? null; setSelectedEmployeeId(event.target.value); setPendingEmployee(employee); }} disabled={loadingEmployerEmployees} className={inputClass}><option value="">{loadingEmployerEmployees ? "Loading employees..." : "Select employee"}</option>{filteredContributionEmployees.filter((employee) => !chosenEmployeeIds.has(employee.id) || String(employee.id) === selectedEmployeeId).map((employee) => <option key={employee.id} value={String(employee.id)}>{employeeName(employee)} · SS Number: {employee.sssNumber || "Not set"}{employee.employerName ? ` · ${employee.employerName}` : " · No employer assigned"}{employee.status && employee.status !== "Active" ? ` · ${employee.status}` : ""}</option>)}</select></Field>
                : <Field label="Loan Account" required><div className="overflow-hidden rounded-lg border border-slate-300" role="group" aria-label="Loan accounts"><div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)_minmax(6rem,auto)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600"><span>Name</span><span>Loan Account Number</span><span className="text-right">Loan Amount</span></div><div className="max-h-60 overflow-y-auto">{loadingLoans ? <p className="px-3 py-4 text-center text-sm text-slate-500">Loading loan accounts...</p> : availableLoanEntries.map((loan) => <label key={loan.id} className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)_minmax(6rem,auto)] items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0 hover:bg-blue-50 ${selectedLoanIds.includes(loan.id) ? "bg-blue-50" : "bg-white"}`}><span className="flex min-w-0 items-center gap-2 font-medium text-slate-900"><input type="checkbox" name="loan-account" value={loan.id} checked={selectedLoanIds.includes(loan.id)} onChange={() => setSelectedLoanIds((current) => current.includes(loan.id) ? current.filter((id) => id !== loan.id) : [...current, loan.id])} className="shrink-0 rounded accent-blue-600" /><span className="truncate">{loan.employeeName}</span></span><span className="truncate font-mono text-xs text-slate-700">{loan.loanAccountNumber}</span><span className="text-right font-semibold tabular-nums text-slate-900">{formatMoney(Number(loan.monthlyPayment) > 0 ? loan.monthlyPayment : loan.monthlyAmortization)}</span></label>)}{!loadingLoans && availableLoanEntries.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-500">{loanEntrySearch.trim() ? "No loan accounts match this name or SS Number." : "No unselected saved loan accounts are available."}</p>}</div></div></Field>}
              {kind === "CONTRIBUTION" && <Field label="MSC"><button type="button" disabled={!selectedEmployeeId} onClick={() => setRangePickerTarget("new")} className={`${inputClass} flex items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}><span>{selectedMsc ? formatMoney(Number(selectedMsc)) : selectedEmployeeId ? "Select range" : "Select an employee first"}</span><ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-600" /></button></Field>}
            </div>
            <div className="mt-4 flex shrink-0 justify-end gap-2"><button type="button" onClick={() => setPickerOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>{kind === "LOAN" && <button type="button" disabled={loadingLoans || selectedLoanIds.length === 0} onClick={addSelectedEmployee} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckIcon className="h-4 w-4" /> Add {selectedLoanIds.length} Account{selectedLoanIds.length === 1 ? "" : "s"}</button>}</div>
          </section>
        </div>}
        {rangePickerTarget !== null && <CompensationRangePicker employeeName={compensationEmployeeName} onClose={() => setRangePickerTarget(null)} onSelect={selectContributionRange} />}

      </Modal>}

      {activeLoanReport && <Modal
        title="SSS Loan Report"
        subtitle={`Loan status and Start Date evaluated as of ${monthNames[currentMonth - 1]} ${currentYear}`}
        meta={<div className="flex items-center gap-2"><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span>Filter</span><select aria-label="Loan report filter" value={activeLoanReportFilter} onChange={(event) => setActiveLoanReportFilter(event.target.value as typeof activeLoanReportFilter)} className="h-9 min-w-28 rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="UPCOMING">Upcoming</option><option value="INACTIVE">Inactive</option></select></label><button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#172554] px-3 text-xs font-semibold text-white hover:bg-blue-900 print:hidden"><PrinterIcon className="h-4 w-4" /> Print</button></div>}
        onClose={() => { setActiveLoanReport(null); setLoansOpen(true); }}
        wide
        fullWidth
        printOnly
        footer={<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7 print:hidden"><p className="text-xs font-medium text-slate-500">Read-only report · This report has not been saved.</p><button type="button" onClick={() => { setActiveLoanReport(null); setLoansOpen(true); }} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Back to SSS Loans</button></div>}
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employer</p><p className="mt-1 font-semibold text-slate-900">{activeLoanReport.employerName}</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan Accounts</p><p className="mt-1 font-semibold text-slate-900">{filteredActiveLoanReportLoans.length}</p></div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Combined Monthly Amortization</p><p className="mt-1 text-lg font-bold tabular-nums text-blue-950">{formatMoney(filteredActiveLoanReportLoans.reduce((total, loan) => total + Math.round(Number(loan.monthlyAmortization) * 100), 0) / 100)}</p></div>
        </div>
        {filteredActiveLoanReportLoans.length === 0
          ? <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-600">No {activeLoanReportFilter === "ALL" ? "" : `${activeLoanReportFilter.toLocaleLowerCase()} `}loan accounts match this filter.</p>
          : <div className="sss-loan-report-table overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-4 py-3 text-center">#</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">SS Number</th><th className="px-4 py-3">Loan Account</th><th className="px-4 py-3">Loan Type</th><th className="px-4 py-3">Loan Date</th><th className="px-4 py-3">Start Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Monthly</th><th className="px-4 py-3 text-right">Semi-Monthly</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filteredActiveLoanReportLoans.map((loan, index) => <tr key={loan.id} className="text-slate-700">
              <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{loan.employeeName}</td>
              <td className="px-4 py-3 font-mono">{loan.employeeSssNumber || "—"}</td>
              <td className="px-4 py-3 font-mono">{loan.loanAccountNumber}</td>
              <td className="px-4 py-3">{getSssLoanTypeLabel(loan.loanType)}</td>
              <td className="px-4 py-3">{dateOnly(loan.loanDate)}</td>
              <td className="px-4 py-3">{formatLoanStartDate(loan)}</td>
              <td className="px-4 py-3">{getSssLoanStatusLabel(loan.status, loan.statusReason)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatMoney(loan.monthlyAmortization)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatMoney(Math.round(Number(loan.monthlyAmortization) * 100 / 2) / 100)}</td>
            </tr>)}</tbody>
          </table></div>}
      </Modal>}

      {loansOpen && <Modal title="SSS Loans" subtitle="Manage employee loan accounts and status." onClose={() => setLoansOpen(false)} wide fullWidth>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {kind === "LOAN" && currentEmployer && <button type="button" onClick={() => void openActiveLoanReport()} disabled={loadingActiveLoanReport} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><EyeIcon className="h-4 w-4" /> {loadingActiveLoanReport ? "Loading Report..." : "Report"}</button>}
          <button type="button" onClick={() => void openSssLoanForm()} disabled={loadingLoanEmployees} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"><PlusIcon className="h-4 w-4" /> {loadingLoanEmployees ? "Loading Employees..." : "Add"}</button>
          <label className="relative min-w-[190px] flex-1">
            <span className="sr-only">Search employee name or SS Number</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={loanListSearch} onChange={(event) => setLoanListSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search employee or SS Number" />
          </label>
          <Field label="LAN"><input value={loanAccountFilter} onChange={(event) => setLoanAccountFilter(event.target.value)} className={`${inputClass} min-w-[150px]`} placeholder="Loan Account Number" /></Field>
          <Field label="Status"><select value={loanListStatus} onChange={(event) => setLoanListStatus(event.target.value as "ACTIVE" | "INACTIVE")} className={`${inputClass} min-w-[130px]`}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field>
        </div>
        {loanListError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanListError}</div>}
        {loadingLoans ? <p className="py-12 text-center text-sm text-slate-500">Loading SSS loans...</p>
          : filteredLoanRecords.length === 0 ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No {loanListStatus.toLocaleLowerCase()} SSS loans match these filters.</p>
            : <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1320px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-[16%] px-4 py-3">Employee</th><th className="w-[12%] px-4 py-3">SS Number</th><th className="w-[15%] px-4 py-3">Loan Account Number</th><th className="w-[10%] px-4 py-3">Loan Date</th><th className="w-[12%] px-4 py-3">Start Date</th><th className="w-[12%] px-4 py-3">Loan Type</th><th className="w-[14%] px-4 py-3 text-right">Monthly Amortization</th><th className="w-[6%] px-4 py-3">Status</th><th className="w-[3%] px-4 py-3 text-center">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filteredLoanRecords.map((loan) => <tr key={loan.id} className="text-slate-700 hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{loan.employeeName}</td>
                <td className="px-4 py-3 font-mono">{loan.employeeSssNumber || "—"}</td>
                <td className="px-4 py-3 font-mono">{loan.loanAccountNumber}</td>
                <td className="px-4 py-3">{dateOnly(loan.loanDate)}</td>
                <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${loanStartDateClass(loan)}`}>{formatLoanStartDate(loan)}</span></td>
                <td className="px-4 py-3">{getSssLoanTypeListLabel(loan.loanType)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(loan.monthlyAmortization)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${loan.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{getSssLoanStatusLabel(loan.status, loan.statusReason)}</span></td>
                <td className="px-4 py-3"><div className="flex justify-center gap-1">
                  <button type="button" onClick={() => setLoanViewTarget(loan)} aria-label={`View ${loan.employeeName} loan`} title="View loan details" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"><EyeIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => openLoanEdit(loan)} aria-label={`Update ${loan.employeeName} loan`} title="Update loan" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"><PencilSquareIcon className="h-4 w-4" /></button>
                  {canManageLoans && <button type="button" onClick={() => setLoanDeleteTarget(loan)} aria-label={`Delete ${loan.employeeName} loan`} title="Delete loan" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-100"><TrashIcon className="h-4 w-4" /></button>}
                </div></td>
              </tr>)}</tbody>
            </table></div>}
      </Modal>}

      {loanViewTarget && <Modal title="SSS Loan Details" subtitle={loanViewTarget.loanAccountNumber} onClose={() => { if (!loanViewEditSaving) { setLoanViewTarget(null); setLoanViewEditMode(false); } }}>
        {loanViewEditError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanViewEditError}</div>}
        {loanViewEditMode ? (
          <form onSubmit={(event) => void saveLoanViewEdit(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{loanViewTarget.employeeName}</dd>
              </div>
              <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employer</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{loanViewTarget.employerName}</dd>
              </div>
              <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SS Number</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{loanViewTarget.employeeSssNumber || "—"}</dd>
              </div>
              <Field label="Loan Account Number" required><input required maxLength={80} value={loanForm.loanAccountNumber} onChange={(event) => setLoanForm((current) => ({ ...current, loanAccountNumber: event.target.value }))} className={inputClass} /></Field>
              <Field label="Transaction Number"><input maxLength={80} value={loanForm.transactionNumber} onChange={(event) => setLoanForm((current) => ({ ...current, transactionNumber: event.target.value }))} className={inputClass} /></Field>
              <Field label="Loan Type" required><select required value={loanForm.loanType} onChange={(event) => {
                const value = event.target.value;
                if (isSssLoanType(value)) setLoanForm((current) => ({ ...current, loanType: value }));
              }} className={inputClass}>{sssLoanTypes.map((loanType) => <option key={loanType.code} value={loanType.code}>{getSssLoanTypeLabel(loanType.code)}</option>)}</select></Field>
              <Field label="Loan Date" required><input required type="date" min="0001-01-01" max="9999-12-31" value={loanForm.loanDate} onChange={(event) => setLoanForm((current) => ({ ...current, loanDate: event.target.value }))} className={inputClass} /></Field>
              <Field label="Approved Loan Amount"><input type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.loanAmount} onChange={(event) => setLoanForm((current) => ({ ...current, loanAmount: event.target.value }))} className={inputClass} placeholder="Optional if unknown" /></Field>
              <Field label="Monthly Amortization" required><input required type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.monthlyAmortization} onChange={(event) => setLoanForm((current) => ({ ...current, monthlyAmortization: event.target.value }))} className={inputClass} /></Field>
              <Field label="Status" required><select required value={loanEditStatus.status} onChange={(event) => {
                const status = event.target.value;
                if (isSssLoanStatus(status)) setLoanEditStatus({ status, reason: "" });
              }} className={inputClass}><option value="ACTIVE">Active</option><option value="ON_HOLD">On-Hold</option><option value="PAID">Paid</option><option value="NOT_CONNECTED">Not connected</option></select></Field>
              {loanEditStatus.status === "PAID" && <Field label="Paid Reason" required><select required value={loanEditStatus.reason} onChange={(event) => setLoanEditStatus((current) => ({ ...current, reason: event.target.value }))} className={inputClass}><option value="">Select reason</option><option value="APPLIED_FOR_NEW_LOAN">Applied for new loan</option><option value="FULLY_PAID">Fully paid</option></select></Field>}
              {loanEditStatus.status === "NOT_CONNECTED" && <p className="self-end rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Reason: Resigned</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={toggleLoanViewEditMode} disabled={loanViewEditSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={loanViewEditSaving || (loanEditStatus.status === "PAID" && !loanEditStatus.reason)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{loanViewEditSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900 flex items-center justify-between">
                {loanViewTarget.employeeName}
                <button type="button" onClick={toggleLoanViewEditMode} aria-label={`Edit ${loanViewTarget.employeeName} loan`} title="Edit loan" className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"><PencilSquareIcon className="h-4 w-4" /></button>
              </dd>
            </div>
            <LoanDetail label="Employer" value={loanViewTarget.employerName} />
            <LoanDetail label="SS Number" value={loanViewTarget.employeeSssNumber || "—"} />
            <LoanDetail label="Loan Account Number" value={loanViewTarget.loanAccountNumber} />
            <LoanDetail label="Loan Type" value={getSssLoanTypeLabel(loanViewTarget.loanType)} />
            <LoanDetail label="Transaction Number" value={loanViewTarget.transactionNumber || "—"} />
            <LoanDetail label="Loan Date" value={dateOnly(loanViewTarget.loanDate)} />
            <LoanDetail label="Approved Loan Amount" value={loanViewTarget.loanAmount === null ? "Unknown" : formatMoney(loanViewTarget.loanAmount)} />
            <LoanDetail label="Monthly Amortization" value={formatMoney(loanViewTarget.monthlyAmortization)} />
            <LoanDetail label="Outstanding Balance" value={loanViewTarget.outstandingBalance === null ? "Unknown" : formatMoney(loanViewTarget.outstandingBalance)} />
            <LoanDetail label="Status" value={getSssLoanStatusLabel(loanViewTarget.status, loanViewTarget.statusReason)} />
          </dl>
        )}
      </Modal>}

      {loanEditTarget && <Modal title="Update SSS Loan" subtitle={`${loanEditTarget.employeeName} · ${loanEditTarget.employerName}`} onClose={() => { if (!loanEditSaving) { setLoanEditTarget(null); setLoansOpen(true); } }}>
        {loanEditError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanEditError}</div>}
        <form onSubmit={(event) => void saveLoanEdit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loan Account Number" required><input required maxLength={80} value={loanForm.loanAccountNumber} onChange={(event) => setLoanForm((current) => ({ ...current, loanAccountNumber: event.target.value }))} className={inputClass} /></Field>
            <Field label="Transaction Number"><input maxLength={80} value={loanForm.transactionNumber} onChange={(event) => setLoanForm((current) => ({ ...current, transactionNumber: event.target.value }))} className={inputClass} /></Field>
            <Field label="Loan Type" required><select required value={loanForm.loanType} onChange={(event) => {
              const value = event.target.value;
              if (isSssLoanType(value)) setLoanForm((current) => ({ ...current, loanType: value }));
            }} className={inputClass}>{sssLoanTypes.map((loanType) => <option key={loanType.code} value={loanType.code}>{getSssLoanTypeLabel(loanType.code)}</option>)}</select></Field>
            <Field label="Loan Date" required><input required type="date" min="0001-01-01" max="9999-12-31" value={loanForm.loanDate} onChange={(event) => setLoanForm((current) => ({ ...current, loanDate: event.target.value }))} className={inputClass} /></Field>
            <Field label="Approved Loan Amount"><input type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.loanAmount} onChange={(event) => setLoanForm((current) => ({ ...current, loanAmount: event.target.value }))} className={inputClass} placeholder="Optional if unknown" /></Field>
            <Field label="Monthly Amortization" required><input required type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.monthlyAmortization} onChange={(event) => setLoanForm((current) => ({ ...current, monthlyAmortization: event.target.value }))} className={inputClass} /></Field>
            <Field label="Status" required><select required value={loanEditStatus.status} onChange={(event) => {
              const status = event.target.value;
              if (isSssLoanStatus(status)) setLoanEditStatus({ status, reason: "" });
            }} className={inputClass}><option value="ACTIVE">Active</option><option value="ON_HOLD">On-Hold</option><option value="PAID">Paid</option><option value="NOT_CONNECTED">Not connected</option></select></Field>
            {loanEditStatus.status === "PAID" && <Field label="Paid Reason" required><select required value={loanEditStatus.reason} onChange={(event) => setLoanEditStatus((current) => ({ ...current, reason: event.target.value }))} className={inputClass}><option value="">Select reason</option><option value="APPLIED_FOR_NEW_LOAN">Applied for new loan</option><option value="FULLY_PAID">Fully paid</option></select></Field>}
            {loanEditStatus.status === "NOT_CONNECTED" && <p className="self-end rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Reason: Resigned</p>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => { setLoanEditTarget(null); setLoansOpen(true); }} disabled={loanEditSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={loanEditSaving || (loanEditStatus.status === "PAID" && !loanEditStatus.reason)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{loanEditSaving ? "Saving..." : "Save Changes"}</button></div>
        </form>
      </Modal>}

      {deleteReportTarget && <Modal title="Delete SSS Report?" subtitle="This action cannot be undone." onClose={() => { if (!deleteReportSaving) setDeleteReportTarget(null); }}>
        <p className="text-sm leading-relaxed text-slate-700">Delete the <strong>{deleteReportTarget.kind === "LOAN" ? "loan" : "contribution"}</strong> report for <strong>{deleteReportTarget.employerName}</strong> covering <strong>{monthNames[deleteReportTarget.applicableMonth - 1]} {deleteReportTarget.applicableYear}</strong> (PRN <strong>{deleteReportTarget.prn}</strong>)? Its {deleteReportTarget.entries.length} employee {deleteReportTarget.entries.length === 1 ? "entry" : "entries"} and any recorded payment details will also be removed. Saved drafts are not affected.</p>
        {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleteReportTarget(null)} disabled={deleteReportSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void deleteReport()} disabled={deleteReportSaving} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{deleteReportSaving ? "Deleting..." : "Delete Report"}</button></div>
      </Modal>}

      {loanDeleteTarget && <Modal title="Delete SSS Loan?" subtitle="This action cannot be undone." onClose={() => { if (!loanDeleteSaving) setLoanDeleteTarget(null); }}>
        <p className="text-sm leading-relaxed text-slate-700">Delete the loan account <strong>{loanDeleteTarget.loanAccountNumber}</strong> for <strong>{loanDeleteTarget.employeeName}</strong>? Existing SSS report rows will retain their saved account-number snapshots.</p>
        {loanListError && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanListError}</div>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setLoanDeleteTarget(null)} disabled={loanDeleteSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void deleteLoan()} disabled={loanDeleteSaving} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{loanDeleteSaving ? "Deleting..." : "Delete Loan"}</button></div>
      </Modal>}

      {loanEntryOpen && <Modal title="Add SSS Loan" subtitle="Salary and calamity amortization start in the second month after Loan Date; emergency loans start after the six-month moratorium." onClose={() => { setLoanEntryOpen(false); setLoansOpen(true); }}>
        {loanFormError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanFormError}</div>}
        <form onSubmit={(event) => void saveSssLoan(event)} className="space-y-4">
          <Field label="Employer" required><select required value={loanForm.employerId} onChange={(event) => setLoanForm((current) => ({ ...current, employerId: event.target.value, employeeId: "" }))} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}</select></Field>
          <Field label="Select Employee" required><select required value={loanForm.employeeId} onChange={(event) => {
            setLoanForm((current) => ({ ...current, employeeId: event.target.value }));
          }} disabled={!loanEmployer || loadingLoanEmployees} className={inputClass}><option value="">{loadingLoanEmployees ? "Loading employees..." : loanEmployer ? "Select employee from all employers" : "Select employer first"}</option>{loanEmployees.map((employee) => <option key={employee.id} value={String(employee.id)}>{employeeName(employee)} · {employee.employerName || "No employer"}{employee.biometricNo?.trim() ? "" : " · Biometric Number required"}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Employees from all employers are available. The loan will be recorded under the selected loan Employer. A Biometric Number is required to save.</span>{selectedLoanEmployee && !selectedLoanEmployee.biometricNo?.trim() && <span className="mt-1 block text-xs text-amber-700">Add a Biometric Number to this employee profile before saving the loan.</span>}</Field>
          <Field label="Loan Account Number" required><input required maxLength={80} value={loanForm.loanAccountNumber} onChange={(event) => setLoanForm((current) => ({ ...current, loanAccountNumber: event.target.value }))} className={inputClass} /></Field>
          <Field label="Transaction Number"><input maxLength={80} value={loanForm.transactionNumber} onChange={(event) => setLoanForm((current) => ({ ...current, transactionNumber: event.target.value }))} className={inputClass} /></Field>
          <Field label="Loan Type" required><select required value={loanForm.loanType} onChange={(event) => {
            const value = event.target.value;
            if (isSssLoanType(value)) setLoanForm((current) => ({ ...current, loanType: value }));
          }} className={inputClass}>{sssLoanTypes.map((loanType) => <option key={loanType.code} value={loanType.code}>{getSssLoanTypeLabel(loanType.code)}</option>)}</select></Field>
          <Field label="Loan Date" required><input required type="date" min="0001-01-01" max="9999-12-31" value={loanForm.loanDate} onChange={(event) => setLoanForm((current) => ({ ...current, loanDate: event.target.value }))} className={inputClass} /></Field>
          {(() => {
            const loanDate = parseSssLoanDateOnly(loanForm.loanDate);
            return <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 sm:col-span-2">{loanDate ? `Payment starts in ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(getSssLoanFirstAmortizationDate(loanDate, loanForm.loanType))}.` : "Enter a valid Loan Date using a four-digit year to see the first payment month."}</p>;
          })()}
          <Field label="Approved Loan Amount"><input type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.loanAmount} onChange={(event) => setLoanForm((current) => ({ ...current, loanAmount: event.target.value }))} className={inputClass} placeholder="Optional if unknown" /></Field>
          <Field label="Monthly Amortization" required><input required type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.monthlyAmortization} onChange={(event) => setLoanForm((current) => ({ ...current, monthlyAmortization: event.target.value }))} className={inputClass} /></Field>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => { setLoanEntryOpen(false); setLoansOpen(true); }} disabled={loanFormSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={loanFormSaving || !selectedLoanEmployee} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loanFormSaving ? "Saving..." : "Save Loan"}</button></div>
        </form>
      </Modal>}

      {viewReport && <Modal title={`${viewReport.kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report`} subtitle={`${monthNames[viewReport.applicableMonth - 1]} ${viewReport.applicableYear} · PRN ${viewReport.prn}`} meta={<p>Added by {creatorLabel(viewReport)} · {formatReportCreatedAt(viewReport.createdAt)}</p>} onClose={() => setViewReport(null)} wide fullWidth footer={
        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <button type="button" onClick={() => setViewReport(null)} className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      }>
        <ReportSavedView report={viewReport} />
      </Modal>}

      {paymentReport && <Modal title="Record Payment" subtitle="Enter these details after the SSS payment has been made." onClose={() => setPaymentReport(null)}>
        {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{paymentReport.employerName}</p><p className="mt-1 text-slate-500">Amount Due: {formatMoney(paymentReport.amountDue)} · {monthNames[paymentReport.applicableMonth - 1]} {paymentReport.applicableYear}</p></div>
        <form onSubmit={(event) => void savePayment(event)} className="space-y-4">
          <Field label="Amount Paid" required><AmountPaidInput value={paymentForm.amountPaid} onChange={(value) => setPaymentForm((current) => ({ ...current, amountPaid: value }))} /></Field>
          <Field label="Payment Type" required><select required value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentType: event.target.value }))} className={inputClass}><option value="">Select payment type</option>{paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
          <Field label="Pay Date" required><input required type="date" value={paymentForm.payDate} onChange={(event) => setPaymentForm((current) => ({ ...current, payDate: event.target.value }))} className={inputClass} /></Field>
          <Field label="SSS Branch" required><input required value={paymentForm.sssBranch} onChange={(event) => setPaymentForm((current) => ({ ...current, sssBranch: event.target.value }))} className={inputClass} placeholder="Branch where payment was made" /></Field>
          <Field label="Transaction Reference" required><input required value={paymentForm.transactionReference} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionReference: event.target.value }))} className={inputClass} /></Field>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setPaymentReport(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Payment"}</button></div>
        </form>
      </Modal>}

      {contributionTableOpen && <ContributionTableDialog onClose={() => setContributionTableOpen(false)} />}
      {notice && <div className="fixed inset-x-4 bottom-5 z-[100] mx-auto max-w-lg rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-xl" role="status">{notice}<button type="button" onClick={() => setNotice("")} className="ml-3 font-bold">Dismiss</button></div>}
    </main>
  );
}

function Modal({ title, subtitle, meta, onClose, wide, fullWidth, fullHeight, footer, printOnly, children }: { title: string; subtitle: string; meta?: ReactNode; onClose: () => void; wide?: boolean; fullWidth?: boolean; fullHeight?: boolean; footer?: ReactNode; printOnly?: boolean; children: ReactNode }) {
  return <div id={printOnly ? "sss-loan-report-print-overlay" : undefined} className={`fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 ${fullHeight ? "p-2 sm:p-3" : "p-3 sm:p-6"} ${printOnly ? "sss-loan-report-print-overlay" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="sss-modal-title" className={`flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${fullHeight ? "h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-1.5rem)]" : "max-h-[94dvh]"} ${fullWidth ? "max-w-[min(96vw,1600px)]" : wide ? "max-w-6xl" : "max-w-xl"} ${printOnly ? "sss-loan-report-print-dialog" : ""}`}><div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-7"><div className="min-w-0"><h2 id="sss-modal-title" className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><div className="flex shrink-0 items-start gap-3">{meta && <div className={`max-w-[45vw] pt-1.5 text-right text-[11px] font-normal leading-snug text-slate-500 sm:max-w-[20rem] ${printOnly ? "print:hidden" : ""}`}>{meta}</div>}<button type="button" onClick={onClose} aria-label="Close" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 ${printOnly ? "print:hidden" : ""}`}><XMarkIcon className="h-5 w-5" /></button></div></div><div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 ${printOnly ? "sss-loan-report-print-content" : ""}`}>{children}</div>{footer}</section></div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block min-w-0"><span className={labelClass}>{label}{required && <span className="ml-1 text-rose-600">*</span>}</span>{children}</label>;
}

function MoneyInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <div className={`flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 ${disabled ? "bg-slate-100" : ""}`}><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">₱</span><input aria-label="Amount in pesos" type="number" min="0" step="0.01" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100" placeholder="0.00" /></div>;
}

function AmountPaidInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return <div className="flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">₱</span><input aria-label="Amount Paid in pesos" type="text" inputMode="decimal" value={focused ? value : formatAmountDue(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, ""); const dot = clean.indexOf("."); onChange(dot < 0 ? clean : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`); }} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none" placeholder="0.00" /></div>;
}

function AmountDueInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return <div className="flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">₱</span><input aria-label="Amount Due in pesos" type="text" inputMode="decimal" value={focused ? value : formatAmountDue(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, ""); const dot = clean.indexOf("."); onChange(dot < 0 ? clean : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`); }} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none" placeholder="0.00" /></div>;
}

function CompensationRangePicker({ employeeName, onClose, onSelect }: { employeeName: string; onClose: () => void; onSelect: (monthlySalaryCredit: number) => void }) {
  const [search, setSearch] = useState("");
  const filteredRows = SSS_CONTRIBUTION_TABLE.filter((row) => `${row.range} ${row.monthlySalaryCredit} ${formatMoney(row.monthlySalaryCredit)}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="compensation-range-title" className="flex max-h-[86dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4"><div><h3 id="compensation-range-title" className="text-lg font-bold text-slate-900">Select Compensation Range</h3><p className="mt-1 text-sm text-slate-600">Choose the employee’s compensation range.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
      <div className="space-y-3 border-b border-slate-200 px-5 py-4"><div className="rounded-lg bg-blue-50 px-3 py-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Applying range to</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{employeeName}</p></div><label className="block"><span className="sr-only">Search compensation ranges</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Search compensation range or MSC..." /></label></div>
      <div className="max-h-60 overflow-y-auto p-3" role="listbox" aria-label="Compensation ranges">{filteredRows.slice(0, 100).map((row) => <button type="button" role="option" aria-selected="false" key={row.key} onClick={() => onSelect(row.monthlySalaryCredit)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"><span>{row.range}</span><span className="ml-2 text-slate-600">· {formatMoney(row.total)}</span></button>)}{filteredRows.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">No compensation ranges match your search.</p>}</div>
    </section>
  </div>;
}

function ReportPreview({ kind, employer, draft, entries }: { kind: PaymentKind; employer: Employer | null; draft: { prn: string; month: string; year: string; amountDue: string }; entries: DraftEntry[] }) {
  const employerLabel = reportEmployerLabel(entries, employer?.name || "Employer not selected");
  return <div className="space-y-5 rounded-xl border border-slate-200 p-4 sm:p-6">
    <div className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">SSS {kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report</p><h3 className="mt-1 text-xl font-bold text-slate-900">{employerLabel}</h3><p className="mt-1 text-sm text-slate-600">{employer?.longAddress || employer?.shortAddress || "Address not set"}</p><p className="text-sm text-slate-600">Employer SSS Number: {employer?.sss || "Not set"}</p></div><div className="text-sm text-slate-700 sm:text-right"><p><span className="text-slate-500">PRN:</span> <span className="font-mono font-semibold text-slate-900">{draft.prn}</span></p><p className="mt-1"><span className="text-slate-500">Applicable Period:</span> <strong className="text-slate-900">{monthNames[Number(draft.month) - 1]} {draft.year}</strong></p><p className="mt-1 text-slate-600">Applicable date: {monthEnd(Number(draft.month), Number(draft.year))}</p></div></div>
    <div className="overflow-x-auto"><table className="min-w-[940px] w-full text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-3 py-2.5 text-center">#</th><th className="px-3 py-2.5">Name</th>{kind === "CONTRIBUTION" ? <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5 text-right">SS</th><th className="px-3 py-2.5 text-right">EC</th><th className="px-3 py-2.5 text-right">Total Contribution</th></> : <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">Loan Account Number</th><th className="px-3 py-2.5 text-right">Loan Amount Due</th><th className="px-3 py-2.5 text-right">Total</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry, index) => { const bracket = getSssContributionBracket(Number(entry.monthlySalaryCredit)); const ss = bracket ? bracket.employerSs + bracket.employerMpf + bracket.employeeSs + bracket.employeeMpf : 0; return <tr key={kind === "LOAN" ? entry.sssLoanId ?? `${entry.employeeId}-${index}` : entry.employeeId}><td className="px-3 py-2.5 text-center text-slate-600">{index + 1}</td><td className="px-3 py-2.5 font-medium text-slate-800">{entry.employeeName}</td>{kind === "CONTRIBUTION" ? <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{bracket ? formatMoney(bracket.monthlySalaryCredit) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{bracket ? formatMoney(ss) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{bracket ? formatMoney(bracket.ec) : "—"}</td><td className="px-3 py-2.5 text-right font-bold text-slate-950">{bracket ? formatMoney(ss + bracket.ec) : "—"}</td></> : <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 font-mono text-slate-800">{entry.loanAccountNumber || "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatMoney(entry.loanAmount)}</td><td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatMoney(entry.loanAmount)}</td></>}</tr>; })}</tbody></table></div>
    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_-8px_16px_-12px_rgba(15,23,42,0.35)] backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6"><span>Employee Count: <strong className="text-slate-950">{entries.length}</strong></span><span>Generated Amount Due: <strong className="text-slate-950">{formatMoney(draft.amountDue)}</strong></span></div>
  </div>;
}

function ReportSavedView({ report }: { report: Report }) {
  const employerLabel = reportEmployerLabel(report.entries, report.employerName);
  return <div className="space-y-5">
    <div className="grid gap-6 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
      <div className="grid content-start gap-x-8 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><p className="text-base font-semibold leading-snug text-slate-900">{employerLabel}</p><p className="text-sm leading-relaxed text-slate-700">{report.employerAddress || "?"}</p><p className="font-mono text-sm text-slate-700">{report.employerSssNumber || "?"}</p></div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2"><Info label="PRN:" value={report.prn} /><Info label="Applicable Date:" value={monthEnd(report.applicableMonth, report.applicableYear)} /></div>
      </div>
      <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Payment Details</h3>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Info label="Trans Ref#" value={report.transactionReference} />
          <Info label="Pay Date" value={dateOnly(report.payDate)} />
          <Info label="Branch" value={report.sssBranch} />
          <Info label="Pay Type" value={report.paymentType} />
        </div>
      </div>
      <div className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <div><p className="text-xs font-semibold text-slate-500">Amount Due:</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</p></div>
        <div className="border-slate-200 sm:border-l sm:pl-5 lg:pl-6"><p className="text-xs font-semibold text-slate-500">Amount Paid:</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{report.amountPaid ? formatMoney(report.amountPaid) : "Not entered"}</p></div>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[940px] w-full text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-3 py-2.5 text-center">#</th><th className="px-3 py-2.5">Name</th>{report.kind === "CONTRIBUTION" ? <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5 text-right">SS</th><th className="px-3 py-2.5 text-right">EC</th><th className="px-3 py-2.5 text-right">Total Contribution</th></> : <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">Loan Account Number</th><th className="px-3 py-2.5 text-right">Loan Amount Due</th><th className="px-3 py-2.5 text-right">Total</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{report.entries.map((entry, index) => { const ss = Number(entry.employerSs) + Number(entry.employerMpf) + Number(entry.employeeSs) + Number(entry.employeeMpf); return <tr key={entry.id}><td className="px-3 py-2.5 text-center text-slate-600">{index + 1}</td><td className="px-3 py-2.5 font-medium text-slate-800">{entry.employeeName}</td>{report.kind === "CONTRIBUTION" ? <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{entry.monthlySalaryCredit ? formatMoney(entry.monthlySalaryCredit) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{formatMoney(ss)}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{formatMoney(entry.ec)}</td><td className="px-3 py-2.5 text-right font-bold text-slate-950">{formatMoney(ss + Number(entry.ec))}</td></> : <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 font-mono text-slate-800">{entry.loanAccountNumber || "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatMoney(entry.loanAmount)}</td><td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatMoney(entry.totalAmount)}</td></>}</tr>; })}</tbody></table></div>
  </div>;
}

function LoanDetail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
  </div>;
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value || "—"}</p></div>;
}

function ContributionTableDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="SSS Contribution Table" subtitle="Business employers and employees · Effective January 1, 2025" onClose={onClose} wide>
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Official schedule for review.</strong> Regular SS is 10% employer and 5% employee up to ₱20,000 MSC. Above ₱20,000, MPF applies at 10% employer and 5% employee. EC is employer-paid: ₱10 for MSC through ₱14,500; ₱30 from ₱15,000.</div>
    <div className="overflow-auto rounded-xl border border-slate-200"><table className="min-w-[1050px] w-full text-right text-xs text-slate-800"><thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2.5 text-left">Compensation Range</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5">SS ER</th><th className="px-3 py-2.5">MPF ER</th><th className="px-3 py-2.5">EC ER</th><th className="px-3 py-2.5">ER Total</th><th className="px-3 py-2.5">SS EE</th><th className="px-3 py-2.5">MPF EE</th><th className="px-3 py-2.5">EE Total</th><th className="px-3 py-2.5">Combined</th></tr></thead><tbody className="divide-y divide-slate-100">{SSS_CONTRIBUTION_TABLE.map((row) => <tr key={row.key} className={row.monthlySalaryCredit > 20_000 ? "bg-blue-50/50" : "bg-white"}><td className="px-3 py-2 text-left">{row.range}</td><td className="px-3 py-2">{formatMoney(row.monthlySalaryCredit)}</td><td className="px-3 py-2">{formatMoney(row.employerSs)}</td><td className="px-3 py-2">{formatMoney(row.employerMpf)}</td><td className="px-3 py-2">{formatMoney(row.ec)}</td><td className="px-3 py-2 font-semibold">{formatMoney(row.employerSs + row.employerMpf + row.ec)}</td><td className="px-3 py-2">{formatMoney(row.employeeSs)}</td><td className="px-3 py-2">{formatMoney(row.employeeMpf)}</td><td className="px-3 py-2 font-semibold">{formatMoney(row.employeeSs + row.employeeMpf)}</td><td className="px-3 py-2 font-bold text-slate-900">{formatMoney(row.total)}</td></tr>)}</tbody></table></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Source: <a href="https://www.sss.gov.ph/wp-content/uploads/2024/12/CI-2024-006-Publication.pdf" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">SSS Circular 2024-006</a>. The table applies MPF where MSC is above ₱20,000.</p><button type="button" onClick={onClose} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Done reviewing</button></div>
    <p className="sr-only">Contribution table effective {SSS_CONTRIBUTION_EFFECTIVE_DATE}.</p>
  </Modal>;
}
