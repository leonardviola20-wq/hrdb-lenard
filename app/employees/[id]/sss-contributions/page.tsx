"use client";

import { useParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronLeftIcon, EyeIcon, InformationCircleIcon, ListBulletIcon, PencilSquareIcon, Squares2X2Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { HistoryBackLink } from "@/components/HistoryBackLink";
import { useAppHeaderActions } from "@/components/Sidebar";
import { buildSssContributionMatrix, type SssContributionHistory } from "@/lib/sssContributionHistory";
import { getSssLoanFirstAmortizationDate, parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { getSssLoanTypeLabel, isSssLoanType, sssLoanTypes } from "@/lib/sssLoanTypes";
import { isSssLoanStatus, type SssLoanStatus } from "@/lib/sssLoanStatus";

type ContributionsEmployee = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  sssNumber: string | null;
};

type ContributionsResponse = SssContributionHistory & {
  employeeId: number;
  employee?: ContributionsEmployee;
  error?: string;
};

type SssLoanReport = {
  id: number;
  reportId: number;
  employerName: string;
  prn: string;
  applicableMonth: number;
  applicableYear: number;
  amount: string;
  payDate: string | null;
  sssBranch: string | null;
  transactionReference: string | null;
};

type SssLoanAccount = {
  id: number | null;
  loanAccountNumber: string;
  transactionNumber: string | null;
  loanType: string | null;
  loanDate: string | null;
  loanAmount: string | null;
  monthlyAmortization: string | null;
  status: string | null;
  statusReason: string | null;
  reports: SssLoanReport[];
};

type SssLoanHistoryResponse = {
  employee?: ContributionsEmployee;
  canEditLoans?: boolean;
  loans?: SssLoanAccount[];
  error?: string;
};

type SssLoanEditForm = {
  loanAccountNumber: string;
  transactionNumber: string;
  loanType: string;
  loanDate: string;
  loanAmount: string;
  monthlyAmortization: string;
  status: SssLoanStatus;
  reason: string;
};

type ContributionsView = "table" | "list";

type ContributionsResult = {
  employeeId: string;
  employee: ContributionsEmployee | null;
  history: SssContributionHistory;
};

type ContributionsFailure = { employeeId: string; message: string };

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthHeaders = monthNames.map((name) => name.slice(0, 3));
const moneyFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0.00";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? moneyFormat.format(parsed) : "0.00";
}

function formatPeriod(year: number, month: number) {
  return `${monthNames[month - 1] ?? String(month)} ${year}`;
}

function formatPaymentDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function formatLoanListDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${month}/${day}/${year}` : "—";
}

function buildSssLoanMatrix(reports: SssLoanReport[]) {
  const years = new Map<number, number[]>();
  for (const report of reports) {
    const amounts = years.get(report.applicableYear) ?? Array.from({ length: 12 }, () => 0);
    const monthIndex = report.applicableMonth - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      const amountCents = Math.round((Number(report.amount) || 0) * 100);
      amounts[monthIndex] += amountCents;
    }
    years.set(report.applicableYear, amounts);
  }
  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, months]) => ({ year, months }));
}

export default function EmployeeSssContributionsPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const setAppHeaderActions = useAppHeaderActions();
  const [result, setResult] = useState<ContributionsResult | null>(null);
  const [failure, setFailure] = useState<ContributionsFailure | null>(null);
  const [view, setView] = useState<ContributionsView>("table");
  const [recordType, setRecordType] = useState<"CONTRIBUTION" | "LOAN">("CONTRIBUTION");
  const [loanTypeFilter, setLoanTypeFilter] = useState<{ employeeId: string; type: string }>({ employeeId, type: "ALL" });
  const selectedLoanType = loanTypeFilter.employeeId === employeeId ? loanTypeFilter.type : "ALL";
  const [loanStatusFilter, setLoanStatusFilter] = useState<{ employeeId: string; status: "ALL" | "ACTIVE" | "INACTIVE" }>({ employeeId, status: "ALL" });
  const selectedLoanStatus = loanStatusFilter.employeeId === employeeId ? loanStatusFilter.status : "ALL";
  const [paymentDetailsLoan, setPaymentDetailsLoan] = useState<{ employeeId: string; loan: SssLoanAccount } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const historyRefreshTimerRef = useRef<number | null>(null);
  const [loanHistory, setLoanHistory] = useState<{ employeeId: string; loans: SssLoanAccount[] } | null>(null);
  const [loanFailure, setLoanFailure] = useState<ContributionsFailure | null>(null);
  const [canEditLoans, setCanEditLoans] = useState(false);
  const [loanEditTarget, setLoanEditTarget] = useState<SssLoanAccount | null>(null);
  const [loanEditForm, setLoanEditForm] = useState<SssLoanEditForm>({
    loanAccountNumber: "",
    transactionNumber: "",
    loanType: "S",
    loanDate: "",
    loanAmount: "",
    monthlyAmortization: "",
    status: "ACTIVE",
    reason: "",
  });
  const [loanEditSaving, setLoanEditSaving] = useState(false);
  const [loanEditError, setLoanEditError] = useState("");

  useEffect(() => {
    setAppHeaderActions({ actions: null, backHref: `/employees/${employeeId}?tab=Government`, hideBack: true });
    return () => setAppHeaderActions(null);
  }, [employeeId, setAppHeaderActions]);

  useEffect(() => {
    const refreshHistory = () => {
      if (historyRefreshTimerRef.current !== null) window.clearTimeout(historyRefreshTimerRef.current);
      historyRefreshTimerRef.current = window.setTimeout(() => {
        historyRefreshTimerRef.current = null;
        setHistoryRefreshKey((current) => current + 1);
      }, 120);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshHistory();
    };
    window.addEventListener("focus", refreshHistory);
    window.addEventListener("pageshow", refreshHistory);
    window.addEventListener("hrdb-sss-records-updated", refreshHistory);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      if (historyRefreshTimerRef.current !== null) window.clearTimeout(historyRefreshTimerRef.current);
      window.removeEventListener("focus", refreshHistory);
      window.removeEventListener("pageshow", refreshHistory);
      window.removeEventListener("hrdb-sss-records-updated", refreshHistory);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!paymentDetailsLoan) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaymentDetailsLoan(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paymentDetailsLoan]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employees/${employeeId}/sss-contributions`, { cache: "no-store" })
      .then(async (response) => {
        const data: ContributionsResponse = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load SSS contributions");
        if (cancelled) return;
        setResult({
          employeeId,
          employee: data.employee ?? null,
          history: { totalAmount: data.totalAmount, entryCount: data.entryCount, months: data.months ?? [] },
        });
        setFailure(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setFailure({ employeeId, message: loadError instanceof Error ? loadError.message : "Unable to load SSS contributions" });
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, historyRefreshKey]);

  useEffect(() => {
    if (recordType !== "LOAN") return;
    let cancelled = false;
    fetch(`/api/employees/${employeeId}/sss-loans`, { cache: "no-store" })
      .then(async (response) => {
        const data: SssLoanHistoryResponse = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load SSS loan reports");
        if (cancelled) return;
        setLoanHistory({ employeeId, loans: data.loans ?? [] });
        setCanEditLoans(data.canEditLoans === true);
        setLoanFailure(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setLoanFailure({ employeeId, message: loadError instanceof Error ? loadError.message : "Unable to load SSS loan reports" });
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, recordType, historyRefreshKey]);

  const currentResult = result && result.employeeId === employeeId ? result : null;
  const currentFailure = failure && failure.employeeId === employeeId ? failure : null;
  const loading = !currentResult && !currentFailure;
  const history = currentResult?.history ?? null;
  const employee = currentResult?.employee ?? null;
  const currentLoans = loanHistory?.employeeId === employeeId ? loanHistory.loans : null;
  const loanTypeOptions = [...new Set((currentLoans ?? []).map((loan) => loan.loanType || "UNKNOWN"))].sort((left, right) => {
    const leftLabel = isSssLoanType(left) ? getSssLoanTypeLabel(left) : left;
    const rightLabel = isSssLoanType(right) ? getSssLoanTypeLabel(right) : right;
    return leftLabel.localeCompare(rightLabel);
  });
  const visibleLoans = (currentLoans ?? []).filter((loan) => {
    const matchesType = selectedLoanType === "ALL" || (loan.loanType || "UNKNOWN") === selectedLoanType;
    const matchesStatus = selectedLoanStatus === "ALL"
      || (selectedLoanStatus === "ACTIVE" ? loan.status === "ACTIVE" : loan.status !== "ACTIVE");
    return matchesType && matchesStatus;
  });
  const currentLoanFailure = loanFailure?.employeeId === employeeId ? loanFailure : null;
  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")
    : "Employee";
  const matrix = history ? buildSssContributionMatrix(history) : [];
  const yearOptions = useMemo(
    () => [...new Set((history?.months ?? []).map((month) => month.year))].sort((left, right) => right - left),
    [history],
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = selectedYear !== null && yearOptions.includes(selectedYear) ? selectedYear : yearOptions[0] ?? null;
  const selectedYearMonths = useMemo(
    () => history && activeYear !== null
      ? Array.from({ length: 12 }, (_, index) => history.months.find((month) => month.year === activeYear && month.month === index + 1) ?? {
        year: activeYear,
        month: index + 1,
        totalAmount: "0.00",
        entries: [],
      })
      : [],
    [activeYear, history],
  );
  const selectedYearEntryCount = selectedYearMonths.reduce((sum, month) => sum + month.entries.length, 0);
  const selectedYearTotalCents = selectedYearMonths.reduce(
    (sum, month) => sum + Math.round(Number(month.totalAmount) * 100),
    0,
  );

  const openLoanEdit = (loan: SssLoanAccount) => {
    if (loan.id === null) return;
    setLoanEditTarget(loan);
    setLoanEditForm({
      loanAccountNumber: loan.loanAccountNumber,
      transactionNumber: loan.transactionNumber ?? "",
      loanType: isSssLoanType(loan.loanType) ? loan.loanType : "S",
      loanDate: loan.loanDate ?? "",
      loanAmount: loan.loanAmount ?? "",
      monthlyAmortization: loan.monthlyAmortization ?? "",
      status: isSssLoanStatus(loan.status) ? loan.status : "ACTIVE",
      reason: loan.statusReason ?? "",
    });
    setLoanEditError("");
  };

  const saveLoanEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loanEditTarget || loanEditTarget.id === null) return;
    if (!parseSssLoanDateOnly(loanEditForm.loanDate)) {
      setLoanEditError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    if (!isSssLoanType(loanEditForm.loanType) || !isSssLoanStatus(loanEditForm.status)) {
      setLoanEditError("Choose a valid loan type and status.");
      return;
    }
    setLoanEditSaving(true);
    setLoanEditError("");
    try {
      const response = await fetch(`/api/reports/sss/loans/${loanEditTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanAccountNumber: loanEditForm.loanAccountNumber,
          transactionNumber: loanEditForm.transactionNumber,
          loanType: loanEditForm.loanType,
          loanDate: loanEditForm.loanDate,
          loanAmount: loanEditForm.loanAmount,
          monthlyAmortization: loanEditForm.monthlyAmortization,
          status: loanEditForm.status,
          reason: loanEditForm.reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update SSS loan");
      setLoanEditTarget(null);
      window.dispatchEvent(new Event("hrdb-sss-records-updated"));
    } catch (saveError) {
      setLoanEditError(saveError instanceof Error ? saveError.message : "Unable to update SSS loan");
    } finally {
      setLoanEditSaving(false);
    }
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col">
        {loading ? (
          <p role="status" className="text-sm text-gray-600">Loading SSS reports...</p>
        ) : currentFailure ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{currentFailure.message}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{fullName}</p>
                  <p className="font-mono tabular-nums">{employee?.sssNumber || "Not set"}</p>
                </div>
              </div>
              <div aria-label={recordType === "CONTRIBUTION" ? "Overall contribution totals" : "Loan report totals"} className="ml-auto flex flex-wrap items-end gap-x-6 gap-y-2">
                {recordType === "CONTRIBUTION" ? <>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Contrib. Count</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">{history?.entryCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">₱{formatAmount(history?.totalAmount)}</p>
                  </div>
                </> : <>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Number of Loans</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">{visibleLoans.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Number of Active Loans</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">{visibleLoans.filter((loan) => loan.status === "ACTIVE").length}</p>
                  </div>
                </>}
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <HistoryBackLink
                fallbackHref={`/employees/${employeeId}?tab=Government`}
                aria-label="Back to employee profile"
                title="Back to employee profile"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
              </HistoryBackLink>
              <div role="group" aria-label="SSS report type" className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white p-0.5">
                <button type="button" aria-pressed={recordType === "CONTRIBUTION"} onClick={() => setRecordType("CONTRIBUTION")} title="Contribution reports" className={`h-8 rounded-md px-3 text-xs font-semibold transition ${recordType === "CONTRIBUTION" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Cont</button>
                <button type="button" aria-pressed={recordType === "LOAN"} onClick={() => setRecordType("LOAN")} title="Loan reports" className={`h-8 rounded-md px-3 text-xs font-semibold transition ${recordType === "LOAN" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Loan</button>
              </div>
              {recordType === "LOAN" && currentLoans && currentLoans.length > 0 && <div className="flex flex-wrap gap-2">
                <div className="relative flex items-center gap-1">
                  <select aria-label="Filter by Loan Status" value={selectedLoanStatus} onChange={(event) => setLoanStatusFilter({ employeeId, status: event.target.value as "ALL" | "ACTIVE" | "INACTIVE" })} className="h-9 min-w-[9rem] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  {selectedLoanStatus === "INACTIVE" && <span className="group relative inline-flex">
                    <button type="button" aria-label="About inactive loans" aria-describedby="inactive-loan-filter-tooltip" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <InformationCircleIcon aria-hidden="true" className="h-5 w-5" />
                    </button>
                    <span id="inactive-loan-filter-tooltip" role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-left text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      Inactive includes Paid, On-Hold, and Not connected loans.
                    </span>
                  </span>}
                </div>
                <select aria-label="Filter by Loan Type" value={selectedLoanType} onChange={(event) => setLoanTypeFilter({ employeeId, type: event.target.value })} className="h-9 min-w-[9rem] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                  <option value="ALL">All loan types</option>
                  {loanTypeOptions.map((loanType) => <option key={loanType} value={loanType}>{loanType === "UNKNOWN" ? "Unknown" : isSssLoanType(loanType) ? getSssLoanTypeLabel(loanType) : loanType}</option>)}
                </select>
              </div>}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
                {recordType === "CONTRIBUTION" && view === "list" && <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>Showing <span className="font-semibold text-gray-900">{selectedYearEntryCount}</span> of <span className="font-semibold text-gray-900">{history?.entryCount ?? 0}</span></span>
                  <select
                    aria-label="Filter contributions by year"
                    value={activeYear ?? ""}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>}
                <button
                  type="button"
                  aria-label={`Current view: ${view === "table" ? "table" : "list"}. Switch to ${view === "table" ? "list" : "table"} view`}
                  title={`Current view: ${view === "table" ? "Table" : "List"}. Switch to ${view === "table" ? "list" : "table"} view`}
                  onClick={() => setView((current) => (current === "table" ? "list" : "table"))}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {view === "table" ? <Squares2X2Icon aria-hidden="true" className="h-5 w-5" /> : <ListBulletIcon aria-hidden="true" className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {recordType === "LOAN" ? (!currentLoans && !currentLoanFailure) ? (
              <p role="status" className="text-sm text-gray-600">Loading SSS loan reports...</p>
            ) : currentLoanFailure && !currentLoans ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{currentLoanFailure.message}</p>
            ) : !currentLoans || currentLoans.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">No saved SSS loan accounts or payment reports for this employee.</p>
            ) : visibleLoans.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">No {selectedLoanStatus === "ALL" ? "" : `${selectedLoanStatus.toLocaleLowerCase()} `}loans match these filters.</p>
            ) : view === "table" ? (
              <div className="space-y-4">
                {visibleLoans.map((loan) => {
                  const loanMatrix = buildSssLoanMatrix(loan.reports);
                  const loanType = isSssLoanType(loan.loanType) ? loan.loanType : null;
                  const loanDate = loan.loanDate ? new Date(`${loan.loanDate}T00:00:00.000Z`) : null;
                  const startDate = loanDate && loanType ? getSssLoanFirstAmortizationDate(loanDate, loanType) : null;
                  const today = new Date();
                  const startIsUrgent = startDate !== null && (startDate.getUTCFullYear() < today.getFullYear()
                    || (startDate.getUTCFullYear() === today.getFullYear() && startDate.getUTCMonth() <= today.getMonth()));
                  const isActive = loan.status === "ACTIVE";
                  const statusLabel = isActive ? "Active" : loan.status === "ON_HOLD" ? "Inactive" : loan.status || "—";
                  const paidReports = loan.reports.filter((report) => report.payDate !== null);
                  const paidAmountCents = paidReports.reduce((sum, report) => sum + Math.round((Number(report.amount) || 0) * 100), 0);
                  const hasLoanAmount = loan.loanAmount !== null && loan.loanAmount.trim() !== "" && Number.isFinite(Number(loan.loanAmount));
                  const currentBalance = hasLoanAmount ? Math.round(Number(loan.loanAmount) * 100) - paidAmountCents : null;
                  return (
                    <section key={loan.loanAccountNumber} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="w-full space-y-4 border-b border-gray-200 bg-gray-50 px-4 py-4 text-left text-sm">
                        {canEditLoans && loan.id !== null && <div className="flex justify-end">
                          <button type="button" onClick={() => openLoanEdit(loan)} aria-label={`Edit loan ${loan.loanAccountNumber}`} title="Edit loan" className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <PencilSquareIcon aria-hidden="true" className="h-4 w-4" /> Edit
                          </button>
                        </div>}
                        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Loan Type</span><span className="min-h-5 font-semibold leading-5 text-gray-900">{loanType ? getSssLoanTypeLabel(loanType) : loan.loanType || "—"}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Status</span><span className={`min-h-5 font-semibold leading-5 ${isActive ? "text-emerald-700" : "text-amber-700"}`}>{statusLabel}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Loan Account No.</span><span className="min-h-5 break-all font-semibold leading-5 text-gray-900">{loan.loanAccountNumber}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Loan Amount</span><span className="min-h-5 font-semibold leading-5 tabular-nums text-gray-900">{hasLoanAmount ? `₱${formatAmount(loan.loanAmount)}` : "-n.a.-"}</span></div>
                        </div>
                        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Loan Date</span><span className="min-h-5 font-semibold leading-5 text-gray-900">{loan.loanDate ? formatPaymentDate(loan.loanDate) : "—"}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Start Date</span><span className={`min-h-5 font-semibold leading-5 ${startDate ? startIsUrgent ? "text-rose-700" : "text-emerald-700" : "text-gray-900"}`}>{startDate ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(startDate) : "—"}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Monthly Amortization</span><span className="min-h-5 font-semibold leading-5 tabular-nums text-gray-900">₱{formatAmount(loan.monthlyAmortization)}</span></div>
                          <div className="flex min-w-0 flex-col items-start gap-1"><span className="min-h-4 text-xs font-medium leading-4 text-gray-500">Current Balance</span><span className="min-h-5 font-semibold leading-5 tabular-nums text-gray-900">{currentBalance === null ? "-n.a.-" : `₱${formatAmount(currentBalance / 100)}`}</span></div>
                        </div>
                      </div>
                      {loanMatrix.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-500">No loan payment amounts have been saved for this account.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[64rem] border-collapse text-right text-sm text-gray-900">
                            <caption className="sr-only">Loan payment amounts by year and month for account {loan.loanAccountNumber}</caption>
                            <thead><tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                              <th scope="col" className="px-3 py-2.5 text-left">Year</th>
                              {monthHeaders.map((month) => <th key={month} scope="col" className="px-3 py-2.5">{month}</th>)}
                            </tr></thead>
                            <tbody>{loanMatrix.map((row) => (
                              <tr key={row.year} className="border-b border-gray-100 last:border-b-0">
                                <th scope="row" className="px-3 py-2.5 text-left font-semibold">{row.year}</th>
                                {row.months.map((amountCents, index) => <td key={index} className={`px-3 py-2.5 tabular-nums ${amountCents === 0 ? "text-gray-400" : "font-semibold text-gray-900"}`}>{formatAmount(amountCents / 100)}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[70rem] table-fixed border-collapse text-left text-sm text-gray-900">
                  <caption className="sr-only">SSS loan account payment summaries</caption>
                  <tbody>{visibleLoans.map((loan) => {
                    const paidReports = loan.reports.filter((report) => report.payDate !== null);
                    const totalPaymentCents = paidReports.reduce((sum, report) => sum + Math.round((Number(report.amount) || 0) * 100), 0);
                    const loanType = isSssLoanType(loan.loanType) ? getSssLoanTypeLabel(loan.loanType) : loan.loanType || "—";
                    const statusLabel = loan.status === "ACTIVE" ? "Active" : loan.status === "ON_HOLD" ? "Inactive" : loan.status || "—";
                    const summaryCell = (label: string, value: ReactNode, align = "left") => <div className={`flex min-h-12 flex-col gap-1 ${align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left"}`}><span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span><span className="font-semibold tabular-nums text-gray-900">{value}</span></div>;
                    return <tr key={loan.loanAccountNumber} className="border-b border-gray-100 last:border-b-0">
                      <th scope="row" className="break-all px-3 py-3 align-top"><div className="flex flex-col items-start gap-1"><span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Loan Account Number</span><span className="font-semibold text-gray-900">{loan.loanAccountNumber}</span><span className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${loan.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{statusLabel}</span><button type="button" onClick={() => setPaymentDetailsLoan({ employeeId, loan })} aria-label={`View payments for loan ${loan.loanAccountNumber}`} title="View payments" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"><EyeIcon aria-hidden="true" className="h-4 w-4" /></button>{canEditLoans && loan.id !== null && <button type="button" onClick={() => openLoanEdit(loan)} aria-label={`Edit loan ${loan.loanAccountNumber}`} title="Edit loan" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"><PencilSquareIcon aria-hidden="true" className="h-4 w-4" /></button>}</span></div></th>
                      <td className="px-3 py-3 align-top">{summaryCell("Monthly Amortization", `₱${formatAmount(loan.monthlyAmortization)}`, "right")}</td>
                      <td className="px-3 py-3 align-top">{summaryCell("Loan Amount", loan.loanAmount === null ? "Unknown" : formatAmount(loan.loanAmount), "right")}</td>
                      <td className="px-3 py-3 align-top">{summaryCell("Loan Type", loanType)}</td>
                      <td className="px-3 py-3 align-top">{summaryCell("Loan Date", formatLoanListDate(loan.loanDate))}</td>
                      <td className="px-3 py-3 align-top">{summaryCell("No. of Payments", paidReports.length, "center")}</td>
                      <td className="px-3 py-3 align-top">{summaryCell("Total Payments", `₱${formatAmount(totalPaymentCents / 100)}`, "center")}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            ) : !history || history.entryCount === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">No saved SSS contribution entries for this employee.</p>
            ) : view === "table" ? (
              <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[64rem] border-collapse text-right text-sm text-gray-900">
                  <caption className="sr-only">SSS contributions by year and month</caption>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <th scope="col" className="px-3 py-2.5 text-left">Year</th>
                      {monthHeaders.map((label) => (
                        <th key={label} scope="col" className="px-3 py-2.5">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100">
                        <th scope="row" className="px-3 py-2.5 text-left font-semibold text-gray-900">{row.year}</th>
                        {row.months.map((amount, index) => (
                          <td
                            key={index}
                            className={`px-3 py-2.5 text-right tabular-nums ${amount === "0.00" ? "text-gray-400" : "font-semibold text-gray-900"}`}
                          >
                            {formatAmount(amount)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm">
                <span>Number of Contributions: <span className="font-semibold">{history.entryCount}</span></span>
                <span className="font-bold tabular-nums">Total Contribution: ₱{formatAmount(history.totalAmount)}</span>
              </div>
              </>
            ) : (
              <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[40rem] table-fixed border-collapse text-left text-sm text-gray-900">
                  <caption className="sr-only">Saved SSS contribution entries</caption>
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[30%]" />
                    <col className="w-[18%]" />
                    <col className="w-[17%]" />
                    <col className="w-[17%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      <th scope="col" className="px-3 py-2.5">Period</th>
                      <th scope="col" className="px-3 py-2.5">Employer</th>
                      <th scope="col" className="px-3 py-2.5">PRN</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Payment Date</th>
                      <th scope="col" className="px-3 py-2.5 pr-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedYearMonths.map((month) => month.entries.length > 0 ? (
                      <Fragment key={`${month.year}-${month.month}`}>
                        {month.entries.map((entry, entryIndex) => (
                          <tr key={entry.id} className="border-b border-gray-100">
                            <th scope="row" className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-gray-900">
                              {entryIndex === 0 ? (
                                formatPeriod(month.year, month.month)
                              ) : (
                                <span aria-hidden="true" className="text-gray-300">{formatPeriod(month.year, month.month)}</span>
                              )}
                            </th>
                            <td className="px-3 py-2.5">{entry.employerName}</td>
                            <td className="px-3 py-2.5">{entry.prn || "—"}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatPaymentDate(entry.payDate)}</td>
                            <td className="px-3 py-2.5 pr-4 text-right font-semibold tabular-nums">{formatAmount(entry.totalAmount)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ) : (
                      <tr key={`${month.year}-${month.month}-empty`} className="border-b border-gray-100 text-gray-400">
                        <th scope="row" className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500">{formatPeriod(month.year, month.month)}</th>
                        <td className="px-3 py-2.5">—</td>
                        <td className="px-3 py-2.5">—</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">—</td>
                        <td className="px-3 py-2.5 pr-4 text-right tabular-nums">0.00</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-gray-900">
                        Number of Contributions: {selectedYearEntryCount}
                      </td>
                      <td className="px-3 py-3 pr-4 text-right text-sm font-bold tabular-nums text-gray-900">
                        Amount Totals: ₱{formatAmount(selectedYearTotalCents / 100)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              </>
            )}
          </>
        )}
      </div>
      {loanEditTarget && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !loanEditSaving) setLoanEditTarget(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="employee-loan-edit-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <h2 id="employee-loan-edit-title" className="text-lg font-semibold text-gray-900">Update SSS Loan</h2>
              <p className="mt-1 text-sm text-gray-600">{loanEditTarget.loanAccountNumber}</p>
            </div>
            <button type="button" aria-label="Close edit loan" onClick={() => { if (!loanEditSaving) setLoanEditTarget(null); }} disabled={loanEditSaving} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"><XMarkIcon aria-hidden="true" className="h-5 w-5" /></button>
          </header>
          <form onSubmit={(event) => void saveLoanEdit(event)} className="min-h-0 space-y-4 overflow-y-auto p-5 sm:p-6">
            {loanEditError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loanEditError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Loan Account Number<input required maxLength={80} value={loanEditForm.loanAccountNumber} onChange={(event) => setLoanEditForm((current) => ({ ...current, loanAccountNumber: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-gray-700">Transaction Number<input maxLength={80} value={loanEditForm.transactionNumber} onChange={(event) => setLoanEditForm((current) => ({ ...current, transactionNumber: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-gray-700">Loan Type<select required value={loanEditForm.loanType} onChange={(event) => setLoanEditForm((current) => ({ ...current, loanType: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">{sssLoanTypes.map((loanType) => <option key={loanType.code} value={loanType.code}>{getSssLoanTypeLabel(loanType.code)}</option>)}</select></label>
              <label className="block text-sm font-medium text-gray-700">Loan Date<input required type="date" min="0001-01-01" max="9999-12-31" value={loanEditForm.loanDate} onChange={(event) => setLoanEditForm((current) => ({ ...current, loanDate: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-gray-700">Approved Loan Amount<input type="number" min="0.01" max="999999999.99" step="0.01" value={loanEditForm.loanAmount} onChange={(event) => setLoanEditForm((current) => ({ ...current, loanAmount: event.target.value }))} placeholder="Optional if unknown" className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-gray-700">Monthly Amortization<input required type="number" min="0.01" max="999999999.99" step="0.01" value={loanEditForm.monthlyAmortization} onChange={(event) => setLoanEditForm((current) => ({ ...current, monthlyAmortization: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-medium text-gray-700">Status<select required value={loanEditForm.status} onChange={(event) => {
                const status = event.target.value;
                if (isSssLoanStatus(status)) setLoanEditForm((current) => ({ ...current, status, reason: "" }));
              }} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="ACTIVE">Active</option><option value="ON_HOLD">On-Hold</option><option value="PAID">Paid</option><option value="NOT_CONNECTED">Not connected</option></select></label>
              {loanEditForm.status === "PAID" && <label className="block text-sm font-medium text-gray-700">Paid Reason<select required value={loanEditForm.reason} onChange={(event) => setLoanEditForm((current) => ({ ...current, reason: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Select reason</option><option value="APPLIED_FOR_NEW_LOAN">Applied for new loan</option><option value="FULLY_PAID">Fully paid</option></select></label>}
              {loanEditForm.status === "NOT_CONNECTED" && <p className="self-end rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Reason: Resigned</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setLoanEditTarget(null)} disabled={loanEditSaving} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={loanEditSaving || (loanEditForm.status === "PAID" && !loanEditForm.reason)} className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loanEditSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </section>
      </div>}
      {paymentDetailsLoan?.employeeId === employeeId && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentDetailsLoan(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="loan-payments-title" className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <h2 id="loan-payments-title" className="text-lg font-semibold text-gray-900">Payments Made</h2>
              <p className="mt-1 text-sm text-gray-600">Loan Account Number: <span className="font-semibold text-gray-900">{paymentDetailsLoan.loan.loanAccountNumber}</span></p>
            </div>
            <button type="button" aria-label="Close payments" onClick={() => setPaymentDetailsLoan(null)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><XMarkIcon aria-hidden="true" className="h-5 w-5" /></button>
          </header>
          <div className="min-h-0 overflow-auto p-4 sm:p-6">
            {paymentDetailsLoan.loan.reports.filter((report) => report.payDate !== null).length === 0 ? <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">No payments have been recorded for this loan account.</p> : <table className="w-full min-w-[62rem] border-collapse text-left text-sm text-gray-900">
              <thead className="sticky top-0 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600"><tr className="border-b border-gray-200">
                <th scope="col" className="px-3 py-2.5">Period</th><th scope="col" className="px-3 py-2.5">Employer</th><th scope="col" className="px-3 py-2.5">PRN</th><th scope="col" className="px-3 py-2.5">Payment Date</th><th scope="col" className="px-3 py-2.5 text-right">Amount Due</th><th scope="col" className="px-3 py-2.5">Trans Ref</th><th scope="col" className="px-3 py-2.5">Branch</th>
              </tr></thead>
              <tbody>{paymentDetailsLoan.loan.reports.filter((report) => report.payDate !== null).map((report) => <tr key={report.id} className="border-b border-gray-100 last:border-0">
                <td className="whitespace-nowrap px-3 py-3">{formatPeriod(report.applicableYear, report.applicableMonth)}</td><td className="px-3 py-3">{report.employerName}</td><td className="px-3 py-3">{report.prn || "—"}</td><td className="whitespace-nowrap px-3 py-3">{formatPaymentDate(report.payDate)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">₱{formatAmount(report.amount)}</td><td className="px-3 py-3">{report.transactionReference || "—"}</td><td className="px-3 py-3">{report.sssBranch || "—"}</td>
              </tr>)}</tbody>
            </table>}
          </div>
        </section>
      </div>}
    </main>
  );
}
