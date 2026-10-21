"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowPathIcon, ChevronLeftIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const employeePageSize = 8;
const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-700";
const fullName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};
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
  const view = params.get("view") === "payments" ? "payments" : params.get("view") === "reports" ? "reports" : "employees";
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [employeePage, setEmployeePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm | null>(null);

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
        }
        setLoadedContext(context);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setEmployees([]);
        setReports([]);
        setLoadedContext(context);
        setError(loadError instanceof Error ? loadError.message : "Unable to load PhilHealth records");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [employerId, refreshKey, view]);

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
  const activeEmployees = employees.filter((employee) => employee.philHealthAccount?.active);
  const activeCount = employees.filter((employee) => employee.philHealthAccount?.active).length;
  const inactiveCount = employees.filter((employee) => employee.philHealthAccount && !employee.philHealthAccount.active).length;
  const reportAmountDue = Object.values(amounts).reduce((sum, value) => sum + (value.trim() ? Number(value) || 0 : 0), 0);
  const employeePageCount = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const currentEmployeePage = Math.min(employeePage, employeePageCount);
  const visibleEmployees = filteredEmployees.slice((currentEmployeePage - 1) * employeePageSize, currentEmployeePage * employeePageSize);
  const firstEmployeeResult = filteredEmployees.length ? (currentEmployeePage - 1) * employeePageSize + 1 : 0;
  const lastEmployeeResult = Math.min(currentEmployeePage * employeePageSize, filteredEmployees.length);

  const openAccountForm = async () => {
    setAccountOpen(true);
    setSelectedEmployeeId("");
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

  const openReportForm = () => {
    setAmounts({});
    setError("");
    setReportOpen(true);
  };

  const createReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = Object.entries(amounts)
      .filter(([, amount]) => amount.trim() !== "")
      .map(([employeeId, amount]) => ({ employeeId: Number(employeeId), amount }));
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
      const response = await fetch(`/api/reports/philhealth/reports/${paymentReport.id}/payment?employerId=${encodeURIComponent(employerId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save payment details");
      setPaymentReport(null);
      setPaymentForm(null);
      setNotice("PhilHealth payment details saved.");
      setLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSaving(false);
    }
  };

  const isPaymentView = view === "payments";
  const title = view === "employees" ? "Employee List" : isPaymentView ? "Payments" : "Monthly Contribution Reports";

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-6 lg:p-8">
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
              <p className="hidden text-sm text-slate-600 sm:block">Employer-scoped accounts, monthly contribution reports, and payments.</p>
            </div>
          </div>
          {employerId && <nav aria-label="PhilHealth report pages" className="flex flex-wrap gap-2">
            <Link href={`/reports/philhealth?view=employees&employerId=${encodeURIComponent(employerId)}`} aria-current={view === "employees" ? "page" : undefined} className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${view === "employees" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>Employee List</Link>
            <Link href={`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`} aria-current={view === "reports" ? "page" : undefined} className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${view === "reports" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>Reports</Link>
            <Link href={`/reports/philhealth?view=payments&employerId=${encodeURIComponent(employerId)}`} aria-current={isPaymentView ? "page" : undefined} className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${isPaymentView ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>Payments</Link>
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
        {(view === "reports" || isPaymentView) && <div className="benefit-report-toolbar mt-3 min-w-0 overflow-x-auto border-t border-slate-100 pt-3">
          {view === "reports" && <button type="button" onClick={openReportForm} className="benefit-report-primary"><PlusIcon className="h-4 w-4" />Create Monthly Report</button>}
          <button type="button" onClick={() => { setLoading(true); setRefreshKey((current) => current + 1); }} className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
        </div>}
      </section>

      {!employerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view PhilHealth records.</p>}
      {error && <p role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0">{error}</p>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}

      {employerId && <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
        {loading || loadedContext !== `${employerId}:${view}` ? <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700"><ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" /><p>Loading PhilHealth records...</p></div> : view === "employees" ? (
          <>
            <div className="benefit-report-section-heading"><h2 className="text-sm font-semibold text-slate-900">Employee Accounts</h2><p className="text-xs text-slate-500">{filteredEmployees.length} shown · {activeCount} active · {inactiveCount} inactive</p></div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="benefit-report-table w-full min-w-[850px] text-left text-sm text-slate-900">
                <thead className="sticky top-0 z-10"><tr><th className="px-3 py-2">Employee Name</th><th className="px-3 py-2">PhilHealth No.</th><th className="px-3 py-2">Current Employer</th><th className="px-3 py-2">Account Status</th><th className="px-3 py-2 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEmployees.map((employee) => {
                    const account = employee.philHealthAccount;
                    return <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-3 py-1 font-semibold">{fullName(employee)}<span className="mt-0.5 block text-xs font-medium text-slate-500">Biometric No.: {employee.biometricNo?.trim() || "—"}</span></td>
                      <td className="px-3 py-1 tabular-nums">{employee.philHealth || "—"}</td>
                      <td className="px-3 py-1">{employee.employerName || "—"}</td>
                      <td className="px-3 py-1">{account ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${account.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{account.active ? "Active" : "Inactive"}</span> : <span className="text-xs text-slate-500">Not added</span>}</td>
                      <td className="px-3 py-1 text-right">{account ? <button type="button" onClick={() => void setAccountActive(account.id, !account.active)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">{account.active ? "Set inactive" : "Set active"}</button> : <span className="text-xs text-slate-400">Add account</span>}</td>
                    </tr>;
                  })}
                  {!visibleEmployees.length && <tr><td colSpan={5} className="h-11 px-4 text-center text-sm text-slate-600">No employees match your search.</td></tr>}
                  {Array.from({ length: employeePageSize - Math.max(visibleEmployees.length, 1) }, (_, index) => <tr key={`empty-${index}`} aria-hidden="true"><td colSpan={5} className="h-11 p-0" /></tr>)}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td colSpan={2} className="px-3 py-2 text-slate-800">Employer Employee List</td><td className="px-3 py-2 text-right tabular-nums text-slate-900">{employees.length} employees</td><td className="px-3 py-2 text-right text-emerald-800">{activeCount} active</td><td className="px-3 py-2 text-right text-slate-700">{inactiveCount} inactive</td></tr></tfoot>
              </table>
            </div>
            <footer className="benefit-report-footer"><span>Showing {firstEmployeeResult}-{lastEmployeeResult} of {filteredEmployees.length} employees</span><div className="flex items-center gap-2"><button type="button" onClick={() => setEmployeePage(currentEmployeePage - 1)} disabled={currentEmployeePage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="tabular-nums">Page {currentEmployeePage} of {employeePageCount}</span><button type="button" onClick={() => setEmployeePage(currentEmployeePage + 1)} disabled={currentEmployeePage >= employeePageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div><Link href={`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`} className="font-semibold text-emerald-800 hover:underline">Monthly Reports</Link></footer>
          </>
        ) : (
          <>
            <div className="benefit-report-section-heading"><h2 className="text-sm font-semibold text-slate-900">{isPaymentView ? "Payment History" : "Monthly Contribution Reports"}</h2><p className="text-xs text-slate-600">{reports.length} {isPaymentView ? "payments recorded" : "reports"} · Amount Due {money(reports.reduce((sum, report) => sum + Number(report.amountDue), 0))}</p></div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="benefit-report-table w-full min-w-[920px] text-left text-sm text-slate-900">
                <thead className="sticky top-0 z-10"><tr><th className="bg-slate-100 px-3 py-2 font-bold">Applicable Period</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Employees</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Due</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Amount Paid</th><th className="bg-slate-100 px-3 py-2 font-bold">Transaction / ePAR</th><th className="bg-slate-100 px-3 py-2 text-right font-bold">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-3 py-1 font-semibold">{period(report)}<div className="text-xs font-medium text-slate-500">{report.employerName}</div></td>
                    <td className="px-3 py-1 text-right tabular-nums">{report.entries.length}</td>
                    <td className="px-3 py-1 text-right font-bold tabular-nums">{money(report.amountDue)}</td>
                    <td className="px-3 py-1 text-right font-semibold tabular-nums">{report.payment ? money(report.payment.amountPaid) : "—"}</td>
                    <td className="px-3 py-1 text-xs text-slate-600">{report.payment ? <>{report.payment.transactionDate}<div>{report.payment.eparNumber || report.payment.transactionConfirmationNumber || "Payment recorded"}</div></> : "Unpaid"}</td>
                    <td className="px-3 py-1 text-right">{report.payment ? <button type="button" onClick={() => { setPaymentReport(report); setPaymentForm(emptyPaymentForm(report, employer)); }} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View / Edit</button> : isPaymentView ? <span className="text-xs text-slate-500">No payment</span> : <button type="button" onClick={() => { setPaymentReport(report); setPaymentForm(emptyPaymentForm(report, employer)); }} className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800">Record Payment</button>}</td>
                  </tr>)}
                  {!reports.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-600">{isPaymentView ? "No PhilHealth payments have been recorded yet." : "No monthly contribution reports have been created yet."}</td></tr>}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td className="px-3 py-2">Totals</td><td className="px-3 py-2 text-right tabular-nums">{reports.reduce((sum, report) => sum + report.entries.length, 0)}</td><td className="px-3 py-2 text-right tabular-nums">{money(reports.reduce((sum, report) => sum + Number(report.amountDue), 0))}</td><td className="px-3 py-2 text-right tabular-nums">{money(reports.reduce((sum, report) => sum + Number(report.payment?.amountPaid ?? 0), 0))}</td><td colSpan={2} /></tr></tfoot>
              </table>
            </div>
            <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700"><span>{reports.length} records</span><Link href={`/reports/philhealth?view=employees&employerId=${encodeURIComponent(employerId)}`} className="font-semibold text-emerald-800 hover:underline">Employee List</Link></footer>
          </>
        )}
      </section>}

      {accountOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountOpen(false); }}>
        <form onSubmit={saveAccount} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-950">Add PhilHealth Account</h2><button type="button" onClick={() => setAccountOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="space-y-3 p-5"><label className="block"><span className={labelClass}>Employee · current employer employees listed first</span><select required value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className={inputClass}><option value="">Select employee</option><optgroup label={`Assigned to ${employer?.name ?? "selected employer"}`}>{employeeOptions.filter((employee) => employee.assignedToSelectedEmployer).map((employee) => <option key={employee.id} value={employee.id}>{fullName(employee)} · {employee.philHealth || "No PhilHealth number"}</option>)}</optgroup><optgroup label="All other employees">{employeeOptions.filter((employee) => !employee.assignedToSelectedEmployer).map((employee) => <option key={employee.id} value={employee.id}>{fullName(employee)} · {employee.philHealth || "No PhilHealth number"}{employee.employerName ? ` · ${employee.employerName}` : ""}</option>)}</optgroup></select></label><p className="text-xs text-slate-500">Employees assigned to the selected employer are listed first; all employees remain available. The selected employee is linked to {employer?.name ?? "the selected employer"} and their existing PhilHealth number is retained.</p></div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setAccountOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={!selectedEmployeeId || saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Add Account"}</button></div>
        </form>
      </div>}

      {reportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}>
        <form onSubmit={createReport} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold">Create Monthly Contribution Report</h2><p className="text-sm text-slate-600">{employer?.name} · Amount Due is calculated from the entered amounts.</p></div><button type="button" onClick={() => setReportOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="flex gap-3 border-b border-slate-200 p-4"><label className="flex-1"><span className={labelClass}>Month</span><select value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={inputClass}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><label className="w-32"><span className={labelClass}>Year</span><input type="number" min="2020" max="2200" value={reportYear} onChange={(event) => setReportYear(event.target.value)} className={inputClass} /></label></div>
          <div className="min-h-0 flex-1 overflow-auto p-4"><table className="w-full text-sm"><thead><tr><th className="bg-slate-100 px-3 py-2 text-left">Employee</th><th className="bg-slate-100 px-3 py-2 text-left">PhilHealth No.</th><th className="bg-slate-100 px-3 py-2 text-right">Contribution</th></tr></thead><tbody className="divide-y divide-slate-100">{activeEmployees.map((employee) => <tr key={employee.id}><td className="px-3 py-2 font-medium">{fullName(employee)}</td><td className="px-3 py-2">{employee.philHealth || "—"}</td><td className="px-3 py-2"><input aria-label={`Contribution for ${fullName(employee)}`} type="number" min="0" max="999999999.99" step="0.01" value={amounts[employee.id] ?? ""} onChange={(event) => setAmounts((current) => ({ ...current, [employee.id]: event.target.value }))} className={`${inputClass} text-right`} placeholder="Leave blank to omit" /></td></tr>)}{!activeEmployees.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No active PhilHealth accounts are available.</td></tr>}</tbody></table></div>
          <div className="flex items-center justify-between border-t border-slate-200 p-4"><p className="text-sm font-semibold">Amount Due: {money(reportAmountDue)}</p><div className="flex gap-2"><button type="button" onClick={() => setReportOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving || activeEmployees.length === 0} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Create Report"}</button></div></div>
        </form>
      </div>}

      {paymentReport && paymentForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPaymentReport(null); setPaymentForm(null); } }}>
        <form onSubmit={savePayment} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><h2 className="text-lg font-bold">{paymentReport.payment ? "PhilHealth Payment Details" : "Record PhilHealth Payment"}</h2><p className="text-sm text-slate-600">{period(paymentReport)} · Amount Due {money(paymentReport.amountDue)}</p></div><button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {([
              ["payorName", "Payor Name", true], ["pen", "PEN (PhilHealth Employer Number)", true], ["spa", "SPA", false],
              ["applicablePeriod", "Applicable Period", true], ["amountPaid", "Amount Paid", true], ["accreditedCollectingAgent", "Accredited Collecting Agent", false],
              ["transactionConfirmationNumber", "Transaction Confirmation No.", false], ["transactionDate", "Transaction Date", true], ["eparNumber", "ePAR No.", false], ["eparDate", "ePAR Date", false],
            ] as const).map(([key, label, required]) => <label key={key} className="block"><span className={labelClass}>{label}</span><input required={required} type={key === "transactionDate" || key === "eparDate" ? "date" : key === "amountPaid" ? "number" : "text"} min={key === "amountPaid" ? "0.01" : undefined} max={key === "amountPaid" ? "999999999.99" : undefined} step={key === "amountPaid" ? "0.01" : undefined} value={paymentForm[key]} onChange={(event) => setPaymentForm((current) => current ? { ...current, [key]: event.target.value } : current)} className={inputClass} /></label>)}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Payment"}</button></div>
        </form>
      </div>}
    </main>
  );
}
