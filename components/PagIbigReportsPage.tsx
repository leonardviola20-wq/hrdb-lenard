"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowPathIcon, ChevronDownIcon, ChevronLeftIcon, EyeIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";

type LoanDetail = {
  applicationNo: string;
  loanTermDate: string;
  termYears: string;
  amount: string;
  status: string;
};
type SavedLoanDetail = Omit<LoanDetail, "termYears"> & { termYears: number; termEndDate: string };
type Account = {
  id: number;
  year: number;
  mp2AccountNumber: string | null;
  mp2Amount: string;
  employeeSavings: string;
  employerSavings: string;
  excludedFromReport: boolean;
  calamityLoanAmount: string;
  mplLoanAmount: string;
  emergencyLoanAmount: string;
  safeLoanAmount: string;
  loanDetails: Record<PagibigLoanType, SavedLoanDetail | null>;
};
type Member = {
  id: number;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string | null;
  pagIbigNumber: string | null;
  pagIbigAccount: Account | null;
};
type ReportEntry = {
  id: number;
  employeeName: string;
  employeeCode: string;
  midNumber: string | null;
  employeeSavings: string;
  employerSavings: string;
  mp2AccountNumber: string | null;
  mp2Amount: string;
  calamityLoanAmount: string;
  mplLoanAmount: string;
  emergencyLoanAmount: string;
  safeLoanAmount: string;
  totalAmount: string;
};
type Report = {
  id: number;
  kind: string;
  pin: string;
  employerId: number;
  employerName: string;
  employerPagibigNumber: string | null;
  applicableMonth: number;
  applicableYear: number;
  employeeSavingsTotal: string;
  employerSavingsTotal: string;
  mp2Total: string;
  calamityLoanTotal: string;
  mplLoanTotal: string;
  emergencyLoanTotal: string;
  safeLoanTotal: string;
  amountDue: string;
  amountPaid: string | null;
  paymentType: string | null;
  payDate: string | null;
  transactionReference: string | null;
  entries: ReportEntry[];
};
type AccountForm = {
  employeeId: string;
  year: string;
  midNumber: string;
  employeeSavings: string;
  employerSavings: string;
  excludedFromReport: boolean;
  mp2AccountNumber: string;
  mp2Amount: string;
  loanDetails: Record<PagibigLoanType, LoanDetail>;
};
type PaymentForm = {
  amountPaid: string;
  paymentType: string;
  payDate: string;
  transactionReference: string;
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];
const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const formatMoney = (value: number | string | null | undefined) => `₱${(Number(value) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatAmount = (value: number | string | null | undefined) => (Number(value) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatEmployeeName = (employee: Pick<Member, "firstName" | "middleName" | "lastName">) => {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
};
const emptyLoanDetail = (): LoanDetail => ({ applicationNo: "", loanTermDate: "", termYears: "1", amount: "0", status: "ACTIVE" });
const emptyLoanDetails = (): Record<PagibigLoanType, LoanDetail> => Object.fromEntries(
  PAGIBIG_LOAN_TYPES.map((type) => [type, emptyLoanDetail()]),
) as Record<PagibigLoanType, LoanDetail>;
const emptyAccountForm = (): AccountForm => ({
  employeeId: "",
  year: String(new Date().getFullYear()),
  midNumber: "",
  employeeSavings: "200",
  employerSavings: "200",
  excludedFromReport: false,
  mp2AccountNumber: "",
  mp2Amount: "0",
  loanDetails: emptyLoanDetails(),
});
const loanLabels: Record<PagibigLoanType, string> = { CAL: "Calamity", MPL: "MPL", EMER: "Emergency", SAFE: "SAFE" };
const accountYears = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 5 + index);
const memberAmountColumns = [
  { label: "EE", field: "employeeSavings", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "ER", field: "employerSavings", headerClass: "bg-emerald-100 text-emerald-900", cellClass: "bg-emerald-50 text-emerald-950" },
  { label: "MP2", field: "mp2Amount", headerClass: "bg-violet-100 text-violet-900", cellClass: "bg-violet-50 text-violet-950" },
  { label: "CAL", field: "calamityLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "MPL", field: "mplLoanAmount", headerClass: "bg-orange-100 text-orange-900", cellClass: "bg-orange-50 text-orange-950" },
  { label: "EMER", field: "emergencyLoanAmount", headerClass: "bg-rose-100 text-rose-900", cellClass: "bg-rose-50 text-rose-950" },
  { label: "SAFE", field: "safeLoanAmount", headerClass: "bg-cyan-100 text-cyan-900", cellClass: "bg-cyan-50 text-cyan-950" },
] as const;

export default function PagIbigReportsPage() {
  return <Suspense fallback={<main className="flex-1 bg-slate-50 p-4 sm:p-6" />}><PagIbigReportsContent /></Suspense>;
}

function PagIbigReportsContent() {
  const searchParams = useSearchParams();
  const requestedEmployerId = searchParams.get("employerId") ?? "";
  const employerIdValue = Number(requestedEmployerId);
  const selectedEmployerId = Number.isSafeInteger(employerIdValue) && employerIdValue > 0 ? String(employerIdValue) : "";
  const paymentsView = searchParams.get("view") === "payments";
  const [members, setMembers] = useState<Member[]>([]);
  const [previewMembers, setPreviewMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accountYear, setAccountYear] = useState(String(new Date().getFullYear()));
  const [yearFilter, setYearFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [returnToReportPreview, setReturnToReportPreview] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewYear, setPreviewYear] = useState("");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportPin, setReportPin] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({ amountPaid: "", paymentType: "Bank", payDate: "", transactionReference: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!selectedEmployerId) return;
    const endpoint = paymentsView ? "/api/reports/pagibig" : "/api/reports/pagibig/members";
    const yearQuery = paymentsView ? "" : `&year=${encodeURIComponent(accountYear)}`;
    const url = `${endpoint}?employerId=${encodeURIComponent(selectedEmployerId)}${yearQuery}`;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load Pag-IBIG data");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        if (paymentsView) {
          setReports(data.reports as Report[]);
          setCanEditPayments(Boolean(data.canEditPayments));
        } else {
          setMembers(data.employees as Member[]);
        }
        setLoadedContext(`${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}`);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load Pag-IBIG data");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accountYear, paymentsView, refreshKey, selectedEmployerId]);

  const refresh = () => {
    setError("");
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  };

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return members;
    return members.filter((member) => [formatEmployeeName(member), member.employeeCode, member.pagIbigNumber, member.status]
      .some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [members, search]);

  const years = useMemo(() => [...new Set(reports.map((report) => report.applicableYear))].sort((a, b) => b - a), [reports]);
  const visibleReports = useMemo(() => reports.filter((report) => {
    if (yearFilter && String(report.applicableYear) !== yearFilter) return false;
    const query = search.trim().toLocaleLowerCase();
    return !query || `${monthNames[report.applicableMonth - 1]} ${report.applicableYear} ${report.amountDue} ${report.amountPaid ?? ""} ${report.entries.map((entry) => `${entry.employeeName} ${entry.midNumber ?? ""}`).join(" ")}`
      .toLocaleLowerCase().includes(query);
  }), [reports, search, yearFilter]);

  const openAddAccount = () => {
    setReturnToReportPreview(false);
    setEditingMember(null);
    setAccountForm({ ...emptyAccountForm(), year: accountYear });
    setAccountError("");
    setAccountFormOpen(true);
  };

  const openEditAccount = (member: Member, fromReportPreview = false) => {
    setReturnToReportPreview(fromReportPreview);
    if (fromReportPreview) setReportFormOpen(false);
    const account = member.pagIbigAccount;
    setEditingMember(member);
    setAccountError("");
    setAccountForm({
      employeeId: String(member.id),
      year: String(account?.year ?? accountYear),
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
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    setAccountFormOpen(false);
    if (returnToReportPreview) setReportFormOpen(true);
    setReturnToReportPreview(false);
  };

  const loadReportYearAccounts = async (year: string) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(year)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employee Pag-IBIG accounts");
      setPreviewMembers(data.employees as Member[]);
      setPreviewYear(year);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load employee Pag-IBIG accounts");
    } finally {
      setPreviewLoading(false);
    }
  };

  const openReportForm = async () => {
    setError("");
    setReportFormOpen(true);
    setReportPin("");
    await loadReportYearAccounts(reportYear);
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
        body: JSON.stringify({ ...accountForm, employerId: selectedEmployerId }),
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
      }
      setAccountFormOpen(false);
      if (returnToReportPreview) {
        setReportFormOpen(true);
        setReturnToReportPreview(false);
      } else {
        refresh();
      }
    } catch (saveError) {
      setAccountError(saveError instanceof Error ? saveError.message : "Unable to save Pag-IBIG account");
    } finally {
      setSavingAccount(false);
    }
  };

  const generateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/reports/pagibig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: selectedEmployerId, applicableMonth: reportMonth, applicableYear: reportYear, pin: reportPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate Pag-IBIG report");
      setReports((current) => [data.report as Report, ...current]);
      setReportFormOpen(false);
      setSelectedReport(data.report as Report);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate Pag-IBIG report");
    } finally {
      setGenerating(false);
    }
  };

  const openPayment = (report: Report) => {
    setPaymentReport(report);
    setPaymentError("");
    setPaymentForm({
      amountPaid: report.amountPaid ?? report.amountDue,
      paymentType: report.paymentType ?? "Bank",
      payDate: report.payDate?.slice(0, 10) ?? "",
      transactionReference: report.transactionReference ?? "",
    });
  };

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentReport) return;
    setSavingPayment(true);
    setPaymentError("");
    try {
      const response = await fetch(`/api/reports/pagibig/${paymentReport.id}?employerId=${encodeURIComponent(selectedEmployerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save payment details");
      setReports((current) => current.map((report) => report.id === paymentReport.id ? data.report as Report : report));
      setPaymentReport(null);
    } catch (saveError) {
      setPaymentError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSavingPayment(false);
    }
  };

  const hasMemberAccount = (member: Member) => Boolean(member.pagIbigAccount);
  const memberTotals = memberAmountColumns.map(({ field }) => visibleMembers.reduce((total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0), 0));
  const memberOverallTotal = memberTotals.reduce((total, amount) => total + amount, 0);
  const previewEntries = previewMembers.filter((member) => member.pagIbigAccount && member.pagIbigNumber && !member.pagIbigAccount.excludedFromReport);
  const excludedPreviewCount = previewMembers.filter((member) => member.pagIbigAccount && member.pagIbigNumber && member.pagIbigAccount.excludedFromReport).length;
  const previewTotal = (field: keyof Account) => previewEntries.reduce((total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0), 0);
  const previewOverall = ["employeeSavings", "employerSavings", "mp2Amount", "calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"]
    .reduce((sum, field) => sum + previewTotal(field as keyof Account), 0);

  return (
    <main className="min-h-0 w-full flex-1 bg-slate-50 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pag-IBIG {paymentsView ? "Payments" : "Employee List"}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{paymentsView ? "Generate monthly reports and manage payment details." : "Maintain employee MID numbers, savings, MP2, and monthly loan amounts."}</p>
          </div>
        </div>
        {!paymentsView && <button type="button" onClick={openAddAccount} disabled={!selectedEmployerId} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" />Add</button>}
        {paymentsView && <button type="button" onClick={() => void openReportForm()} disabled={!selectedEmployerId} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" />Generate Report</button>}
      </div>

      {!selectedEmployerId && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view Pag-IBIG records.</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {selectedEmployerId && <><div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="pagibig-search" className={labelClass}>Search</label>
          <input id="pagibig-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={paymentsView ? "Search period or employee" : "Search employee, code, or MID"} className={inputClass} />
        </div>
        {!paymentsView && <div className="w-36">
          <label htmlFor="pagibig-account-year" className={labelClass}>Account Year</label>
          <select id="pagibig-account-year" value={accountYear} onChange={(event) => setAccountYear(event.target.value)} className={inputClass}>
            {accountYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>}
        {paymentsView && <div className="w-36">
          <label htmlFor="pagibig-year" className={labelClass}>Year</label>
          <select id="pagibig-year" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={inputClass}>
            <option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>}
        <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
      </div>

      {loading || loadedContext !== `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}` ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading Pag-IBIG records...</div>
        : paymentsView ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">EE + ER Savings</th><th className="px-4 py-3 text-right">MP2</th><th className="px-4 py-3 text-right">Loans</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleReports.map((report) => {
                    const paid = report.amountPaid !== null && report.payDate !== null;
                    const loans = Number(report.calamityLoanTotal) + Number(report.mplLoanTotal) + Number(report.emergencyLoanTotal) + Number(report.safeLoanTotal);
                    return <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{monthNames[report.applicableMonth - 1]} {report.applicableYear}<div className="text-xs font-normal text-slate-500">{report.entries.length} employees</div></td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(report.employeeSavingsTotal) + Number(report.employerSavingsTotal))}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(report.mp2Total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(loans)}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{formatMoney(report.amountDue)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{paid ? `Paid · ${report.payDate?.slice(0, 10)}` : "Unpaid"}</span></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSelectedReport(report)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><EyeIcon className="h-4 w-4" />View</button>
                        <button type="button" onClick={() => openPayment(report)} disabled={paid && !canEditPayments} title={paid && !canEditPayments ? "Only admins can edit saved payment details" : undefined} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{paid ? "Edit Payment" : "Add Payment"}</button>
                      </div></td>
                    </tr>;
                  })}
                  {visibleReports.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">{reports.length ? "No Pag-IBIG reports match the selected filters." : "No reports have been generated yet."}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {visibleReports.length} of {reports.length} reports</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] text-left text-sm text-slate-900">
                <thead><tr><th className="bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800">Employee / Pag-IBIG Number</th>{memberAmountColumns.map((column) => <th key={column.field} className={`px-4 py-3 text-right text-sm font-bold ${column.headerClass}`}>{column.label}</th>)}<th className="bg-slate-100 px-4 py-3 text-right text-sm font-bold text-slate-800">Total</th><th className="bg-slate-100 px-4 py-3 text-right text-sm font-bold text-slate-800">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleMembers.map((member) => {
                    const account = member.pagIbigAccount;
                    const rowTotal = memberAmountColumns.reduce((total, column) => total + Number(account?.[column.field] ?? 0), 0);
                    const setup = !hasMemberAccount(member);
                    return <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatEmployeeName(member)}<div className="mt-1 text-sm font-medium text-slate-700">{member.pagIbigNumber || "Pag-IBIG number not set"}</div></td>
                      {memberAmountColumns.map((column) => <td key={column.field} className={`px-4 py-3 text-right font-medium tabular-nums ${column.cellClass}`}>{account ? formatAmount(account[column.field]) : "—"}</td>)}
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-950">{account ? formatAmount(rowTotal) : "—"}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => openEditAccount(member)} aria-label={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} title={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500">{setup ? <PlusIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}</button></td>
                    </tr>;
                  })}
                  {visibleMembers.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm font-medium text-slate-600">No employees match your search.</td></tr>}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold"><tr><td className="px-4 py-3 text-slate-800">Totals ({visibleMembers.length} employees)</td>{memberTotals.map((total, index) => <td key={memberAmountColumns[index].field} className={`px-4 py-3 text-right tabular-nums ${memberAmountColumns[index].cellClass}`}>{formatAmount(total)}</td>)}<td className="px-4 py-3 text-right tabular-nums text-slate-950">{formatAmount(memberOverallTotal)}</td><td /></tr></tfoot>
              </table>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Showing {visibleMembers.length} of {members.length} employees</div>
          </div>
        )}</>}

      {accountFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAccountForm(); }}>
        <form onSubmit={saveAccount} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">{editingMember ? "Edit Pag-IBIG Account" : "Add Pag-IBIG Employee Account"}</h2><p className="mt-0.5 text-xs text-slate-500">Maintain the employee&apos;s MID, yearly savings, MP2, and loan account details.</p></div><button type="button" onClick={closeAccountForm} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><span id="pagibig-employee-picker-label" className={labelClass}>Employee</span><EmployeePicker options={members.filter((member) => !member.pagIbigAccount || member.id === editingMember?.id)} value={accountForm.employeeId} onChange={(employeeId) => { setAccountForm((current) => ({ ...current, employeeId })); setAccountError(""); }} disabled={Boolean(editingMember)} /></div>
            <label className="sm:col-span-2"><span className={labelClass}>Account Year</span><select disabled value={accountForm.year} className={inputClass}>{accountYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
            <label className="sm:col-span-2"><span className={labelClass}>MID Number</span><input required maxLength={40} value={accountForm.midNumber} onChange={(event) => setAccountForm((current) => ({ ...current, midNumber: event.target.value }))} className={inputClass} /></label>
            <MoneyInput label="Member Savings · EE" value={accountForm.employeeSavings} onChange={(value) => setAccountForm((current) => ({ ...current, employeeSavings: value }))} />
            <MoneyInput label="Member Savings · ER" value={accountForm.employerSavings} onChange={(value) => setAccountForm((current) => ({ ...current, employerSavings: value }))} />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={accountForm.excludedFromReport} onChange={(event) => setAccountForm((current) => ({ ...current, excludedFromReport: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" />Exclude this employee from generated reports</label>
            <label><span className={labelClass}>MP2 Account No.</span><input maxLength={80} value={accountForm.mp2AccountNumber} onChange={(event) => setAccountForm((current) => ({ ...current, mp2AccountNumber: event.target.value }))} className={inputClass} /></label>
            <MoneyInput label="MP2 Monthly Amount" value={accountForm.mp2Amount} onChange={(value) => setAccountForm((current) => ({ ...current, mp2Amount: value }))} />
            <div className="sm:col-span-2"><h3 className="mb-1 border-b border-slate-200 pb-2 text-sm font-bold text-slate-800">Loan Accounts</h3><p className="mb-3 text-xs text-slate-500">Enter an application number, start date, term, and monthly amount for each loan. The end date is calculated from the term.</p><div className="grid gap-4 md:grid-cols-2">
              {PAGIBIG_LOAN_TYPES.map((type) => <fieldset key={type} className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">{loanLabels[type]}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className={labelClass}>Application No.</span><input maxLength={120} value={accountForm.loanDetails[type].applicationNo} onChange={(event) => setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [type]: { ...current.loanDetails[type], applicationNo: event.target.value } } }))} className={inputClass} /></label>
                  <label><span className={labelClass}>Loan Term Date</span><input type="date" value={accountForm.loanDetails[type].loanTermDate} onChange={(event) => setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [type]: { ...current.loanDetails[type], loanTermDate: event.target.value } } }))} className={inputClass} /></label>
                  <label><span className={labelClass}>Term (Years)</span><input type="number" min="1" max="50" step="1" value={accountForm.loanDetails[type].termYears} onChange={(event) => setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [type]: { ...current.loanDetails[type], termYears: event.target.value } } }))} className={inputClass} /></label>
                  <MoneyInput label="Monthly Amount" value={accountForm.loanDetails[type].amount} onChange={(value) => setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [type]: { ...current.loanDetails[type], amount: value } } }))} />
                  <label><span className={labelClass}>Status</span><select value={accountForm.loanDetails[type].status} onChange={(event) => setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [type]: { ...current.loanDetails[type], status: event.target.value } } }))} className={inputClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
                </div>
              </fieldset>)}
            </div></div>
            {accountError && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{accountError}</p>}
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4"><button type="button" onClick={closeAccountForm} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button disabled={savingAccount} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{savingAccount ? "Saving..." : "Save"}</button></div>
        </form>
      </div>}

      {reportFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={generateReport} className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-900">Generate Pag-IBIG Report</h2><button type="button" onClick={() => setReportFormOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="grid grid-cols-2 gap-4 p-5"><label><span className={labelClass}>Applicable Month</span><select value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={inputClass}>{monthNames.map((month, index) => <option key={month} value={index + 1} disabled={reports.some((report) => report.applicableMonth === index + 1 && report.applicableYear === Number(reportYear))}>{month}</option>)}</select></label><label><span className={labelClass}>Year</span><input required type="number" min="2020" max="2200" value={reportYear} onChange={(event) => { setReportYear(event.target.value); if (/^\d{4}$/.test(event.target.value)) void loadReportYearAccounts(event.target.value); }} className={inputClass} /></label><label className="col-span-2"><span className={labelClass}>Payment Identification Number (PIN)</span><input required maxLength={120} value={reportPin} onChange={(event) => setReportPin(event.target.value)} className={inputClass} /></label><p className="col-span-2 text-xs text-slate-500">The report snapshots saved monthly amounts from employee Pag-IBIG accounts for the selected year.</p></div>
          {previewLoading ? <div className="px-5 pb-5 text-center text-sm text-slate-500">Loading employee accounts...</div> : <div className="px-5 pb-5">
            {excludedPreviewCount > 0 && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{excludedPreviewCount} employee account(s) are excluded from this report. Update their setting in the Employee List if needed.</p>}
            <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-3 text-left">Member / MID Number</th><th className="px-3 py-3 text-right">EE</th><th className="px-3 py-3 text-right">ER</th><th className="px-3 py-3 text-right">MP2</th><th className="px-3 py-3 text-right">CAL</th><th className="px-3 py-3 text-right">MPL</th><th className="px-3 py-3 text-right">EMER</th><th className="px-3 py-3 text-right">SAFE</th><th className="px-3 py-3 text-right">Total</th><th className="px-3 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{previewEntries.map((member) => {
                const account = member.pagIbigAccount!;
                const rowTotal = ["employeeSavings", "employerSavings", "mp2Amount", "calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"].reduce((sum, field) => sum + Number(account[field as keyof Account] ?? 0), 0);
                return <tr key={member.id}><td className="px-3 py-3 font-medium">{formatEmployeeName(member)}<div className="text-xs font-normal text-slate-500">{member.pagIbigNumber}</div></td>
                  {[account.employeeSavings, account.employerSavings, account.mp2Amount, account.calamityLoanAmount, account.mplLoanAmount, account.emergencyLoanAmount, account.safeLoanAmount].map((amount, index) => <td key={index} className="px-3 py-3 text-right tabular-nums">{formatMoney(amount)}</td>)}
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(rowTotal)}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => openEditAccount(member, true)} className="text-xs font-semibold text-violet-700 hover:underline">Edit Account</button></td></tr>;
              })}{previewEntries.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">No employee accounts with a MID number are ready for this report.</td></tr>}</tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold"><tr><td className="px-3 py-3">Total</td>{(["employeeSavings", "employerSavings", "mp2Amount", "calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"] as (keyof Account)[]).map((field) => <td key={field} className="px-3 py-3 text-right tabular-nums">{formatMoney(previewTotal(field))}</td>)}<td className="px-3 py-3 text-right tabular-nums">{formatMoney(previewOverall)}</td><td /></tr></tfoot>
            </table></div>
          </div>}
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setReportFormOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button disabled={generating || previewLoading || previewYear !== reportYear || previewEntries.length === 0 || reports.some((report) => report.applicableMonth === Number(reportMonth) && report.applicableYear === Number(reportYear))} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{generating ? "Saving..." : "Save Report"}</button></div>
        </form>
      </div>}

      {selectedReport && <ReportDetails report={selectedReport} onClose={() => setSelectedReport(null)} />}
      {paymentReport && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={savePayment} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Payment Details</h2><p className="text-xs text-slate-500">{monthNames[paymentReport.applicableMonth - 1]} {paymentReport.applicableYear} · Amount Due {formatMoney(paymentReport.amountDue)}</p></div><button type="button" onClick={() => setPaymentReport(null)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <MoneyInput label="Amount Paid" value={paymentForm.amountPaid} onChange={(value) => setPaymentForm((current) => ({ ...current, amountPaid: value }))} />
            <label><span className={labelClass}>Payment Type</span><select value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentType: event.target.value }))} className={inputClass}>{paymentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span className={labelClass}>Pay Date</span><input required type="date" value={paymentForm.payDate} onChange={(event) => setPaymentForm((current) => ({ ...current, payDate: event.target.value }))} className={inputClass} /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Transaction Reference</span><input required maxLength={120} value={paymentForm.transactionReference} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionReference: event.target.value }))} className={inputClass} /></label>
            {paymentError && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentError}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setPaymentReport(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button disabled={savingPayment} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{savingPayment ? "Saving..." : "Save Payment"}</button></div>
        </form>
      </div>}
    </main>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input required type="number" min="0" max="999999999.99" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function EmployeePicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Member[];
  value: string;
  onChange: (employeeId: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedEmployee = options.find((employee) => String(employee.id) === value);
  const matchingEmployees = options.filter((employee) =>
    `${formatEmployeeName(employee)} ${employee.employeeCode} ${employee.pagIbigNumber ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  return <div className="relative" ref={pickerRef}>
    <button
      type="button"
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-labelledby="pagibig-employee-picker-label"
      className={`${inputClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:bg-slate-100`}
      onClick={() => {
        setQuery("");
        setOpen((current) => !current);
      }}
    >
      <span className={selectedEmployee ? "truncate text-slate-900" : "truncate text-slate-500"}>
        {selectedEmployee ? `${formatEmployeeName(selectedEmployee)} · ${selectedEmployee.employeeCode}` : "Select employee"}
      </span>
      <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">
      <div className="border-b border-slate-200 p-2">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          aria-label="Search employees"
          placeholder="Search employee or Pag-IBIG number"
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
        />
      </div>
      <div role="listbox" aria-label="Employees" className="max-h-56 overflow-y-auto overscroll-contain">
        {matchingEmployees.map((employee) => {
          const selected = String(employee.id) === value;
          return <button
            key={employee.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => {
              onChange(String(employee.id));
              setOpen(false);
              setQuery("");
            }}
            className={`flex w-full flex-col px-3 py-2 text-left hover:bg-violet-50 ${selected ? "bg-violet-50" : "bg-white"}`}
          >
            <span className="text-sm font-semibold text-slate-900">{formatEmployeeName(employee)}</span>
            <span className="text-xs font-medium text-slate-600">{employee.employeeCode} · {employee.pagIbigNumber || "Pag-IBIG number not set"}</span>
          </button>;
        })}
        {matchingEmployees.length === 0 && <p className="px-3 py-4 text-sm font-medium text-slate-600">No employees found.</p>}
      </div>
    </div>}
  </div>;
}

function ReportDetails({ report, onClose }: { report: Report; onClose: () => void }) {
  const columns: { label: string; value: keyof Pick<ReportEntry, "employeeSavings" | "employerSavings" | "mp2Amount" | "calamityLoanAmount" | "mplLoanAmount" | "emergencyLoanAmount" | "safeLoanAmount" | "totalAmount"> }[] = [
    { label: "EE", value: "employeeSavings" }, { label: "ER", value: "employerSavings" }, { label: "MP2", value: "mp2Amount" },
    { label: "CAL", value: "calamityLoanAmount" }, { label: "MPL", value: "mplLoanAmount" }, { label: "EMER", value: "emergencyLoanAmount" },
    { label: "SAFE", value: "safeLoanAmount" }, { label: "Total", value: "totalAmount" },
  ];
  const totals = columns.map((column) => report.entries.reduce((sum, entry) => sum + Number(entry[column.value]), 0));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6">
    <section className="max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Pag-IBIG Report</h2><p className="text-sm text-slate-500">{monthNames[report.applicableMonth - 1]} {report.applicableYear} · PIN {report.pin}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
      <div className="max-h-[calc(94vh-75px)] overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1120px] text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-3 py-3 text-left">Member / MID Number</th>{columns.map((column) => <th key={column.label} className="px-3 py-3 text-right">{column.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{report.entries.map((entry) => <tr key={entry.id}><td className="px-3 py-3 font-medium">{entry.employeeName}<div className="text-xs font-normal text-slate-500">{entry.midNumber || "—"}</div></td>{columns.map((column) => <td key={column.label} className="px-3 py-3 text-right tabular-nums">{formatMoney(entry[column.value])}</td>)}</tr>)}</tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold"><tr><td className="px-3 py-3">Total</td>{totals.map((total, index) => <td key={columns[index].label} className="px-3 py-3 text-right tabular-nums">{formatMoney(total)}</td>)}</tr></tfoot>
        </table></div>
        <div className="mt-4 text-right text-sm font-bold text-slate-900">Overall Amount Due: {formatMoney(report.amountDue)}</div>
      </div>
    </section>
  </div>;
}
