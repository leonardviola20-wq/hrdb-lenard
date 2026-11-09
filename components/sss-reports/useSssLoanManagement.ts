"use client";

import { useCallback, useState, type FormEvent } from "react";
import { parseSssLoanDateFromApi, parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { dateOnly, localDateInputValue, notifySssRecordsUpdated } from "./format";
import type { ActiveLoanReport, Employee, LoanEditStatusState, LoanFormState, SssLoan } from "./types";

type LoadOutstandingOptions = {
  employerId?: number;
  reportPeriod?: { month: number; year: number };
  forReport?: boolean;
  forLoanEntry?: boolean;
  forReportEntry?: boolean;
};

async function postJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error((data as { error?: string } | null)?.error || `Unable to ${method.toLowerCase()} SSS loan`);
  return data as T;
}

/** SSS loan records CRUD: list loading/filtering, create, edit, view-edit, delete, status report. */
export function useSssLoanManagement(args: {
  selectedEmployerId: string;
  currentMonth: number;
  currentYear: number;
}) {
  const { selectedEmployerId, currentMonth, currentYear } = args;
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
  const [loanForm, setLoanForm] = useState<LoanFormState>({
    employerId: "", employeeId: "", loanAccountNumber: "", transactionNumber: "",
    loanType: "S", loanDate: localDateInputValue(new Date()), loanAmount: "", monthlyAmortization: "",
  });
  const [loanEditStatus, setLoanEditStatus] = useState<LoanEditStatusState>({ status: "ACTIVE", reason: "" });

  const loadOutstandingLoans = useCallback(async (options: LoadOutstandingOptions = {}) => {
    setLoadingLoans(true);
    setLoanListError("");
    try {
      const { employerId, reportPeriod, forReport, forLoanEntry, forReportEntry } = options;
      const query = [
        employerId === undefined ? "" : `employerId=${employerId}`,
        reportPeriod ? `month=${reportPeriod.month}&year=${reportPeriod.year}` : "",
        forReport ? "forReport=true" : "",
        forLoanEntry ? "forLoanEntry=true" : "",
        forReportEntry ? "forReportEntry=true" : "",
      ].filter(Boolean).join("&");
      const data = await postJson<{ loans: SssLoan[]; canManageLoans: boolean }>(
        `/api/reports/sss/loans${query ? `?${query}` : ""}`, "GET");
      setLoanRecords(data.loans);
      setCanManageLoans(data.canManageLoans === true);
      return data.loans;
    } catch (loadError) {
      setLoanRecords([]);
      setLoanListError(loadError instanceof Error ? loadError.message : "Unable to load outstanding SSS loans");
      throw loadError;
    } finally {
      setLoadingLoans(false);
    }
  }, []);

  const openLoans = (hasEmployer: boolean) => {
    if (!hasEmployer) return;
    setLoanListSearch("");
    setLoanAccountFilter("");
    setLoanListStatus("ACTIVE");
    setLoanRecords([]);
    setLoanListError("");
    setLoansOpen(true);
    void loadOutstandingLoans({ employerId: Number(selectedEmployerId) });
  };

  const openActiveLoanReport = async (employerName: string) => {
    setLoadingActiveLoanReport(true);
    setActiveLoanReportFilter("ACTIVE");
    setLoanListError("");
    try {
      const query = new URLSearchParams({
        employerId: selectedEmployerId,
        month: String(currentMonth),
        year: String(currentYear),
        forLoanStatusReport: "true",
      });
      const data = await postJson<{ loans: SssLoan[]; employerName?: string }>(`/api/reports/sss/loans?${query}`, "GET");
      setActiveLoanReport({
        employerName: typeof data.employerName === "string" ? data.employerName : employerName,
        loans: data.loans,
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
      const data = await postJson<{ employees: Employee[] }>("/api/reports/sss/employees?all=true", "GET");
      setLoanEmployees(data.employees);
    } catch (loadError) {
      setLoanListError(loadError instanceof Error ? loadError.message : "Unable to load employees for SSS loans");
      setLoadingLoanEmployees(false);
      return;
    }
    setLoadingLoanEmployees(false);
    setLoanForm({
      employerId: selectedEmployerId,
      employeeId: "", loanAccountNumber: "", transactionNumber: "",
      loanType: "S", loanDate: localDateInputValue(new Date()), loanAmount: "", monthlyAmortization: "",
    });
    setLoanFormError("");
    setLoansOpen(false);
    setLoanEntryOpen(true);
  };

  const saveSssLoan = async (event: FormEvent<HTMLFormElement>, setNotice: (value: string) => void) => {
    event.preventDefault();
    if (!parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanFormError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanFormSaving(true);
    setLoanFormError("");
    try {
      const data = await postJson<{ outstandingBalance: string | null }>("/api/reports/sss/loans", "POST", {
        ...loanForm,
        employerId: Number(loanForm.employerId),
        employeeId: Number(loanForm.employeeId),
      });
      setLoanEntryOpen(false);
      notifySssRecordsUpdated();
      setNotice(data.outstandingBalance === null
        ? "SSS loan saved. Approved amount and outstanding balance are unknown until the approved amount is recorded."
        : "SSS loan saved.");
      setLoanListStatus("ACTIVE");
      setLoansOpen(true);
      await loadOutstandingLoans({ employerId: Number(selectedEmployerId) });
    } catch (saveError) {
      setLoanFormError(saveError instanceof Error ? saveError.message : "Unable to save the SSS loan");
    } finally {
      setLoanFormSaving(false);
    }
  };

  const applyLoanToForm = (loan: SssLoan) => {
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
  };

  const openLoanEdit = (loan: SssLoan) => {
    setLoanEditTarget(loan);
    applyLoanToForm(loan);
    setLoanEditStatus({ status: loan.status, reason: loan.statusReason ?? "" });
    setLoanEditError("");
    setLoansOpen(false);
  };

  const saveLoanEdit = async (event: FormEvent<HTMLFormElement>, setNotice: (value: string) => void) => {
    event.preventDefault();
    if (!loanEditTarget || !parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanEditError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanEditSaving(true);
    setLoanEditError("");
    try {
      await postJson(`/api/reports/sss/loans/${loanEditTarget.id}`, "PUT", {
        loanAccountNumber: loanForm.loanAccountNumber,
        transactionNumber: loanForm.transactionNumber,
        loanType: loanForm.loanType,
        loanDate: loanForm.loanDate,
        loanAmount: loanForm.loanAmount,
        monthlyAmortization: loanForm.monthlyAmortization,
        status: loanEditStatus.status,
        reason: loanEditStatus.reason,
      });
      setLoanListStatus(loanEditStatus.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
      setLoanEditTarget(null);
      setNotice("SSS loan updated.");
      setLoansOpen(true);
      await loadOutstandingLoans({ employerId: Number(selectedEmployerId) });
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
      applyLoanToForm(loanViewTarget);
      setLoanEditStatus({ status: loanViewTarget.status, reason: loanViewTarget.statusReason ?? "" });
      setLoanViewEditError("");
      setLoanViewEditMode(true);
    }
  };

  const saveLoanViewEdit = async (event: FormEvent<HTMLFormElement>, setNotice: (value: string) => void) => {
    event.preventDefault();
    if (!loanViewTarget || !parseSssLoanDateOnly(loanForm.loanDate)) {
      setLoanViewEditError("Enter a valid Loan Date using a four-digit year.");
      return;
    }
    setLoanViewEditSaving(true);
    setLoanViewEditError("");
    try {
      const data = await postJson<{ loan: Partial<SssLoan> }>(`/api/reports/sss/loans/${loanViewTarget.id}`, "PUT", {
        loanAccountNumber: loanForm.loanAccountNumber,
        transactionNumber: loanForm.transactionNumber,
        loanType: loanForm.loanType,
        loanDate: loanForm.loanDate,
        loanAmount: loanForm.loanAmount,
        monthlyAmortization: loanForm.monthlyAmortization,
        status: loanEditStatus.status,
        reason: loanEditStatus.reason,
      });
      setLoanListStatus(loanEditStatus.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
      setLoanViewTarget({ ...loanViewTarget, ...data.loan });
      setLoanViewEditMode(false);
      setNotice("SSS loan updated.");
      await loadOutstandingLoans({ employerId: Number(selectedEmployerId) });
    } catch (updateError) {
      setLoanViewEditError(updateError instanceof Error ? updateError.message : "Unable to update SSS loan");
    } finally {
      setLoanViewEditSaving(false);
    }
  };

  const deleteLoan = async (setNotice: (value: string) => void) => {
    if (!loanDeleteTarget) return;
    setLoanDeleteSaving(true);
    setLoanListError("");
    try {
      await postJson(`/api/reports/sss/loans/${loanDeleteTarget.id}`, "DELETE");
      setLoanDeleteTarget(null);
      setNotice("SSS loan deleted. Existing report rows retain their saved account-number snapshots.");
      await loadOutstandingLoans({ employerId: Number(selectedEmployerId) });
    } catch (deleteError) {
      setLoanListError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS loan");
    } finally {
      setLoanDeleteSaving(false);
    }
  };

  return {
    contributionTableOpen, setContributionTableOpen,
    loansOpen, setLoansOpen, loanEntryOpen, setLoanEntryOpen,
    loanRecords, loanEmployees, loadingLoanEmployees, canManageLoans,
    loanListSearch, setLoanListSearch, loanAccountFilter, setLoanAccountFilter,
    loanListStatus, setLoanListStatus, loadingLoans, loanListError, setLoanListError,
    activeLoanReport, setActiveLoanReport, activeLoanReportFilter, setActiveLoanReportFilter, loadingActiveLoanReport,
    loanViewTarget, setLoanViewTarget, loanViewEditMode, setLoanViewEditMode, loanViewEditSaving, loanViewEditError, toggleLoanViewEditMode,
    loanEditTarget, setLoanEditTarget, loanEditSaving, loanEditError,
    loanDeleteTarget, setLoanDeleteTarget, loanDeleteSaving,
    loanFormSaving, loanFormError,
    loanForm, setLoanForm, loanEditStatus, setLoanEditStatus,
    loadOutstandingLoans, openLoans, openActiveLoanReport, openSssLoanForm,
    saveSssLoan, openLoanEdit, saveLoanEdit, saveLoanViewEdit, deleteLoan,
  };
}

export type SssLoanManagement = ReturnType<typeof useSssLoanManagement>;
