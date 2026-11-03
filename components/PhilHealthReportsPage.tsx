"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getPhilHealthShares } from "@/lib/philHealthReportTotals";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, BanknotesIcon, ChevronDownIcon, ChevronLeftIcon, EllipsisVerticalIcon, EyeIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Employee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  biometricNo?: string | null;
  status: string | null;
  philHealth: string | null;
  employerName: string | null;
  assignedToSelectedEmployer?: boolean;
  philHealthAccount?: { id: number; active: boolean } | null;
};
type Payment = {
  id: number;
  payorName: string;
  pen: string;
  spa: string | null;
  applicablePeriod: string;
  amountPaid: string;
  accreditedCollectingAgent: string | null;
  transactionConfirmationNumber: string | null;
  transactionDate: string;
  eparNumber: string | null;
  eparDate: string | null;
};
type ReportEntry = {
  id: number;
  employeeId: number | null;
  employeeName: string;
  employeeCode: string;
  employeePhilHealthNumber: string | null;
  amount: string;
};
type Report = {
  id: number;
  employerName: string;
  employerPhicNumber: string | null;
  applicableMonth: number;
  applicableYear: number;
  amountDue: string;
  entries: ReportEntry[];
  payment: Payment | null;
};
type Employer = { id: number; name: string; phic: string | null };
type PaymentForm = {
  payorName: string;
  pen: string;
  spa: string;
  applicablePeriod: string;
  amountPaid: string;
  accreditedCollectingAgent: string;
  transactionConfirmationNumber: string;
  transactionDate: string;
  eparNumber: string;
  eparDate: string;
  adjustments: string;
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const employeePageSize = 10;
const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-700";
const fullName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};
const employeeNameWithBoldFirstName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => (
  <>
    {employee.lastName},{" "}
    <span className="font-bold">{employee.firstName}</span>
    {employee.middleName?.trim().charAt(0) ? ` ${employee.middleName.trim().charAt(0).toLocaleUpperCase()}.` : ""}
  </>
);
const money = (amount: number | string) => `₱${(Number(amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const period = (report: Pick<Report, "applicableMonth" | "applicableYear">) => `${months[report.applicableMonth - 1]} ${report.applicableYear}`;
const emptyPaymentForm = (report: Report, employer: Employer | null): PaymentForm => ({
  payorName: report.payment?.payorName ?? employer?.name ?? "",
  pen: report.payment?.pen ?? report.employerPhicNumber ?? employer?.phic ?? "",
  spa: report.payment?.spa ?? "",
  applicablePeriod: report.payment?.applicablePeriod ?? period(report),
  amountPaid: report.payment?.amountPaid ?? report.amountDue,
  accreditedCollectingAgent: report.payment?.accreditedCollectingAgent ?? "",
  transactionConfirmationNumber: report.payment?.transactionConfirmationNumber ?? "",
  transactionDate: report.payment?.transactionDate ?? "",
  eparNumber: report.payment?.eparNumber ?? "",
  eparDate: report.payment?.eparDate ?? "",
  adjustments: "",
});

export default function PhilHealthReportsPage() {
  return <Suspense fallback={<main className="min-h-0 flex-1 bg-slate-50 p-4 sm:p-6" />}><PhilHealthReportsContent /></Suspense>;
}

function PhilHealthReportsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedEmployerId = params.get("employerId") ?? "";
  const employerNumber = Number(requestedEmployerId);
  const employerId = Number.isSafeInteger(employerNumber) && employerNumber > 0 ? String(employerNumber) : "";
  const view = params.get("view") === "employees" ? "employees" : "reports";
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [employeePage, setEmployeePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentSavedOpen, setPaymentSavedOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [accountEmployeePickerOpen, setAccountEmployeePickerOpen] = useState(false);
  const [accountEmployeeSearch, setAccountEmployeeSearch] = useState("");
  const accountPickerRef = useRef<HTMLDivElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm | null>(null);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState(String(new Date().getFullYear()));
  const [reportPage, setReportPage] = useState(1);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  const reportPageSize = 10;

  useEffect(() => {
    if (!paymentSavedOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaymentSavedOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [paymentSavedOpen]);

  useEffect(() => {
    if (!employerId) return;
    const context = `${employerId}:${view}`;
    const endpoint = view === "employees"
      ? `/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`
      : `/api/reports/philhealth/reports?employerId=${encodeURIComponent(employerId)}`;
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load PhilHealth records");
        return data;
      })
      .then((data) => {
        setError("");
        if (view === "employees") {
          setEmployer(data.employer as Employer);
          setEmployees(data.employees as Employee[]);
        } else {
          setEmployer(data.employer as Employer);
          setReports(data.reports as Report[]);
          setCanEditPayments(data.canEditPayments === true);
        }
        setLoadedContext(context);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setEmployees([]);
        setReports([]);
        setCanEditPayments(false);
        setLoadedContext(context);
        setError(loadError instanceof Error ? loadError.message : "Unable to load PhilHealth records");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [employerId, refreshKey, view]);

  useEffect(() => {
    if (!accountEmployeePickerOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountPickerRef.current?.contains(event.target)) {
        setAccountEmployeePickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [accountEmployeePickerOpen]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      const active = employee.philHealthAccount?.active ?? false;
      const statusMatches = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      const searchMatches = !query || [fullName(employee), employee.biometricNo, employee.philHealth, employee.status, employee.employerName]
        .some((value) => value?.toLocaleLowerCase().includes(query));
      return statusMatches && searchMatches;
    });
  }, [employees, search, statusFilter]);
  useEffect(() => {
    if (reportMenuOpen === null) return;
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

  const activeEmployees = employees.filter((employee) => employee.philHealthAccount?.active);
  const reportYears = useMemo(() => Array.from(new Set([new Date().getFullYear(), ...reports.map((report) => report.applicableYear)])).sort((a, b) => b - a), [reports]);
  const filteredReports = useMemo(() => {
    const query = reportSearch.trim().toLocaleLowerCase();
    return reports.filter((report) => {
      if (reportYearFilter !== "ALL" && String(report.applicableYear) !== reportYearFilter) return false;
      if (!query) return true;
      return [period(report), report.employerName, report.payment?.transactionDate, report.payment?.transactionConfirmationNumber, report.payment?.eparNumber]
        .some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [reports, reportSearch, reportYearFilter]);
  const reportPageCount = Math.max(1, Math.ceil(filteredReports.length / reportPageSize));
  const currentReportPage = Math.min(reportPage, reportPageCount);
  const visibleReports = filteredReports.slice((currentReportPage - 1) * reportPageSize, currentReportPage * reportPageSize);
  const displayedReports = useMemo(() => {
    if (reportYearFilter === "ALL") return visibleReports;
    const year = Number(reportYearFilter);
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const existing = reports.find((report) => report.applicableYear === year && report.applicableMonth === month);
      return existing ?? ({ id: -month, applicableMonth: month, applicableYear: year, employerName: "", employerPhicNumber: null, amountDue: "0", entries: [], payment: null } as Report);
    });
  }, [reportYearFilter, reports, visibleReports]);
  const accountEmployeeQuery = accountEmployeeSearch.trim().toLocaleLowerCase();
  const accountEmployeeMatches = (employee: Employee) =>
    !accountEmployeeQuery ||
    [fullName(employee), employee.philHealth, employee.employerName, employee.biometricNo, employee.status]
      .some((value) => value?.toLocaleLowerCase().includes(accountEmployeeQuery));
  const accountAssignedEmployees = employeeOptions.filter((employee) => employee.assignedToSelectedEmployer && !employee.philHealthAccount && accountEmployeeMatches(employee));
  const accountOtherEmployees = employeeOptions.filter((employee) => !employee.assignedToSelectedEmployer && !employee.philHealthAccount && accountEmployeeMatches(employee));
  const selectedAccountEmployee = employeeOptions.find((employee) => String(employee.id) === selectedEmployeeId);

  // Render-side PS/ES defaults so year change auto-fills without a state effect
  const year = Number(reportYear);
  const shares = getPhilHealthShares(year);
  const defaultPs = shares ? (shares.psCents / 100).toFixed(2) : "0.00";
  const defaultEs = shares ? (shares.esCents / 100).toFixed(2) : "0.00";

  const activeCount = employees.filter((employee) => employee.philHealthAccount?.active).length;
  const inactiveCount = employees.filter((employee) => employee.philHealthAccount && !employee.philHealthAccount.active).length;
  const reportAmountDue = activeEmployees.reduce((sum) => sum + Number(defaultPs) + Number(defaultEs), 0);
  const employeePageCount = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const currentEmployeePage = Math.min(employeePage, employeePageCount);
  const visibleEmployees = filteredEmployees.slice((currentEmployeePage - 1) * employeePageSize, currentEmployeePage * employeePageSize);
  const firstEmployeeResult = filteredEmployees.length ? (currentEmployeePage - 1) * employeePageSize + 1 : 0;
  const lastEmployeeResult = Math.min(currentEmployeePage * employeePageSize, filteredEmployees.length);

  const openAccountForm = async () => {
    setAccountOpen(true);
    setSelectedEmployeeId("");
    setAccountEmployeePickerOpen(false);
    setAccountEmployeeSearch("");
    setError("");
    try {
      const response = await fetch(`/api/reports/philhealth/employees?all=1&employerId=${encodeURIComponent(employerId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employees");
      setEmployer(data.employer as Employer);
      setEmployeeOptions(data.employees as Employee[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load employees");
    }
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployeeId) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/reports/philhealth/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: Number(employerId), employeeId: Number(selectedEmployeeId) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save PhilHealth account");
      setAccountOpen(false);
      setNotice("PhilHealth account added to this employer.");
      setStatusFilter("ACTIVE");
      setSearch("");
      setEmployeePage(1);
      setLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save PhilHealth account");
    } finally {
      setSaving(false);
    }
  };

  const setAccountActive = async (accountId: number, active: boolean) => {
    setError("");
    try {
      const response = await fetch(`/api/reports/philhealth/employees/${accountId}?employerId=${encodeURIComponent(employerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update account status");
      setEmployees((current) => current.map((employee) => employee.philHealthAccount?.id === accountId
        ? { ...employee, philHealthAccount: { id: accountId, active } }
        : employee));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update account status");
    }
  };

  const openPaymentForm = (report: Report) => {
    setPaymentReport(report);
    setPaymentForm(emptyPaymentForm(report, employer));
  };

  const openReportForm = async () => {
    setError("");
    if (employerId && view === "reports") {
      try {
        const response = await fetch(`/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`, { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setEmployer(data.employer as Employer);
          setEmployees(data.employees as Employee[]);
        }
      } catch {
        // Keep the dialog usable with any employee data already loaded.
      }
    }
    setReportOpen(true);
  };

  const createReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = activeEmployees
      .map((employee) => {
        const ps = Number(defaultPs);
        const es = Number(defaultEs);
        const total = ps + es;
        return { employeeId: employee.id, amount: total > 0 ? total.toFixed(2) : "" };
      })
      .filter((entry) => entry.amount.trim() !== "");
    if (!entries.length) {
      setError("Enter an amount for at least one active employee.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/reports/philhealth/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId: Number(employerId),
          applicableMonth: Number(reportMonth),
          applicableYear: Number(reportYear),
          entries,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create contribution report");
      setReportOpen(false);
      setNotice(`PhilHealth report created. Amount due: ${money((data.report as Report).amountDue)}.`);
      setLoading(true);
      setRefreshKey((current) => current + 1);
      router.push(`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create contribution report");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentReport || !paymentForm) return;
    setSaving(true);
    setError("");
    try {
      const amountPaid = Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0);
      const response = await fetch(`/api/reports/philhealth/reports/${paymentReport.id}/payment?employerId=${encodeURIComponent(employerId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...paymentForm, amountPaid: amountPaid.toFixed(2) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save payment details");
      setPaymentReport(null);
      setPaymentForm(null);
      setViewReport((current) => (current && current.id === paymentReport.id
        ? { ...current, payment: data.payment as Payment }
        : current));
      setPaymentSavedOpen(true);
      setLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/philhealth/reports/${deleteReportTarget.id}?employerId=${encodeURIComponent(employerId)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to delete PhilHealth report");
      }
      const deletedId = deleteReportTarget.id;
      setDeleteReportTarget(null);
      setViewReport((current) => (current?.id === deletedId ? null : current));
      if (paymentReport?.id === deletedId) {
        setPaymentReport(null);
        setPaymentForm(null);
      }
      setNotice("PhilHealth report deleted.");
      setLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete PhilHealth report");
    } finally {
      setSaving(false);
    }
  };

  const title = view === "employees" ? "Employee List" : "Monthly Contribution Reports";

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-0 sm:p-2 lg:p-4">
      <section className="benefit-report-header shrink-0 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/reports?employerId=${encodeURIComponent(employerId)}`} aria-label="Back to Reports" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Benefits reports</p>
              <h1 className="benefit-report-title">PhilHealth {title}</h1>
              {employer && <p className="truncate text-sm font-semibold text-slate-700">{employer.name} · {employer.phic || "—"}</p>}
            </div>
          </div>
          {employerId && <nav aria-label="PhilHealth report pages" className="flex flex-wrap gap-2">
            {view !== "employees" && <Link href={`/reports/philhealth?view=employees&employerId=${encodeURIComponent(employerId)}`} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Employee List</Link>}
            {view !== "reports" && <Link href={`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`} className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reports</Link>}
          </nav>}
        </div>
        {view === "employees" && employerId && <div className="benefit-report-toolbar mt-3 min-w-0 overflow-x-auto border-t border-slate-100 pt-3">
          <button type="button" onClick={() => void openAccountForm()} className="benefit-report-primary"><PlusIcon className="h-4 w-4" />Add</button>
          <input aria-label="Search employees" value={search} onChange={(event) => { setSearch(event.target.value); setEmployeePage(1); }} placeholder="Search employees" className="h-10 min-w-40 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs" />
          <select aria-label="Account status filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setEmployeePage(1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">
            <option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("ACTIVE"); setEmployeePage(1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset</button>
        </div>}
        {view === "reports" && <div className="benefit-report-toolbar mt-3 min-w-0 overflow-x-auto border-t border-slate-100 pt-3">
          {employerId && <button type="button" onClick={() => void openReportForm()} className="benefit-report-primary"><PlusIcon className="h-4 w-4" />Create Monthly Report</button>}
          <input aria-label="Search reports" value={reportSearch} onChange={(event) => { setReportSearch(event.target.value); setReportPage(1); }} placeholder="Search reports" className="h-10 min-w-40 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs" />
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
            <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
              <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>
                <thead className="sticky top-0 z-10"><tr><th className="px-3 py-2">Employee Name</th><th className="px-3 py-2">PhilHealth No.</th><th className="px-3 py-2 text-right">PS</th><th className="px-3 py-2 text-right">ES</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 whitespace-nowrap text-center">Account Status</th><th className="px-3 py-2 text-center">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEmployees.map((employee) => {
                    const account = employee.philHealthAccount;
                    return <tr key={employee.id} className="hover:bg-slate-50 h-8">
                      <td className="px-3 py-1 font-semibold">{fullName(employee)}</td>
                      <td className="px-3 py-1 tabular-nums">{employee.philHealth || "—"}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{account?.active ? money(defaultPs) : "—"}</td>
                      <td className="px-3 py-1 text-right tabular-nums">{account?.active ? money(defaultEs) : "—"}</td>
                      <td className="px-3 py-1 text-right font-semibold tabular-nums">{account?.active ? money(Number(defaultPs) + Number(defaultEs)) : "—"}</td>
                      <td className="px-3 py-1 text-center">{account ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${account.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{account.active ? "Active" : "Inactive"}</span> : <span className="text-xs text-slate-500">Not added</span>}</td>
                      <td className="px-3 py-1 text-center">{account ? <button type="button" onClick={() => void setAccountActive(account.id, !account.active)} aria-label={account.active ? "Set inactive" : "Set active"} title={account.active ? "Set inactive" : "Set active"} className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">{account.active ? "Set inactive" : "Set active"}</button> : <span className="text-xs text-slate-400">Add account</span>}</td>
                    </tr>;
                  })}
                  {!visibleEmployees.length && <tr><td colSpan={7} className="h-11 px-4 text-center text-sm text-slate-600">No employees match your search.</td></tr>}
                  {Array.from({ length: employeePageSize - Math.max(visibleEmployees.length, 1) }, (_, index) => <tr key={`empty-${index}`} aria-hidden="true" className="h-8"><td colSpan={7} className="h-8 p-0" /></tr>)}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td colSpan={2} className="px-3 py-2 text-slate-800">Employer Employee List</td><td className="px-3 py-2 text-right tabular-nums">{money(activeCount * Number(defaultPs))}</td><td className="px-3 py-2 text-right tabular-nums">{money(activeCount * Number(defaultEs))}</td><td className="px-3 py-2 text-right tabular-nums">{money(activeCount * (Number(defaultPs) + Number(defaultEs)))}</td><td className="px-3 py-2 text-center text-emerald-800">{activeCount} active</td><td /></tr></tfoot>
              </table>
            </div>
            <footer className="benefit-report-footer"><span>Showing {firstEmployeeResult}-{lastEmployeeResult} of {filteredEmployees.length} employees</span><div className="flex items-center gap-2"><button type="button" onClick={() => setEmployeePage(currentEmployeePage - 1)} disabled={currentEmployeePage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="tabular-nums">Page {currentEmployeePage} of {employeePageCount}</span><button type="button" onClick={() => setEmployeePage(currentEmployeePage + 1)} disabled={currentEmployeePage >= employeePageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></footer>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
              <table className="benefit-report-table w-full table-fixed text-left text-sm text-slate-900">
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead className="sticky top-0 z-10"><tr><th className="bg-slate-100 px-3 py-2 font-bold">Applicable Period</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Employees</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Adjustments</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Due</th><th className="bg-slate-100 px-3 py-2 font-bold">Transaction</th><th className="bg-slate-100 px-3 py-2 font-bold">ePAR</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Paid</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedReports.map((report) => <tr key={report.id < 0 ? `month-${-report.id}` : report.id} className="hover:bg-slate-50">
                    <td className="px-3 py-1 font-semibold">{period(report)}</td>
                    <td className="px-3 py-1 text-right tabular-nums">{report.entries.length}</td>
                    <td className="px-3 py-1 text-right tabular-nums">{report.payment ? money(Math.max(0, Number(report.payment.amountPaid) - Number(report.amountDue))) : "—"}</td>
                    <td className="px-3 py-1 text-right font-bold tabular-nums">{money(report.amountDue)}</td>
                    <td className="px-3 py-1 text-xs text-slate-600">{report.id < 0 ? "Not created" : (report.payment ? (report.payment.transactionDate || "—") : "Unpaid")}</td>
                    <td className="px-3 py-1 text-xs text-slate-600">{report.payment ? (report.payment.eparNumber || report.payment.transactionConfirmationNumber || "—") : "—"}</td>
                    <td className="px-3 py-1 text-right font-semibold tabular-nums">{report.payment ? money(report.payment.amountPaid) : "—"}</td>
                    <td className="px-3 py-1 text-right"><div className="relative inline-block text-left" ref={reportMenuOpen === report.id ? reportMenuRef : null}><button type="button" onClick={() => setViewReport(report)} disabled={report.id < 0} aria-label={`View ${period(report)} report`} title="View report and payment details" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><EyeIcon className="h-4 w-4" /></button><button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} disabled={report.id < 0} aria-label="Report actions" title="Report actions" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"><EllipsisVerticalIcon className="h-4 w-4" /></button>{report.id > 0 && reportMenuOpen === report.id && <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"><button type="button" onClick={() => { setReportMenuOpen(null); setViewReport(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><EyeIcon className="h-4 w-4" />View report</button><button type="button" onClick={() => { setReportMenuOpen(null); openPaymentForm(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" />{report.payment ? "View or edit payment" : "Record payment"}</button>{canEditPayments && <button type="button" onClick={() => { setReportMenuOpen(null); setDeleteReportTarget(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"><TrashIcon className="h-4 w-4" />Delete report</button>}</div>}</div></td>
                  </tr>)}
                  {!filteredReports.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-600">No monthly contribution reports have been created yet.</td></tr>}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td className="px-3 py-2">Totals</td><td className="px-3 py-2 text-right tabular-nums">{displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + report.entries.length, 0)}</td><td /><td className="px-3 py-2 text-right tabular-nums">{money(displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + Number(report.amountDue), 0))}</td><td /><td /><td className="px-3 py-2 text-right tabular-nums">{money(displayedReports.filter((report) => report.id > 0).reduce((sum, report) => sum + Number(report.payment?.amountPaid ?? 0), 0))}</td><td /></tr></tfoot>
              </table>
            </div>
            <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700"><span>{displayedReports.length} records{displayedReports.length > reportPageSize ? ` · Page ${currentReportPage} of ${reportPageCount}` : ""}</span><div className="flex items-center gap-2">{reportYearFilter === "ALL" && displayedReports.length > reportPageSize && <><button type="button" onClick={() => setReportPage(currentReportPage - 1)} disabled={currentReportPage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><button type="button" onClick={() => setReportPage(currentReportPage + 1)} disabled={currentReportPage >= reportPageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></>}</div></footer>
          </>
        )}
      </section>}

      {accountOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountOpen(false); }}>
        <form onSubmit={saveAccount} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">Add PhilHealth Account</h2><button type="button" onClick={() => setAccountOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="space-y-3 p-5"><div className="block"><span className={labelClass}>Employee · current employer employees listed first</span><div className="relative" ref={accountPickerRef}><button type="button" disabled={saving} aria-haspopup="listbox" aria-expanded={accountEmployeePickerOpen} onClick={() => { setAccountEmployeeSearch(""); setAccountEmployeePickerOpen((current) => !current); }} className={`${inputClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:bg-slate-100`}><span className={selectedAccountEmployee ? "truncate text-slate-900" : "truncate text-slate-600"}>{selectedAccountEmployee ? employeeNameWithBoldFirstName(selectedAccountEmployee) : "Select employee"}{selectedAccountEmployee?.philHealth ? <span className="ml-2 font-normal text-slate-500">· {selectedAccountEmployee.philHealth}</span> : null}</span><ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${accountEmployeePickerOpen ? "rotate-180" : ""}`} /></button>{accountEmployeePickerOpen && <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl"><div className="border-b border-slate-200 p-2"><input autoFocus type="search" value={accountEmployeeSearch} onChange={(event) => setAccountEmployeeSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setAccountEmployeePickerOpen(false); }} aria-label="Search employees" placeholder="Search name, PhilHealth number, or employer" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div><div role="listbox" aria-label="Employees" className="max-h-56 overflow-y-auto overscroll-contain">{accountAssignedEmployees.length > 0 && <div className="sticky top-0 z-10 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">{`Assigned to ${employer?.name ?? "selected employer"}`}</div>}{accountAssignedEmployees.map((employee) => { const selected = String(employee.id) === selectedEmployeeId; return <button key={employee.id} type="button" role="option" aria-selected={selected} onClick={() => { setSelectedEmployeeId(String(employee.id)); setAccountEmployeePickerOpen(false); setAccountEmployeeSearch(""); }} className={`flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50 ${selected ? "bg-emerald-50" : "bg-white"}`}><span className="text-sm text-slate-900">{employeeNameWithBoldFirstName(employee)} <span className="font-normal text-slate-500">· {employee.philHealth || "No PhilHealth number"}</span></span></button>; })}{accountOtherEmployees.length > 0 && <div className="sticky top-0 z-10 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">All other employees</div>}{accountOtherEmployees.map((employee) => { const selected = String(employee.id) === selectedEmployeeId; return <button key={employee.id} type="button" role="option" aria-selected={selected} onClick={() => { setSelectedEmployeeId(String(employee.id)); setAccountEmployeePickerOpen(false); setAccountEmployeeSearch(""); }} className={`flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50 ${selected ? "bg-emerald-50" : "bg-white"}`}><span className="text-sm text-slate-900">{employeeNameWithBoldFirstName(employee)} <span className="font-normal text-slate-500">· {employee.philHealth || "No PhilHealth number"}{employee.employerName ? ` · ${employee.employerName}` : ""}</span></span></button>; })}{accountAssignedEmployees.length === 0 && accountOtherEmployees.length === 0 && <p className="px-3 py-4 text-sm font-medium text-slate-600">No employees found.</p>}</div></div>}{/* hidden required field keeps form submission semantics */}<input type="hidden" required value={selectedEmployeeId} onChange={() => {}} /></div></div><p className="text-xs text-slate-500">Employees assigned to the selected employer are listed first; all employees remain available. The selected employee is linked to {employer?.name ?? "the selected employer"} and their existing PhilHealth number is retained.</p></div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setAccountOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={!selectedEmployeeId || saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Add Account"}</button></div>
        </form>
      </div>}

      {reportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}>
        <form onSubmit={createReport} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold">Create Monthly Contribution Report</h2><p className="text-sm text-slate-600">{employer?.name} · {employer?.phic || "—"}</p></div><button type="button" onClick={() => setReportOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="flex gap-3 border-b border-slate-200 p-4"><label className="min-w-[9rem] sm:max-w-[14rem]"><span className={labelClass}>Month</span><select value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={inputClass}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><label className="w-32"><span className={labelClass}>Year</span><input type="number" min="2019" max="2200" value={reportYear} onChange={(event) => setReportYear(event.target.value)} className={inputClass} /></label></div>
          <div className="min-h-0 flex-1 overflow-auto p-4"><table className="w-full text-sm"><thead><tr><th className="bg-slate-100 px-3 py-2 text-left">Employee</th><th className="bg-slate-100 px-3 py-2 text-right">PS</th><th className="bg-slate-100 px-3 py-2 text-right">ES</th><th className="bg-slate-100 px-3 py-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{activeEmployees.map((employee) => <tr key={employee.id}><td className="px-3 py-2"><div className="font-medium">{fullName(employee)}</div><div className="text-xs text-slate-500">{employee.philHealth || "—"}</div></td><td className="px-3 py-2 text-right tabular-nums">{money(defaultPs)}</td><td className="px-3 py-2 text-right tabular-nums">{money(defaultEs)}</td><td className="px-3 py-2 text-right font-medium tabular-nums">{money(Number(defaultPs) + Number(defaultEs))}</td></tr>)}{!activeEmployees.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No active PhilHealth accounts are available.</td></tr>}</tbody></table></div>
          <div className="flex items-center justify-between border-t border-slate-200 p-4"><p className="text-sm font-semibold">Amount Due: {money(reportAmountDue)}</p><div className="flex gap-2"><button type="button" onClick={() => setReportOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving || activeEmployees.length === 0} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Create Report"}</button></div></div>
        </form>
      </div>}

      {viewReport && <PhilHealthReportDetails report={viewReport} canEditPayments={canEditPayments} onClose={() => setViewReport(null)} onPayment={(target) => { setViewReport(null); openPaymentForm(target); }} />}
      {paymentReport && paymentForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPaymentReport(null); setPaymentForm(null); } }}>
        <form onSubmit={savePayment} className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{paymentReport.payment ? "PhilHealth Payment Details" : "Record PhilHealth Payment"}</h2>
              <p className="text-sm text-slate-600">{period(paymentReport)} · Amount Due {money(paymentReport.amountDue)}</p>
            </div>
            <button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="grid gap-6">
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Employer & Period</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Employer Name</label>
                    <input readOnly type="text" value={paymentForm.payorName} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                  <div>
                    <label className={labelClass}>PhilHealth Number</label>
                    <input readOnly type="text" value={paymentForm.pen} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                  <div>
                    <label className={labelClass}>SPA</label>
                    <input type="text" value={paymentForm.spa} onChange={(event) => setPaymentForm((current) => current ? { ...current, spa: event.target.value } : current)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Applicable Period</label>
                    <input readOnly type="text" value={paymentForm.applicablePeriod} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Payment Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₱</span>
                      <input readOnly type="text" value={paymentForm.amountPaid} className={`${inputClass} bg-slate-100 pl-8 text-slate-600`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Accredited Collecting Agent</label>
                    <input type="text" value={paymentForm.accreditedCollectingAgent} onChange={(event) => setPaymentForm((current) => current ? { ...current, accreditedCollectingAgent: event.target.value } : current)} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Transaction Confirmation No.</label>
                    <input type="text" value={paymentForm.transactionConfirmationNumber} onChange={(event) => setPaymentForm((current) => current ? { ...current, transactionConfirmationNumber: event.target.value } : current)} className={inputClass} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1">
                      <span className={labelClass}>Transaction Date</span>
                      <span className="text-xs text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <input required type="date" value={paymentForm.transactionDate} onChange={(event) => setPaymentForm((current) => current ? { ...current, transactionDate: event.target.value } : current)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>ePAR No.</label>
                    <input type="text" value={paymentForm.eparNumber} onChange={(event) => setPaymentForm((current) => current ? { ...current, eparNumber: event.target.value } : current)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>ePAR Date</label>
                    <input type="date" value={paymentForm.eparDate} onChange={(event) => setPaymentForm((current) => current ? { ...current, eparDate: event.target.value } : current)} className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Adjustments</h3>
                  <label className={labelClass}>Penalties and adjustments</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₱</span>
                    <input type="number" min="0" max="999999999.99" step="0.01" value={paymentForm.adjustments} onChange={(event) => setPaymentForm((current) => current ? { ...current, adjustments: event.target.value } : current)} className={`${inputClass} pl-8`} placeholder="0.00" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Totals</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Amount Paid</span>
                    <span className="tabular-nums">{money(paymentForm.amountPaid)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Penalties and adjustments</span>
                    <span className="tabular-nums">{money(paymentForm.adjustments || 0)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">{money(Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0))}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <span className="text-xs text-slate-500">* Required field</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-800">{saving ? "Saving..." : "Save Payment"}</button>
            </div>
          </footer>
        </form>
      </div>
    )}
{deleteReportTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteReportTarget(null); }}>
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">Delete PhilHealth report?</h2>
          <p className="mt-2 text-sm text-slate-600">This will permanently delete the {period(deleteReportTarget)} report and its payment details. This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteReportTarget(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="button" onClick={deleteReport} disabled={saving} className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Deleting..." : "Delete"}</button>
          </div>
        </div>
      </div>}
      {paymentSavedOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentSavedOpen(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="philhealth-payment-saved-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <header className="flex items-center justify-between gap-3">
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

function PhilHealthReportDetails({ report, canEditPayments, onClose, onPayment }: { report: Report; canEditPayments: boolean; onClose: () => void; onPayment: (report: Report) => void }) {
  const payment = report.payment;
  const paid = payment !== null;
  const amountPaid = Number(payment?.amountPaid ?? 0);
  const amountDue = Number(report.amountDue);
  const status = !paid ? "Unpaid" : amountPaid >= amountDue ? "Paid" : "Partial";
  const statusClass = !paid
    ? "bg-slate-100 text-slate-700"
    : amountPaid >= amountDue
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";
  const entryTotal = report.entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  return <div id="philhealth-report-print-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="philhealth-report-title" className="philhealth-report-print-dialog flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="philhealth-report-title" className="text-lg font-bold text-slate-900">PhilHealth Monthly Contribution Report</h2>
          <p className="text-sm text-slate-600">{period(report)} · {report.employerName}</p>
        </div>
        <div className="philhealth-report-interactive flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => window.print()} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print</button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="philhealth-report-print-content min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <article className="philhealth-report-card overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">{report.employerName}</h3>
              <p className="text-sm font-medium text-slate-600">PhilHealth Employer Number (PHIC): {report.employerPhicNumber || "—"}</p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable Period</p><p className="mt-0.5 text-base font-bold text-slate-950">{period(report)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{money(report.amountDue)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Paid</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{paid ? money(payment.amountPaid) : "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p><p className="mt-1"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{status}</span></p></div>
            </div>
          </div>
          <div className="philhealth-report-print-table overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-slate-900">
              <thead className="text-sm font-bold text-slate-800"><tr>
                <th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Employee Name</th>
                <th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">PhilHealth No.</th>
                <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">PS</th>
                <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">ES</th>
                <th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Contribution</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {report.entries.map((entry) => <tr key={entry.id}>
                  <td className="px-3 py-3 font-medium text-slate-900">{entry.employeeName}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-900">{entry.employeePhilHealthNumber || "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-950">{money(Number(entry.amount) / 2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-950">{money(Number(entry.amount) / 2)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-950">{money(entry.amount)}</td>
                </tr>)}
                {!report.entries.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-600">This report has no employee entries.</td></tr>}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950"><tr>
                <td colSpan={4} className="px-3 py-3">Total ({report.entries.length} {report.entries.length === 1 ? "employee" : "employees"})</td>
                <td className="px-3 py-3 text-right tabular-nums">{money(entryTotal)}</td>
              </tr></tfoot>
            </table>
          </div>
          <div className="border-t border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900">Payment Details</h4>
            {paid && payment ? (
              <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {([
                  ["Payor Name", payment.payorName],
                  ["PEN (PhilHealth Employer Number)", payment.pen],
                  ["SPA", payment.spa || "—"],
                  ["Applicable Period", payment.applicablePeriod || "—"],
                  ["Amount Paid", money(payment.amountPaid)],
                  ["Accredited Collecting Agent", payment.accreditedCollectingAgent || "—"],
                  ["Transaction Confirmation No.", payment.transactionConfirmationNumber || "—"],
                  ["Transaction Date", payment.transactionDate || "—"],
                  ["ePAR No.", payment.eparNumber || "—"],
                  ["ePAR Date", payment.eparDate || "—"],
                ] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd></div>)}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No payment has been recorded for this report yet.</p>
            )}
          </div>
        </article>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-slate-900">
        <span>Overall Amount Due: {money(report.amountDue)}</span>
        {paid && <span>Adjustments: {money(Math.max(0, amountPaid - amountDue))}</span>}
        {paid && <span>Total Paid: {money(amountPaid)}</span>}
      </div>
        <div className="philhealth-report-interactive flex gap-2">
          {(!paid || canEditPayments) && <button type="button" onClick={() => onPayment(report)} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">{paid ? "Update Payment" : "Record Payment"}</button>}
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      </footer>
    </section>
  </div>;
}
