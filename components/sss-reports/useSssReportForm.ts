"use client";

import { useCallback, useMemo, useState } from "react";
import { getSssContributionBracketForYear } from "@/lib/sssContributionTable";
import { employeeName, loanReportEntryAmount, monthNames } from "./format";
import type {
  DraftEntry, DraftFormState, Employee, PaymentKind, Report, SssLoan,
} from "./types";

type UseSssReportFormArgs = {
  kind: PaymentKind;
  selectedEmployerId: string;
  currentMonth: number;
  currentYear: number;
  reports: Report[];
  employers: EmployerRef[];
  setError: (message: string) => void;
  setNotice: (message: string) => void;
};

export type EmployerRef = { id: number; name: string; shortAddress: string | null; longAddress: string | null; sss: string | null; employees: Employee[] };

/** Report create/edit form: draft fields, entries, employee/loan picker state and entry mutations. */
export function useSssReportForm(args: UseSssReportFormArgs) {
  const { kind, selectedEmployerId, currentMonth, currentYear, reports, employers, setError, setNotice } = args;
  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);
  const [loanEntrySearch, setLoanEntrySearch] = useState("");
  const [selectedMsc, setSelectedMsc] = useState("");
  const [employeeSssSearch, setEmployeeSssSearch] = useState("");
  const [contributionEmployees, setContributionEmployees] = useState<Employee[]>([]);
  const [loadingEmployerEmployees, setLoadingEmployerEmployees] = useState(false);
  const [loadingPreviousEntries, setLoadingPreviousEntries] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);
  const [rangePickerTarget, setRangePickerTarget] = useState<"new" | number | null>(null);
  const [draft, setDraft] = useState<DraftFormState>({
    employerId: selectedEmployerId, prn: "", month: String(currentMonth), year: String(currentYear), amountDue: "",
  });
  const [entries, setEntries] = useState<DraftEntry[]>([]);

  const selectedEmployer = employers.find((employer) => String(employer.id) === draft.employerId) ?? null;
  const pickerEmployees = contributionEmployees;
  const employeeSearchQuery = employeeSssSearch.trim().toLocaleLowerCase();
  const employeeSearchDigits = employeeSssSearch.replace(/\D/g, "");
  const selectedContributionEmployee = pickerEmployees.find((candidate) => String(candidate.id) === selectedEmployeeId) ?? pendingEmployee;
  const rangeEmployee = pendingEmployee ?? pickerEmployees.find((employee) => String(employee.id) === selectedEmployeeId);
  const compensationEmployeeName = rangePickerTarget === "new"
    ? (rangeEmployee ? employeeName(rangeEmployee) : "Employee")
    : entries.find((entry) => entry.employeeId === rangePickerTarget)?.employeeName ?? "Employee";

  const chosenEmployeeIds = useMemo(() => new Set(entries.map((entry) => entry.employeeId)), [entries]);

  const filteredContributionEmployees = useMemo(() => pickerEmployees.filter((employee) => {
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
  }), [pickerEmployees, employeeSearchQuery, employeeSearchDigits]);

  const availableLoanEntries = useMemo(() => {
    const needle = loanEntrySearch.trim().toLocaleLowerCase();
    return (loanRecords: SssLoan[]) => loanRecords.filter((loan) => loan.employeeId !== null
      && !entries.some((entry) => entry.sssLoanId === loan.id)
      && (!needle
        || loan.employeeName.toLocaleLowerCase().includes(needle)
        || (loan.employeeSssNumber ?? "").toLocaleLowerCase().includes(needle)
        || loan.loanAccountNumber.toLocaleLowerCase().includes(needle)));
  }, [entries, loanEntrySearch]);

  const existingLoanReportMonths = useMemo(() => {
    if (kind !== "LOAN" || !draft.employerId) return new Set<number>();
    return new Set(reports
      .filter((report) => report.kind === "LOAN"
        && report.employerId === Number(draft.employerId)
        && report.applicableYear === Number(draft.year))
      .map((report) => report.applicableMonth));
  }, [draft.employerId, draft.year, kind, reports]);

  const employeeTotal = useCallback((entry: DraftEntry, year: number) => {
    if (kind === "LOAN") return Math.round((Number(entry.loanAmount) || 0) * 100) / 100;
    return getSssContributionBracketForYear(year, Number(entry.monthlySalaryCredit))?.total ?? 0;
  }, [kind]);

  const calculatedTotal = entries.reduce((sum, entry) => sum + employeeTotal(entry, Number(draft.year)), 0);
  const amountDue = Number(draft.amountDue);
  const hasLegacyLoanEntries = kind === "LOAN" && entries.some((entry) => !Number.isSafeInteger(entry.sssLoanId) || !entry.sssLoanId);
  const hasUnconfiguredEntries = entries.some((entry) => kind === "CONTRIBUTION"
    ? !entry.monthlySalaryCredit
    : !entry.sssLoanId || !entry.loanAccountNumber || !entry.loanAmount || Number(entry.loanAmount) <= 0);
  const isTally = entries.length > 0 && !hasUnconfiguredEntries && Number.isFinite(amountDue) && amountDue > 0
    && Math.round(calculatedTotal * 100) === Math.round(amountDue * 100);

  const resetReportDraft = () => {
    setEditReport(null);
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

  const loanEntryFromLoan = (loan: SssLoan): DraftEntry => ({
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
  });

  const entryFromEmployee = (employee: Employee): DraftEntry => ({
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employeeName(employee),
    employeeSssNumber: employee.sssNumber,
    employeeEmployerId: employee.employerId ?? null,
    employeeEmployerName: employee.employerName ?? null,
    monthlySalaryCredit: null,
    loanAmount: "",
  });

  const addSelectedEmployee = (loanRecordsForEntry: SssLoan[]) => {
    if (kind === "LOAN") {
      if (hasLegacyLoanEntries) return;
      const selectedLoans = loanRecordsForEntry.filter((loan) =>
        selectedLoanIds.includes(loan.id)
        && loan.employeeId !== null
        && !entries.some((entry) => entry.sssLoanId === loan.id));
      if (selectedLoans.length === 0) return;
      setEntries((current) => [...current, ...selectedLoans.map(loanEntryFromLoan)]);
      setSelectedLoanIds([]);
      setLoanEntrySearch("");
      setPickerOpen(false);
      return;
    }
    const employee = pickerEmployees.find((candidate) => String(candidate.id) === selectedEmployeeId);
    if (!employee) return;
    setEntries((current) => [...current, {
      ...entryFromEmployee(employee),
      monthlySalaryCredit: Number(selectedMsc) || null,
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

  const openEmployeePicker = async (loadOutstandingLoans: () => Promise<void>) => {
    setSelectedEmployeeId("");
    setEmployeeDropdownOpen(false);
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
        if (!selectedEmployer) throw new Error("Select an employer before adding a loan account.");
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

  const addAllEmployees = async (
    loadOutstandingLoans: (period: { month: number; year: number }) => Promise<SssLoan[]>,
  ) => {
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
        const loans = await loadOutstandingLoans({ month, year });
        const alreadySelected = new Set(entries.map((entry) => entry.sssLoanId).filter((id): id is number => typeof id === "number"));
        const availableLoans = loans.filter((loan) => loan.employeeId !== null && loan.reportTiming === "DUE" && !alreadySelected.has(loan.id));
        if (availableLoans.length === 0) {
          setNotice("No unselected current-month active loan accounts are available.");
          return;
        }
        if (!window.confirm(`Add ${availableLoans.length} current-month active loan account${availableLoans.length === 1 ? "" : "s"} for ${selectedEmployer.name}? Each amount starts with the scheduled payment and can be adjusted to match SSS.`)) return;
        setEntries((current) => [...current, ...availableLoans.map(loanEntryFromLoan)]);
        return;
      }
      const alreadySelected = new Set(entries.map((entry) => entry.employeeId));
      const availableEmployees = (await loadAllReportEmployees()).filter((employee) => !alreadySelected.has(employee.id));
      if (availableEmployees.length === 0) {
        setNotice("All employees from the database are already in this report.");
        return;
      }
      if (!window.confirm(`Add all ${availableEmployees.length} employees from the database, including inactive employees and employees without an employer? You can set each employee's contribution range in the report.`)) return;
      setEntries((current) => [...current, ...availableEmployees.map(entryFromEmployee)]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load SSS report employees");
    } finally {
      setLoadingEmployerEmployees(false);
    }
  };

  const addPreviousEntries = async (
    loadOutstandingLoans: (period: { month: number; year: number }) => Promise<SssLoan[]>,
    reloadReports: () => Promise<void>,
  ) => {
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
        const loans = await loadOutstandingLoans({ month: previousMonth, year: previousYear });
        const existingLoanIds = new Set(entries.map((entry) => entry.sssLoanId));
        const newLoanEntries = loans.filter((loan) => loan.employeeId !== null && !existingLoanIds.has(loan.id)).map(loanEntryFromLoan);
        if (newLoanEntries.length === 0) {
          setNotice(`No new active loan accounts are due for ${selectedEmployer.name} in ${monthNames[previousMonth - 1]} ${previousYear}.`);
          return;
        }
        setEntries((current) => [...current, ...newLoanEntries]);
        setNotice(`Added ${newLoanEntries.length} loan account${newLoanEntries.length === 1 ? "" : "s"} from ${monthNames[previousMonth - 1]} ${previousYear}.`);
        return;
      }
      await reloadReports();
      const previousReport = reports
        .filter((report) => report.kind === kind
          && report.employerId === selectedEmployer.id
          && report.applicableMonth === previousMonth
          && report.applicableYear === previousYear)
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())[0];
      if (!previousReport) {
        throw new Error(`No ${kind === "CONTRIBUTION" ? "contribution" : "loan"} report was found for ${selectedEmployer.name} in ${monthNames[previousMonth - 1]} ${previousYear}.`);
      }
      const alreadySelected = new Set(entries.map((entry) => entry.employeeId));
      const newEntries = previousReport.entries
        .filter((entry) => !alreadySelected.has(entry.employeeId))
        .map((entry): DraftEntry => ({
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

  const removeEntry = (index: number, entry: DraftEntry) => {
    setEntries((current) => current.filter((row, rowIndex) => kind === "LOAN" ? rowIndex !== index : row.employeeId !== entry.employeeId));
  };

  const selectContributionRange = (monthlySalaryCredit: number) => {
    if (rangePickerTarget === "new") {
      const employee = pendingEmployee ?? pickerEmployees.find((candidate) => String(candidate.id) === selectedEmployeeId);
      if (employee) {
        setEntries((current) => current.some((entry) => entry.employeeId === employee.id) ? current : [...current, {
          ...entryFromEmployee(employee),
          employeeEmployerId: employee.employerId ?? selectedEmployer?.id ?? null,
          employeeEmployerName: employee.employerName ?? selectedEmployer?.name ?? null,
          monthlySalaryCredit,
        }]);
        setPendingEmployee(null);
        setSelectedEmployeeId("");
        setEmployeeSssSearch("");
        setPickerOpen(false);
      }
    } else if (typeof rangePickerTarget === "number") updateEntry(rangePickerTarget, { monthlySalaryCredit });
    setRangePickerTarget(null);
  };

  const openReportEdit = (report: Report) => {
    setEditReport(report);
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

  return {
    createOpen, setCreateOpen, editReport, preview, setPreview,
    pickerOpen, setPickerOpen, selectedEmployeeId, setSelectedEmployeeId,
    employeeDropdownOpen, setEmployeeDropdownOpen, selectedLoanIds, setSelectedLoanIds,
    loanEntrySearch, setLoanEntrySearch, selectedMsc, setSelectedMsc,
    employeeSssSearch, setEmployeeSssSearch, contributionEmployees, setContributionEmployees,
    loadingEmployerEmployees, loadingPreviousEntries, pendingEmployee, setPendingEmployee,
    rangePickerTarget, setRangePickerTarget, draft, setDraft, entries, setEntries,
    selectedEmployer, chosenEmployeeIds, filteredContributionEmployees, availableLoanEntries,
    existingLoanReportMonths, employeeTotal, calculatedTotal, amountDue,
    hasLegacyLoanEntries, hasUnconfiguredEntries, isTally,
    selectedContributionEmployee, compensationEmployeeName, pickerEmployees,
    resetReportDraft, openCreate, addSelectedEmployee, selectEmployeeForContribution,
    loadAllReportEmployees, openEmployeePicker, addAllEmployees, addPreviousEntries,
    updateEntry, updateLoanEntry, removeEntry, selectContributionRange, openReportEdit,
  };
}
