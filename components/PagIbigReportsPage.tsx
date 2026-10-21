"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowPathIcon, BanknotesIcon, ChevronDownIcon, ChevronLeftIcon, EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
type ReportDraft = {
  id: number;
  employerId: number | null;
  pin: string;
  applicableMonth: number;
  applicableYear: number;
  updatedAt: string;
};
type ReportEmployer = { id: number; name: string; pagibigNumber: string | null };

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];
const memberPageSize = 8;
const memberAccountYear = String(new Date().getFullYear());
const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";
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
const memberAmountColumns = [
  { label: "EE", field: "employeeSavings", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "ER", field: "employerSavings", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "MP2", field: "mp2Amount", headerClass: "bg-sky-100 text-sky-900", cellClass: "bg-sky-50 text-sky-950" },
  { label: "CAL", field: "calamityLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "MPL", field: "mplLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "EMER", field: "emergencyLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
  { label: "SAFE", field: "safeLoanAmount", headerClass: "bg-amber-100 text-amber-900", cellClass: "bg-amber-50 text-amber-950" },
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
  const [allEmployees, setAllEmployees] = useState<Member[]>([]);
  const [allEmployeesError, setAllEmployeesError] = useState("");
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportEmployer, setReportEmployer] = useState<ReportEmployer | null>(null);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const accountYear = memberAccountYear;
  const [memberPage, setMemberPage] = useState(1);
  const [memberStatusFilter, setMemberStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [yearFilter, setYearFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [reportPage, setReportPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [returnToReportPreview, setReturnToReportPreview] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [loanEditorType, setLoanEditorType] = useState<PagibigLoanType | "" | null>(null);
  const [loanEditorDetail, setLoanEditorDetail] = useState<LoanDetail>(emptyLoanDetail);
  const [loanStatusFilter, setLoanStatusFilter] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewYear, setPreviewYear] = useState("");
  const [previewFilter, setPreviewFilter] = useState<"READY" | "EXCLUDED" | "MISSING_MID">("READY");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportPin, setReportPin] = useState("");
  const [reportDraftId, setReportDraftId] = useState<number | null>(null);
  const [reportDrafts, setReportDrafts] = useState<ReportDraft[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportMenuOpen, setReportMenuOpen] = useState<number | null>(null);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const draftsMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);
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
          setReportEmployer(data.employer as ReportEmployer);
          setReports(data.reports as Report[]);
          setCanEditPayments(Boolean(data.canEditPayments));
        } else {
          setReportEmployer(data.employer as ReportEmployer);
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

  useEffect(() => {
    if (!paymentsView || !selectedEmployerId) return;
    let cancelled = false;
    fetch(`/api/reports/pagibig/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load Pag-IBIG drafts");
        return data.drafts as ReportDraft[];
      })
      .then((drafts) => { if (!cancelled) setReportDrafts(drafts); })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load Pag-IBIG drafts"); });
    return () => { cancelled = true; };
  }, [paymentsView, refreshKey, selectedEmployerId]);
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
    if (!draftsOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !draftsMenuRef.current?.contains(event.target)) setDraftsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraftsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [draftsOpen]);


  const refresh = () => {
    setError("");
    setNotice("");
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  };

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return members.filter((member) => {
      const isInactive = Boolean(member.pagIbigAccount?.excludedFromReport);
      const matchesStatus = memberStatusFilter === "ALL"
        || (memberStatusFilter === "INACTIVE" ? isInactive : !isInactive);
      const matchesSearch = !query || [formatEmployeeName(member), member.employeeCode, member.pagIbigNumber, member.status]
        .some((value) => value?.toLocaleLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [members, memberStatusFilter, search]);
  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const currentMemberPage = Math.min(memberPage, memberPageCount);
  const visibleMembers = filteredMembers.slice((currentMemberPage - 1) * memberPageSize, currentMemberPage * memberPageSize);
  const memberFirstResult = filteredMembers.length ? (currentMemberPage - 1) * memberPageSize + 1 : 0;
  const memberLastResult = Math.min(currentMemberPage * memberPageSize, filteredMembers.length);

  const years = useMemo(() => [...new Set(reports.map((report) => report.applicableYear))].sort((a, b) => b - a), [reports]);
  const visibleReports = useMemo(() => reports.filter((report) => {
    if (yearFilter && String(report.applicableYear) !== yearFilter) return false;
    const paid = report.amountPaid !== null && report.payDate !== null;
    if (paymentStatusFilter !== "ALL" && (paymentStatusFilter === "PAID") !== paid) return false;
    const query = search.trim().toLocaleLowerCase();
    return !query || `${monthNames[report.applicableMonth - 1]} ${report.applicableYear} ${report.amountDue} ${report.amountPaid ?? ""} ${report.entries.map((entry) => `${entry.employeeName} ${entry.midNumber ?? ""}`).join(" ")}`
      .toLocaleLowerCase().includes(query);
  }), [paymentStatusFilter, reports, search, yearFilter]);
  const reportPageSize = 8;
  const reportPageCount = Math.max(1, Math.ceil(visibleReports.length / reportPageSize));
  const currentReportPage = Math.min(reportPage, reportPageCount);
  const pagedReports = visibleReports.slice((currentReportPage - 1) * reportPageSize, currentReportPage * reportPageSize);

  const openAddAccount = () => {
    setReturnToReportPreview(false);
    setEditingMember(null);
    setAccountForm({ ...emptyAccountForm(), year: accountYear });
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
      .then((employees) => setAllEmployees(employees))
      .catch((loadError: unknown) => {
        setAllEmployeesError(loadError instanceof Error ? loadError.message : "Unable to load employees");
      })
      .finally(() => setAllEmployeesLoading(false));
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
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanStatusFilter("ACTIVE");
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    setAccountFormOpen(false);
    setLoanEditorType(null);
    if (returnToReportPreview) setReportFormOpen(true);
    setReturnToReportPreview(false);
  };

  const openLoanEditor = (type: PagibigLoanType | "" | null) => {
    setLoanEditorType(type);
    setLoanEditorDetail(type ? { ...accountForm.loanDetails[type] } : emptyLoanDetail());
    setAccountError("");
  };

  const saveLoanDetail = () => {
    if (!loanEditorType) {
      setAccountError("Choose a loan type.");
      return;
    }
    const type = loanEditorType;
    const detail = loanEditorDetail;
    const amount = Number(detail.amount);
    if (!detail.applicationNo.trim() || !detail.loanTermDate || !Number.isInteger(Number(detail.termYears))
      || Number(detail.termYears) < 1 || Number(detail.termYears) > 50 || !Number.isFinite(amount) || amount < 0
      || !["ACTIVE", "INACTIVE"].includes(detail.status)) {
      setAccountError("Complete the loan application number, term date, term, amount, and status.");
      return;
    }
    setAccountForm((current) => ({
      ...current,
      loanDetails: { ...current.loanDetails, [type]: { ...detail, applicationNo: detail.applicationNo.trim() } },
    }));
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setAccountError("");
  };

  const availableLoanTypes = PAGIBIG_LOAN_TYPES.filter((type) => !accountForm.loanDetails[type].applicationNo.trim());
  const visibleAccountLoanTypes = PAGIBIG_LOAN_TYPES.filter((type) =>
    accountForm.loanDetails[type].applicationNo.trim() && accountForm.loanDetails[type].status === loanStatusFilter,
  );
  const accountLoanCounts = {
    ACTIVE: PAGIBIG_LOAN_TYPES.filter((type) => accountForm.loanDetails[type].applicationNo.trim() && accountForm.loanDetails[type].status === "ACTIVE").length,
    INACTIVE: PAGIBIG_LOAN_TYPES.filter((type) => accountForm.loanDetails[type].applicationNo.trim() && accountForm.loanDetails[type].status === "INACTIVE").length,
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
    setNotice("");
    setReportDraftId(null);
    setReportFormOpen(true);
    setReportPin("");
    // When in Payments view, seed the report year from the active year filter
    // so the employee preview loads for the selected year (e.g. 2025).
    const initialYear = paymentsView && yearFilter ? yearFilter : reportYear;
    setReportYear(initialYear);
    // Default to the first month of the target year that does not already have a saved report.
    const monthsWithReports = new Set(reports.filter((report) => report.applicableYear === Number(initialYear)).map((report) => report.applicableMonth));
    if (monthsWithReports.has(Number(reportMonth))) {
      for (let m = 1; m <= 12; m++) {
        if (!monthsWithReports.has(m)) { setReportMonth(String(m)); break; }
      }
    }
    await loadReportYearAccounts(initialYear);
  };

  const saveReportDraft = async () => {
    setSavingDraft(true);
    setError("");
    try {
      const response = await fetch("/api/reports/pagibig/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportDraftId, employerId: selectedEmployerId, applicableMonth: reportMonth, applicableYear: reportYear, pin: reportPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save Pag-IBIG draft");
      const draft = data.draft as ReportDraft;
      setReportDraftId(draft.id);
      setReportDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
      setNotice("Draft saved. You can resume it from Drafts.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Pag-IBIG draft");
    } finally { setSavingDraft(false); }
  };

  const resumeReportDraft = async (draft: ReportDraft) => {
    setDraftsOpen(false);
    setReportDraftId(draft.id);
    setReportMonth(String(draft.applicableMonth));
    setReportYear(String(draft.applicableYear));
    setReportPin(draft.pin);
    setReportFormOpen(true);
    await loadReportYearAccounts(String(draft.applicableYear));
  };

  const deleteReportDraft = async (draft: ReportDraft) => {
    try {
      const response = await fetch(`/api/reports/pagibig/drafts/${draft.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete Pag-IBIG draft");
      setReportDrafts((current) => current.filter((item) => item.id !== draft.id));
      setDraftsOpen(false);
      if (reportDraftId === draft.id) setReportDraftId(null);
      setNotice("Draft deleted.");
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Pag-IBIG draft"); }
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
        setMembers((current) => [newMember, ...current]);
        setPreviewMembers((current) => [newMember, ...current]);
      }
      if (!editingMember && !returnToReportPreview) {
        setSearch("");
        setMemberStatusFilter("ACTIVE");
        setMemberPage(1);
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
        body: JSON.stringify({ employerId: selectedEmployerId, applicableMonth: reportMonth, applicableYear: reportYear, pin: reportPin, draftId: reportDraftId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate Pag-IBIG report");
      setReports((current) => [data.report as Report, ...current]);
      if (reportDraftId !== null) setReportDrafts((current) => current.filter((draft) => draft.id !== reportDraftId));
      setReportFormOpen(false);
      setSelectedReport(data.report as Report);
      setNotice("Pag-IBIG report saved as an immutable snapshot.");
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

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setDeletingReport(true);
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
    } finally {
      setDeletingReport(false);
    }
  };

  const hasMemberAccount = (member: Member) => Boolean(member.pagIbigAccount);
  const memberTotals = memberAmountColumns.map(({ field }) => filteredMembers.reduce((total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0), 0));
  const memberSavingsTotal = memberTotals[0] + memberTotals[1];
  const memberOverallTotal = memberTotals.reduce((total, amount) => total + amount, 0);
  const previewEntries = previewMembers.filter((member) => member.pagIbigAccount && member.pagIbigNumber && !member.pagIbigAccount.excludedFromReport);
  const excludedPreviewCount = previewMembers.filter((member) => member.pagIbigAccount && member.pagIbigNumber && member.pagIbigAccount.excludedFromReport).length;
  const missingMidPreviewCount = previewMembers.filter((member) => member.pagIbigAccount && !member.pagIbigNumber).length;
  const readyPreviewCount = previewEntries.length;
  const previewTotal = (field: keyof Account) => previewEntries.reduce((total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0), 0);
  const previewOverall = ["employeeSavings", "employerSavings", "mp2Amount", "calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"]
    .reduce((sum, field) => sum + previewTotal(field as keyof Account), 0);

  const filteredPreviewMembers = previewFilter === "READY"
    ? previewEntries
    : previewMembers.filter((member) => {
      const account = member.pagIbigAccount;
      if (!account) return false;
      if (previewFilter === "EXCLUDED") return Boolean(member.pagIbigNumber && account.excludedFromReport);
      if (previewFilter === "MISSING_MID") return Boolean(account && !member.pagIbigNumber);
      return false;
    });

  return (
    <main className="benefit-report-page flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-6 lg:p-8 md:h-[calc(100dvh-7.75rem)]">
      <section className="benefit-report-header shrink-0 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">Benefits reports</p>
              <h1 className="benefit-report-title">Pag-IBIG {paymentsView ? "Payments" : "Employee List"}</h1>
              {reportEmployer?.id === Number(selectedEmployerId) && <p className="truncate text-sm font-semibold text-slate-700" title={`${reportEmployer.name} · ${reportEmployer.pagibigNumber || "—"}`}>{reportEmployer.name} · {reportEmployer.pagibigNumber || "—"}</p>}
              <p className="hidden text-sm text-slate-600 sm:block">{paymentsView ? "Generate monthly reports and manage payment details." : "Maintain employee MID numbers, savings, MP2, and monthly loan amounts."}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {paymentsView ? (
              <Link href={`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}`} aria-current="page" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">Employee List</Link>
            ) : (
              <Link href={`/reports/pagibig?view=payments&employerId=${encodeURIComponent(selectedEmployerId)}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">Payments</Link>
            )}
            {paymentsView && <div className="relative" ref={draftsMenuRef}>
              <button type="button" aria-expanded={draftsOpen} onClick={() => setDraftsOpen((open) => !open)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">Drafts <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-xs text-white">{reportDrafts.length}</span></button>
              {draftsOpen && <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-amber-200 bg-white p-2 shadow-xl">
                {reportDrafts.length ? reportDrafts.map((draft) => <div key={draft.id} className="flex items-start gap-2 border-b border-slate-100 p-2 last:border-0"><button type="button" onClick={() => void resumeReportDraft(draft)} className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold text-slate-900">{monthNames[draft.applicableMonth - 1]} {draft.applicableYear}</span><span className="mt-1 block text-xs text-slate-700">Updated {new Date(draft.updatedAt).toLocaleString()}</span></button><button type="button" onClick={() => void deleteReportDraft(draft)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Delete</button></div>) : <p className="px-2 py-3 text-sm text-slate-700">No saved drafts.</p>}
              </div>}
            </div>}
          </div>
        </div>

        <div className="benefit-report-toolbar mt-3 min-w-0 border-t border-slate-100 pt-3">
          {selectedEmployerId && (paymentsView ? (
            <button type="button" onClick={() => void openReportForm()} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />Generate Report</button>
          ) : (
            <button type="button" onClick={openAddAccount} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />Add</button>
          ))}
          <input id="pagibig-search" aria-label="Search Pag-IBIG records" value={search} onChange={(event) => { setSearch(event.target.value); if (!paymentsView) setMemberPage(1); }} placeholder={paymentsView ? "Search period or employee" : "Search employee, code, or MID"} className={`${inputClass} min-w-[14rem] flex-[2_1_16rem]`} />
          {!paymentsView ? (
            <select id="pagibig-member-status" aria-label="Filter employee accounts by status" value={memberStatusFilter} onChange={(event) => {
              const status = event.target.value;
              if (status === "ALL" || status === "ACTIVE" || status === "INACTIVE") setMemberStatusFilter(status);
              setMemberPage(1);
            }} className={`${inputClass} flex-[0_0_10rem]`}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          ) : <>
            <select id="pagibig-year" aria-label="Filter reports by year" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setReportPage(1); }} className={`${inputClass} flex-[0_0_10rem]`}>
              <option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select id="pagibig-payment-status" aria-label="Filter reports by payment status" value={paymentStatusFilter} onChange={(event) => { const value = event.target.value; if (value === "ALL" || value === "PAID" || value === "UNPAID") setPaymentStatusFilter(value); setReportPage(1); }} className={`${inputClass} flex-[0_0_10rem]`}>
              <option value="ALL">All statuses</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option>
            </select>
          </>}
          <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
        </div>
      </section>

      {!selectedEmployerId && <p role="status" className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Select an employer from the Reports dashboard to view Pag-IBIG records.</p>}
      {error && <p role="alert" className="benefit-report-notice benefit-report-notice-error shrink-0">{error}</p>}
      {notice && <div role="status" className="benefit-report-notice benefit-report-notice-success shrink-0"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss confirmation" className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><XMarkIcon className="h-4 w-4" /></button></div>}

      {selectedEmployerId && <section className="benefit-report-panel flex min-h-0 flex-1 flex-col">
      {loading || loadedContext !== `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}` ? <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-slate-700"><ArrowPathIcon className="mb-3 h-5 w-5 animate-spin text-slate-400" /><p>Loading Pag-IBIG records...</p></div>
        : paymentsView ? (
          <>
            <div className="benefit-report-section-heading">
              <h2 className="text-sm font-semibold text-slate-900">Generated Reports</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600"><span>{visibleReports.length} reports</span><span>Amount due <strong className="tabular-nums text-slate-900">{formatMoney(visibleReports.reduce((sum, report) => sum + Number(report.amountDue), 0))}</strong></span><span>Paid <strong className="text-emerald-700">{visibleReports.filter((report) => report.amountPaid !== null && report.payDate !== null).length} of {visibleReports.length}</strong></span></div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="benefit-report-table w-full min-w-[850px] text-left text-sm text-slate-900">
                <thead className="sticky top-0 z-10 text-sm font-bold">
                  <tr><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Period</th><th data-report-accent className="bg-sky-100 px-3 py-2 text-right text-sm font-bold text-sky-900">EE + ER Savings</th><th data-report-accent className="bg-sky-100 px-3 py-2 text-right text-sm font-bold text-sky-900">MP2</th><th data-report-accent className="bg-amber-100 px-3 py-2 text-right text-sm font-bold text-amber-900">Loans</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Total</th><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Payment</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedReports.map((report) => {
                    const paid = report.amountPaid !== null && report.payDate !== null;
                    const loans = Number(report.calamityLoanTotal) + Number(report.mplLoanTotal) + Number(report.emergencyLoanTotal) + Number(report.safeLoanTotal);
                    return <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-3 py-1 font-semibold text-slate-900">{monthNames[report.applicableMonth - 1]} {report.applicableYear}<div className="text-xs font-medium text-slate-700">{report.entries.length} employees</div></td>
                      <td className="bg-sky-50 px-3 py-1 text-right font-medium tabular-nums text-sky-950">{formatMoney(Number(report.employeeSavingsTotal) + Number(report.employerSavingsTotal))}</td>
                      <td className="bg-sky-50 px-3 py-1 text-right font-medium tabular-nums text-sky-950">{formatMoney(report.mp2Total)}</td>
                      <td className="bg-amber-50 px-3 py-1 text-right font-medium tabular-nums text-amber-950">{formatMoney(loans)}</td>
                      <td className="px-3 py-1 text-right font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</td>
                      <td className="px-3 py-1"><div className="flex flex-col gap-0.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{paid ? `Paid · ${report.payDate?.slice(0, 10)}` : "Unpaid"}</span>{paid && <p className="text-[10px] leading-tight text-slate-500">{report.paymentType} · {formatMoney(report.amountPaid)}</p>}</div></td>
                      <td className="px-3 py-1"><div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setSelectedReport(report)} aria-label={`View ${monthNames[report.applicableMonth - 1]} ${report.applicableYear} report`} title="View report and payment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-violet-700 hover:bg-violet-100"><EyeIcon className="h-4 w-4" /></button>
                        {canEditPayments ? (
                          <div ref={reportMenuOpen === report.id ? reportMenuRef : null} className="relative">
                            <button type="button" onClick={() => setReportMenuOpen(reportMenuOpen === report.id ? null : report.id)} aria-label={`Actions for ${monthNames[report.applicableMonth - 1]} ${report.applicableYear} report`} title="Report actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"><EllipsisVerticalIcon className="h-4 w-4" /></button>
                            {reportMenuOpen === report.id && <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              <button type="button" onClick={() => { setReportMenuOpen(null); openPayment(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" />{paid ? "Update payment" : "Add payment"}</button>
                              <button type="button" onClick={() => { setReportMenuOpen(null); setSelectedReport(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><PencilSquareIcon className="h-4 w-4" />View report</button>
                              <button type="button" onClick={() => { setReportMenuOpen(null); setDeleteReportTarget(report); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"><TrashIcon className="h-4 w-4" />Delete report</button>
                            </div>}
                          </div>
                        ) : !paid && (
                          <button type="button" onClick={() => openPayment(report)} aria-label={`Add payment for ${monthNames[report.applicableMonth - 1]} ${report.applicableYear}`} title="Add payment" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><BanknotesIcon className="h-4 w-4" /></button>
                        )}
                      </div></td>
                    </tr>;
                  })}
                  {pagedReports.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-700">{reports.length ? "No Pag-IBIG reports match the selected filters." : "No reports have been generated yet."}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="benefit-report-footer"><span>Showing {pagedReports.length ? (currentReportPage - 1) * reportPageSize + 1 : 0}-{Math.min(currentReportPage * reportPageSize, visibleReports.length)} of {visibleReports.length} reports</span><div className="flex items-center gap-2"><button type="button" onClick={() => setReportPage(currentReportPage - 1)} disabled={currentReportPage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="tabular-nums">Page {currentReportPage} of {reportPageCount}</span><button type="button" onClick={() => setReportPage(currentReportPage + 1)} disabled={currentReportPage === reportPageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
          </>
        ) : (
          <>
            <div className="benefit-report-section-heading">
              <h2 className="text-sm font-semibold text-slate-900">Employee Accounts</h2>
              <p className="text-xs text-slate-500">{filteredMembers.length} employees · {memberStatusFilter === "ALL" ? "All statuses" : memberStatusFilter === "ACTIVE" ? "Active" : "Inactive"}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="benefit-report-table w-full min-w-[1160px] text-left text-sm text-slate-900">
                <thead><tr><th className="bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">Employee / Pag-IBIG Number</th>{memberAmountColumns.map((column) => <th key={column.field} data-report-accent className={`px-3 py-2 text-right text-sm font-bold ${column.headerClass}`}>{column.label}</th>)}<th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Grand Total</th><th className="bg-slate-100 px-3 py-2 text-right text-sm font-bold text-slate-800">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleMembers.map((member) => {
                    const account = member.pagIbigAccount;
                    const rowTotal = memberAmountColumns.reduce((total, column) => total + Number(account?.[column.field] ?? 0), 0);
                    const setup = !hasMemberAccount(member);
                    return <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-3 py-1 font-semibold text-slate-900">{formatEmployeeName(member)} <span className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${member.pagIbigAccount?.excludedFromReport ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>{member.pagIbigAccount?.excludedFromReport ? "Inactive" : "Active"}</span><div className="text-xs font-medium text-slate-700">{member.pagIbigNumber || "Pag-IBIG number not set"}</div></td>
                      {memberAmountColumns.map((column) => <td key={column.field} className={`px-3 py-1 text-right font-medium tabular-nums ${column.cellClass}`}>{account ? formatAmount(account[column.field]) : "—"}</td>)}
                      <td className="px-3 py-1 text-right font-bold tabular-nums text-slate-950">{account ? formatAmount(rowTotal) : "—"}</td>
                      <td className="px-3 py-1 text-right"><button type="button" onClick={() => openEditAccount(member)} aria-label={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} title={setup ? "Set up Pag-IBIG account" : "Edit Pag-IBIG account"} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500">{setup ? <PlusIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}</button></td>
                    </tr>;
                  })}
                  {visibleMembers.length === 0 && <tr><td colSpan={10} className="h-11 px-4 text-center text-sm font-medium text-slate-600">No employees match your search.</td></tr>}
                  {Array.from({ length: memberPageSize - Math.max(visibleMembers.length, 1) }, (_, index) => <tr key={`empty-${index}`} aria-hidden="true"><td colSpan={10} className="h-11 p-0" /></tr>)}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <tr>
                    <td className="px-3 py-2 text-slate-800">Totals ({filteredMembers.length} employees)</td>
                    <td colSpan={2} className="bg-sky-50 px-3 py-2 text-right tabular-nums text-sky-950">{formatAmount(memberSavingsTotal)}</td>
                    <td className="bg-sky-50 px-3 py-2 text-right tabular-nums text-sky-950">{formatAmount(memberTotals[2])}</td>
                    {memberTotals.slice(3).map((total, index) => <td key={memberAmountColumns[index + 3].field} className="bg-amber-50 px-3 py-2 text-right tabular-nums text-amber-950">{formatAmount(total)}</td>)}
                    <td className="px-3 py-2 text-right tabular-nums text-slate-950">{formatAmount(memberOverallTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="benefit-report-footer">
              <span>Showing {memberFirstResult}-{memberLastResult} of {filteredMembers.length} employees</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMemberPage(currentMemberPage - 1)} disabled={currentMemberPage === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <span className="tabular-nums">Page {currentMemberPage} of {memberPageCount}</span>
                <button type="button" onClick={() => setMemberPage(currentMemberPage + 1)} disabled={currentMemberPage >= memberPageCount} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </section>}

      {accountFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAccountForm(); }}>
        <form onSubmit={saveAccount} className="pagibig-account-form-scroll max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-50 shadow-2xl">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 sm:px-7">
            <div><h2 className="text-xl font-bold text-slate-950">{editingMember ? "Edit Pag-IBIG Account" : "Add Pag-IBIG Account"}</h2><p className="mt-1 text-sm text-slate-600">Member details, savings, MP2, and loan accounts</p></div>
            <button type="button" onClick={closeAccountForm} aria-label="Close" className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"><XMarkIcon className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4 p-3 sm:p-4">
            {editingMember ? <div className="grid gap-4 rounded-lg border-b border-slate-200 pb-4 sm:grid-cols-2">
              <div><span className={labelClass}>Name</span><p className="text-xl font-bold leading-7 text-slate-950">{formatEmployeeName(editingMember)}</p></div>
              <div><span className={labelClass}>MID Number</span><input required maxLength={40} value={accountForm.midNumber || ""} onChange={(event) => setAccountForm((current) => ({ ...current, midNumber: event.target.value }))} className={`${inputClass} text-base font-semibold`} placeholder="Enter Pag-IBIG MID number" /></div>
            </div> : (<>
              {allEmployeesLoading && <p role="status" className="text-sm text-slate-600">Loading employees...</p>}
              {allEmployeesError && <p role="alert" className="text-sm text-red-600">{allEmployeesError}</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <div><span id="pagibig-employee-picker-label" className={labelClass}>Name</span><EmployeePicker options={allEmployees} value={accountForm.employeeId} onChange={(employeeId) => {
                  const picked = allEmployees.find((employee) => String(employee.id) === employeeId);
                  setAccountForm((current) => ({
                    ...current,
                    employeeId,
                    midNumber: picked?.pagIbigNumber ?? current.midNumber,
                    year: picked?.pagIbigAccount?.year ? String(picked.pagIbigAccount.year) : accountYear,
                  }));
                  setAccountError("");
                }} disabled={allEmployeesLoading || Boolean(allEmployeesError)} prominent /></div>
                <label><span className={labelClass}>MID Number</span><input required maxLength={40} value={accountForm.midNumber} onChange={(event) => setAccountForm((current) => ({ ...current, midNumber: event.target.value }))} className={`${inputClass} text-base font-semibold`} placeholder="Enter Pag-IBIG MID number" /></label>
              </div>
            </>)}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className="text-sm font-semibold text-slate-700">Account Status</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Pag-IBIG account status">
                {(["ACTIVE", "INACTIVE"] as const).map((status) => {
                  const active = status === "ACTIVE" ? !accountForm.excludedFromReport : accountForm.excludedFromReport;
                  return <button key={status} type="button" disabled={!editingMember && status === "INACTIVE"} aria-pressed={active} onClick={() => setAccountForm((current) => ({ ...current, excludedFromReport: status === "INACTIVE" }))} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${active ? status === "ACTIVE" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-700 text-white shadow-sm" : "text-slate-700 hover:bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}>{status === "ACTIVE" ? "Active" : "Inactive"}</button>;
                })}
              </div>
              {!editingMember && <p className="text-xs text-slate-600">New accounts are saved as Active.</p>}
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
              <div className="mb-4"><h3 className="text-base font-bold text-sky-950">Member Savings</h3><p className="mt-1 text-sm text-sky-800">Monthly employee and employer contributions.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyInput label="EE · Employee Share" value={accountForm.employeeSavings} onChange={(value) => setAccountForm((current) => ({ ...current, employeeSavings: value }))} />
                <MoneyInput label="ER · Employer Share" value={accountForm.employerSavings} onChange={(value) => setAccountForm((current) => ({ ...current, employerSavings: value }))} />
              </div>
            </section>

            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
              <div className="mb-4"><h3 className="text-base font-bold text-sky-950">MP2 Savings</h3><p className="mt-1 text-sm text-sky-800">Optional MP2 membership savings.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className={labelClass}>Account No.</span><input maxLength={80} value={accountForm.mp2AccountNumber} onChange={(event) => setAccountForm((current) => ({ ...current, mp2AccountNumber: event.target.value }))} className={inputClass} placeholder="Enter MP2 account number" /></label>
                <MoneyInput label="Amount" value={accountForm.mp2Amount} onChange={(value) => setAccountForm((current) => ({ ...current, mp2Amount: value }))} />
              </div>
            </section>
            </div>

            <div className="mt-4">
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-base font-bold text-amber-950">Loans</h3><p className="mt-1 text-sm text-amber-900">Manage the employee&apos;s Pag-IBIG loan accounts.</p></div>
                <button type="button" onClick={() => openLoanEditor("")} disabled={availableLoanTypes.length === 0 || loanEditorType !== null} className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" />Add Loan</button>
              </div>
              <div className="mt-4 inline-flex rounded-lg border border-amber-200 bg-white p-1" role="group" aria-label="Filter loans by status">
                {(["ACTIVE", "INACTIVE"] as const).map((status) => <button key={status} type="button" aria-pressed={loanStatusFilter === status} onClick={() => setLoanStatusFilter(status)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${loanStatusFilter === status ? "bg-amber-700 text-white shadow-sm" : "text-amber-900 hover:bg-amber-50"}`}>{status === "ACTIVE" ? "Active" : "Inactive"} <span className={loanStatusFilter === status ? "ml-1 text-amber-100" : "ml-1 text-amber-700"}>({accountLoanCounts[status]})</span></button>)}
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-amber-200 bg-white">
                <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto_auto] gap-4 border-b border-amber-100 bg-amber-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-amber-950"><span>Type of Loan</span><span className="text-right">Loan Amount</span><span className="w-16 text-right">Action</span></div>
                {visibleAccountLoanTypes.map((type) => <div key={type} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
                  <div><p className="font-semibold text-slate-900">{loanLabels[type]}</p><p className="mt-0.5 text-xs text-slate-600">Application {accountForm.loanDetails[type].applicationNo} · Term {accountForm.loanDetails[type].loanTermDate || "—"} ({accountForm.loanDetails[type].termYears}y) → ends {loanTermEndDate(accountForm.loanDetails[type].loanTermDate, accountForm.loanDetails[type].termYears)}</p></div>
                  <p className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatAmount(accountForm.loanDetails[type].amount)}</p>
                  <button type="button" onClick={() => openLoanEditor(type)} aria-label={`Edit ${loanLabels[type]} loan`} title={`Edit ${loanLabels[type]} loan`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"><PencilSquareIcon className="h-4 w-4" /></button>
                </div>)}
                {visibleAccountLoanTypes.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-600">{accountLoanCounts.ACTIVE + accountLoanCounts.INACTIVE === 0 ? "No loan accounts added yet." : `No ${loanStatusFilter.toLocaleLowerCase()} loans.`}</p>}
              </div>

              {loanEditorType !== null && <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3"><div><h4 className="font-bold text-slate-900">{loanEditorType && accountForm.loanDetails[loanEditorType].applicationNo ? `Edit ${loanLabels[loanEditorType]} Loan` : "Add Loan Account"}</h4><p className="mt-1 text-xs text-slate-600">Save the loan here, then save the Pag-IBIG account to persist your changes.</p></div><button type="button" onClick={() => setLoanEditorType(null)} aria-label="Close loan editor" className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-4 w-4" /></button></div>
                <label><span className={labelClass}>Type of Loan</span>{loanEditorType && accountForm.loanDetails[loanEditorType].applicationNo ? <input readOnly value={loanLabels[loanEditorType]} className={`${inputClass} bg-slate-50 font-semibold`} /> : <select required value={loanEditorType} onChange={(event) => {
                    const nextType = PAGIBIG_LOAN_TYPES.find((type) => type === event.target.value);
                    if (!nextType) return;
                    setLoanEditorType(nextType);
                    setLoanEditorDetail({ ...accountForm.loanDetails[nextType] });
                  }} className={inputClass}><option value="">Select loan type</option>{availableLoanTypes.map((type) => <option key={type} value={type}>{loanLabels[type]}</option>)}</select>}</label>
                {loanEditorType && <><div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className={labelClass}>Application No.</span><input required maxLength={120} value={loanEditorDetail.applicationNo} onChange={(event) => setLoanEditorDetail((current) => ({ ...current, applicationNo: event.target.value }))} className={inputClass} /></label>
                  <label><span className={labelClass}>Loan Term Date</span><input required type="date" value={loanEditorDetail.loanTermDate} onChange={(event) => setLoanEditorDetail((current) => ({ ...current, loanTermDate: event.target.value }))} className={inputClass} /></label>
                  <label><span className={labelClass}>Term (Years)</span><input required type="number" min="1" max="50" step="1" value={loanEditorDetail.termYears} onChange={(event) => setLoanEditorDetail((current) => ({ ...current, termYears: event.target.value }))} className={inputClass} /></label>
                  <MoneyInput label="Loan Amount" value={loanEditorDetail.amount} onChange={(value) => setLoanEditorDetail((current) => ({ ...current, amount: value }))} />
                  <label><span className={labelClass}>Status</span><select value={loanEditorDetail.status} onChange={(event) => setLoanEditorDetail((current) => ({ ...current, status: event.target.value }))} className={inputClass}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
                </div>
                <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setLoanEditorType(null)} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" onClick={saveLoanDetail} className="h-9 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800">Save Loan</button></div></>}
              </div>}
            </section>
            </div>
            {accountError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{accountError}</p>}
          </div>
          <div className="sticky bottom-0 z-20 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:px-7"><button type="button" onClick={closeAccountForm} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={savingAccount || loanEditorType !== null} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">{savingAccount ? "Saving..." : "Save Account"}</button></div>
        </form>
      </div>}

      {reportFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={generateReport} className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div className="min-w-0"><h2 className="text-lg font-bold text-slate-900">Generate Pag-IBIG Report</h2><p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{reportEmployer?.id === Number(selectedEmployerId) ? `${reportEmployer.name} · ${reportEmployer.pagibigNumber || "—"}` : " "}</p><p className="text-xs text-slate-600">Review the current account data before creating an immutable snapshot.</p></div><button type="button" onClick={() => setReportFormOpen(false)} aria-label="Close" className="ml-3 shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
          <div className="grid grid-cols-2 gap-4 p-5"><label className="col-span-2"><span className={labelClass}>Payment Identification Number (PIN)</span><input required maxLength={120} value={reportPin} onChange={(event) => setReportPin(event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Applicable Month</span><select value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={inputClass}>{monthNames.map((month, index) => <option key={month} value={index + 1} disabled={reports.some((report) => report.applicableMonth === index + 1 && report.applicableYear === Number(reportYear))}>{month}</option>)}</select></label><label><span className={labelClass}>Year</span><input required type="number" min="2020" max="2200" value={reportYear} onChange={(event) => { setReportYear(event.target.value); if (/^\d{4}$/.test(event.target.value)) void loadReportYearAccounts(event.target.value); }} className={inputClass} /></label><p className="col-span-2 text-xs text-slate-600">The report snapshots saved monthly amounts from employee Pag-IBIG accounts for the selected year.</p></div>
          {previewLoading ? <div className="px-5 pb-5 text-center text-sm text-slate-600">Loading employee accounts...</div> : <div className="px-5 pb-5">
            <div className="mb-3 flex flex-wrap gap-2 text-sm sm:grid-cols-3">
              <button type="button" onClick={() => setPreviewFilter("READY")} className={`flex-1 rounded-lg border px-3 py-2 text-left font-semibold transition ${previewFilter === "READY" ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}><span className="font-bold">{readyPreviewCount}</span> Ready</button>
              <button type="button" onClick={() => setPreviewFilter("EXCLUDED")} className={`flex-1 rounded-lg border px-3 py-2 text-left font-semibold transition ${previewFilter === "EXCLUDED" ? "bg-amber-100 text-amber-800 border-amber-200 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}><span className="font-bold">{excludedPreviewCount}</span> Excluded</button>
              <button type="button" onClick={() => setPreviewFilter("MISSING_MID")} className={`flex-1 rounded-lg border px-3 py-2 text-left font-semibold transition ${previewFilter === "MISSING_MID" ? "bg-rose-100 text-rose-800 border-rose-200 shadow-sm" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}><span className="font-bold">{missingMidPreviewCount}</span> Missing MID</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[1120px] text-sm text-slate-900">
              <thead className="text-sm font-bold"><tr><th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Member / MID Number</th><th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">EE</th><th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">ER</th><th className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">MP2</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">CAL</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">MPL</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">EMER</th><th className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">SAFE</th><th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Total</th><th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filteredPreviewMembers.map((member) => {
                const account = member.pagIbigAccount;
                const rowTotal = account ? ["employeeSavings", "employerSavings", "mp2Amount", "calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"].reduce((sum, field) => sum + Number(account[field as keyof Account] ?? 0), 0) : 0;
                const mid = member.pagIbigNumber || "Not set";
                return <tr key={member.id}><td className="px-3 py-3 font-medium text-slate-900">{formatEmployeeName(member)}<div className="text-xs font-normal text-slate-600">{mid}</div></td>
                  {[account?.employeeSavings, account?.employerSavings, account?.mp2Amount].map((amount, index) => <td key={index} className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{account ? formatMoney(amount) : "—"}</td>)}
                  {[account?.calamityLoanAmount, account?.mplLoanAmount, account?.emergencyLoanAmount, account?.safeLoanAmount].map((amount, index) => <td key={index} className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{account ? formatMoney(amount) : "—"}</td>)}
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950">{account ? formatMoney(rowTotal) : "—"}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => openEditAccount(member, true)} className="text-xs font-semibold text-violet-700 hover:underline">Edit Account</button></td></tr>;
              })}{filteredPreviewMembers.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-600">{previewFilter === "READY" ? "No employee accounts with a MID number are ready for this report." : previewFilter === "EXCLUDED" ? "No excluded accounts." : "No employees missing a MID number."}</td></tr>}</tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950"><tr><td className="px-3 py-3">Total</td>{(["employeeSavings", "employerSavings", "mp2Amount"] as (keyof Account)[]).map((field) => <td key={field} className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(previewTotal(field))}</td>)}{(["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"] as (keyof Account)[]).map((field) => <td key={field} className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(previewTotal(field))}</td>)}<td className="px-3 py-3 text-right tabular-nums">{formatMoney(previewOverall)}</td><td /></tr></tfoot>
            </table></div>
          </div>}
          <div className="sticky bottom-0 z-20 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4"><button type="button" onClick={() => setReportFormOpen(false)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={savingDraft || previewLoading} onClick={() => void saveReportDraft()} className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60">{savingDraft ? "Saving draft..." : reportDraftId ? "Update Draft" : "Save Draft"}</button><button disabled={generating || previewLoading || previewYear !== reportYear || previewEntries.length === 0 || reports.some((report) => report.applicableMonth === Number(reportMonth) && report.applicableYear === Number(reportYear))} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">{generating ? "Saving..." : "Save Report"}</button></div>
        </form>
      </div>}

      {selectedReport && <ReportDetails report={selectedReport} onClose={() => setSelectedReport(null)} onPayment={(paidReport) => { setSelectedReport(null); openPayment(paidReport); }} />}
      {deleteReportTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">Delete Pag-IBIG Report?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">Delete the report for <strong>{deleteReportTarget.employerName}</strong> covering <strong>{monthNames[deleteReportTarget.applicableMonth - 1]} {deleteReportTarget.applicableYear}</strong>? Its {deleteReportTarget.entries.length} employee {deleteReportTarget.entries.length === 1 ? "entry" : "entries"} and any recorded payment details will also be removed. This action cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteReportTarget(null)} disabled={deletingReport} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="button" onClick={() => void deleteReport()} disabled={deletingReport} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{deletingReport ? "Deleting..." : "Delete Report"}</button></div>
        </section>
      </div>}
      {paymentReport && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={savePayment} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Payment Details</h2><p className="text-xs text-slate-600">{monthNames[paymentReport.applicableMonth - 1]} {paymentReport.applicableYear} · Amount Due {formatMoney(paymentReport.amountDue)}</p></div><button type="button" onClick={() => setPaymentReport(null)} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
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

function loanTermEndDate(loanTermDate: string, termYears: string) {
  const start = new Date(`${loanTermDate}T00:00:00`);
  const years = Number(termYears);
  if (Number.isNaN(start.getTime()) || !Number.isInteger(years) || years < 1) return "—";
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  return end.toISOString().slice(0, 10);
}

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input required type="number" min="0" max="999999999.99" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function EmployeePicker({
  options,
  value,
  onChange,
  disabled,
  prominent = false,
}: {
  options: Member[];
  value: string;
  onChange: (employeeId: string) => void;
  disabled: boolean;
  prominent?: boolean;
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
      className={`${inputClass} flex items-center justify-between gap-3 text-left ${prominent ? "h-12 text-base font-bold" : ""} disabled:cursor-not-allowed disabled:bg-slate-100`}
      onClick={() => {
        setQuery("");
        setOpen((current) => !current);
      }}
    >
      <span className={selectedEmployee ? "truncate text-slate-900" : "truncate text-slate-600"}>
        {selectedEmployee ? formatEmployeeName(selectedEmployee) : "Select employee"}
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
          placeholder="Search name, code, or MID number"
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-600 focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
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
            <span className="text-sm font-semibold text-slate-900">{formatEmployeeName(employee)} <span className="font-normal text-slate-500">· {employee.employeeCode}</span></span>
            {employee.pagIbigNumber && <span className="text-xs font-medium text-slate-600">MID {employee.pagIbigNumber}</span>}
          </button>;
        })}
        {matchingEmployees.length === 0 && <p className="px-3 py-4 text-sm font-medium text-slate-600">No employees found.</p>}
      </div>
    </div>}
  </div>;
}

function ReportDetails({ report, onClose, onPayment }: { report: Report; onClose: () => void; onPayment: (report: Report) => void }) {
  const savingsColumns: { label: string; value: keyof Pick<ReportEntry, "employeeSavings" | "employerSavings" | "mp2Amount"> }[] = [
    { label: "EE", value: "employeeSavings" }, { label: "ER", value: "employerSavings" }, { label: "MP2", value: "mp2Amount" },
  ];
  const loanColumns: { label: string; value: keyof Pick<ReportEntry, "calamityLoanAmount" | "mplLoanAmount" | "emergencyLoanAmount" | "safeLoanAmount"> }[] = [
    { label: "CAL", value: "calamityLoanAmount" }, { label: "MPL", value: "mplLoanAmount" }, { label: "EMER", value: "emergencyLoanAmount" },
    { label: "SAFE", value: "safeLoanAmount" },
  ];
  const savingsTotals = savingsColumns.map((column) => report.entries.reduce((sum, entry) => sum + Number(entry[column.value]), 0));
  const loanTotals = loanColumns.map((column) => report.entries.reduce((sum, entry) => sum + Number(entry[column.value]), 0));
  const paid = report.amountPaid !== null && report.payDate !== null;
  return <div id="pagibig-report-print-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6">
    <section role="dialog" aria-modal="true" aria-labelledby="pagibig-report-title" className="pagibig-report-print-dialog flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="min-w-0"><h2 id="pagibig-report-title" className="text-lg font-bold text-slate-900">Pag-IBIG Report</h2><p className="text-sm text-slate-600">{monthNames[report.applicableMonth - 1]} {report.applicableYear} · PIN {report.pin}</p></div>
        <div className="pagibig-report-interactive ml-3 flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => window.print()} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Print</button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="pagibig-report-print-content min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <article className="pagibig-report-card overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">{report.employerName}</h3>
              <p className="text-sm font-medium text-slate-600">{report.employerPagibigNumber || "—"}</p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p><p className="mt-1"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{paid ? `Paid · ${report.payDate?.slice(0, 10)}` : "Unpaid"}</span></p>{paid && <p className="mt-1 text-xs text-slate-600">{report.paymentType}{report.transactionReference ? ` · ${report.transactionReference}` : ""} · {formatMoney(report.amountPaid)}</p>}</div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950">{report.entries.length}</p></div>
            </div>
          </div>
          <div className="pagibig-report-print-table overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm text-slate-900"><thead className="text-sm font-bold text-slate-800"><tr><th className="bg-slate-100 px-3 py-3 text-left text-sm font-bold text-slate-800">Member / MID Number</th>{savingsColumns.map((column) => <th key={column.label} className="bg-sky-100 px-3 py-3 text-right text-sm font-bold text-sky-900">{column.label}</th>)}{loanColumns.map((column) => <th key={column.label} className="bg-amber-100 px-3 py-3 text-right text-sm font-bold text-amber-900">{column.label}</th>)}<th className="bg-slate-100 px-3 py-3 text-right text-sm font-bold text-slate-800">Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{report.entries.map((entry) => <tr key={entry.id}><td className="px-3 py-3 font-medium text-slate-900">{entry.employeeName}<div className="text-xs font-normal text-slate-600">{entry.midNumber || "—"}</div></td>{savingsColumns.map((column) => <td key={column.label} className="bg-sky-50 px-3 py-3 text-right font-medium tabular-nums text-sky-950">{formatMoney(entry[column.value])}</td>)}{loanColumns.map((column) => <td key={column.label} className="bg-amber-50 px-3 py-3 text-right font-medium tabular-nums text-amber-950">{formatMoney(entry[column.value])}</td>)}<td className="px-3 py-3 text-right font-bold tabular-nums text-slate-950">{formatMoney(entry.totalAmount)}</td></tr>)}</tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950"><tr><td className="px-3 py-3">Total</td>{savingsTotals.map((total, index) => <td key={savingsColumns[index].label} className="bg-sky-50 px-3 py-3 text-right tabular-nums text-sky-950">{formatMoney(total)}</td>)}{loanTotals.map((total, index) => <td key={loanColumns[index].label} className="bg-amber-50 px-3 py-3 text-right tabular-nums text-amber-950">{formatMoney(total)}</td>)}<td className="px-3 py-3 text-right tabular-nums">{formatMoney(report.amountDue)}</td></tr></tfoot>
            </table>
          </div>
        </article>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
        <p className="text-sm font-bold text-slate-900">Overall Amount Due: {formatMoney(report.amountDue)}</p>
        <div className="pagibig-report-interactive flex gap-2">
          <button type="button" onClick={() => onPayment(report)} className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800">{paid ? "Update Payment" : "Record Payment"}</button>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      </footer>
    </section>
  </div>;
}
