"use client";

import { validPagibigYear } from "@/lib/pagibigYear";
import { PAGIBIG_LOAN_TYPES } from "@/lib/pagibigLoanTypes";
import { mergePagibigPreviewMembers, sortPagibigPreviewMembers } from "@/lib/pagibigReportPreview";
import { monthNames } from "./constants";
import { emptyLoanDetail } from "./format";
import type { usePagibigDrafts } from "./usePagibigDrafts";
import type { usePagibigReportForm } from "./usePagibigReportForm";
import type { Account, Member, Report, ReportDraft } from "./types";

// Report-generation actions extracted from PagIbigReportsPage: open/update the
// report form, manage the employee preview, save/resume drafts, and generate
// (save) the immutable report snapshot.

type ReportFormControls = ReturnType<typeof usePagibigReportForm>;
type DraftsControls = ReturnType<typeof usePagibigDrafts>;

export function usePagibigReportActions({
  form,
  drafts,
  selectedEmployerId,
  paymentsView,
  yearFilter,
  reports,
  setReports,
  setError,
  setNotice,
  allEmployees,
  selectedReportEmployees,
  setSelectedReportEmployees,
  previewRequestRef,
}: {
  form: ReportFormControls;
  drafts: DraftsControls;
  selectedEmployerId: string;
  paymentsView: boolean;
  yearFilter: string;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  allEmployees: Member[];
  selectedReportEmployees: Member[];
  setSelectedReportEmployees: React.Dispatch<React.SetStateAction<Member[]>>;
  previewRequestRef: { current: number };
}) {
  const {
    setPreviewMembers, setPreviewLoading, setPreviewError, setPreviewYear, setPreviewFilter, setReportFormOpen,
    setReportEmployeeId, setReportEmployeePickerOpen, setReportMonth, setReportYear, setReportPin, setManualReport,
    setReportKind, setUpdatingReportId, setGenerating,
  } = form;
  const { previewMembers, reportFormOpen, reportEmployeeId, reportMonth, reportYear, reportPin, manualReport, reportKind, reportDraftId, updatingReportId } = form.state;
  const { reportDrafts, setReportDrafts, setSavingDraft, setReportDraftId, deleteReportDraft: deleteDraftInternal } = drafts;

  const loadReportYearAccounts = async (
    year: string,
    retainedMembers: Member[] = mergePagibigPreviewMembers(
      previewMembers.map((member) => ({ ...member, pagIbigAccount: null })),
      selectedReportEmployees,
    ),
  ) => {
    const requestId = ++previewRequestRef.current;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewYear("");
    setPreviewMembers(retainedMembers.map((member) => ({ ...member, pagIbigAccount: null })));
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(year)}`, { cache: "no-store" });
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
      for (let month = 1; month <= 12; month++) {
        if (!monthsWithReports.has(month)) { setReportMonth(String(month)); break; }
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

  const restrictAccountForKind = (account: Account | null): Account | null => {
    if (!account || !manualReport) return account;
    return reportKind === "CONTRIBUTION"
      ? { ...account, calamityLoanAmount: "0", mplLoanAmount: "0", emergencyLoanAmount: "0", safeLoanAmount: "0" }
      : { ...account, employeeSavings: "0", employerSavings: "0", mp2Amount: "0" };
  };

  const addReportEmployee = async (employeeId: string = reportEmployeeId) => {
    const employee = allEmployees.find((item) => String(item.id) === employeeId);
    if (!employee || previewMembers.some((member) => member.id === employee.id)) return;
    setPreviewLoading(true);
    let memberAccount: Account | null = null;
    try {
      const response = await fetch(`/api/reports/pagibig/members?employerId=${encodeURIComponent(selectedEmployerId)}&year=${encodeURIComponent(reportYear)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        const yearEmployee = (data.employees as Member[]).find((item) => item.id === employee.id);
        memberAccount = yearEmployee?.pagIbigAccount ?? null;
        // If the account exists but is inactive, set it to active so the employee
        // is eligible for inclusion in generated reports.
        if (memberAccount && memberAccount.excludedFromReport && employee.pagIbigNumber) {
          const targetAccount = memberAccount;
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
                ),
                employerId: Number(selectedEmployerId),
                isNewAccount: false,
              }),
            });
            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              memberAccount = updateData.account as Account;
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
    const selectedEmployee: Member = { ...employee, pagIbigAccount: restrictAccountForKind(memberAccount) };
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
      const reportsResponse = await fetch(`/api/reports/pagibig?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
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
          pagIbigAccount: restrictAccountForKind(employee.pagIbigAccount),
        }));
      }
      if (employeesToAdd.length === 0) {
        const message = previousReport
          ? `No matching employees found for ${monthNames[previousMonth - 1]} ${previousYear}.`
          : "No employees found for the selected year.";
        setPreviewError(message);
        setError(message);
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

  const resetReportYearPreview = () => {
    previewRequestRef.current += 1;
    setPreviewLoading(false);
    setPreviewError("");
    setPreviewYear("");
    setPreviewMembers([]);
    setSelectedReportEmployees([]);
  };

  const saveReportDraft = async () => {
    setError("");
    setSavingDraft(true);
    // Prevent saving a draft when a report is already ready for this month/year.
    if (reports.some((report) => report.applicableMonth === Number(reportMonth) && report.applicableYear === Number(reportYear) && (manualReport ? (report.manual && report.kind === reportKind) : !report.manual))) {
      setError("A Pag-IBIG report already exists for this month and year.");
      setSavingDraft(false);
      return;
    }
    // Prevent duplicate drafts for the same month/year.
    if (reportDrafts.some((draft) => draft.id !== reportDraftId && draft.applicableMonth === Number(reportMonth) && draft.applicableYear === Number(reportYear) && draft.kind === (manualReport ? reportKind : "CONTRIBUTION"))) {
      setError("A draft already exists for this month and year. Open it from Drafts instead.");
      setSavingDraft(false);
      return;
    }
    try {
      const response = await fetch("/api/reports/pagibig/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportDraftId, employerId: selectedEmployerId, applicableMonth: reportMonth, applicableYear: reportYear, pin: reportPin, kind: manualReport ? reportKind : "CONTRIBUTION", manual: manualReport }),
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
    drafts.setDraftsOpen(false);
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

  const deleteReportDraft = async (draft: ReportDraft) => {
    await deleteDraftInternal(draft);
    if (reportDraftId === draft.id) setReportDraftId(null);
    setNotice("Draft deleted.");
  };

  const generateReport = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    setGenerating(true);
    setError("");
    try {
      const employeeIds = previewMembers.map((member) => member.id);
      const endpoint = updatingReportId
        ? `/api/reports/pagibig/${updatingReportId}?employerId=${encodeURIComponent(selectedEmployerId)}`
        : "/api/reports/pagibig";
      const method = updatingReportId ? "PUT" : "POST";
      const body = updatingReportId
        ? JSON.stringify({ pin: reportPin, employeeIds })
        : JSON.stringify({ employerId: selectedEmployerId, applicableMonth: reportMonth, applicableYear: reportYear, pin: reportPin, draftId: reportDraftId, employeeIds, kind: manualReport ? reportKind : "CONTRIBUTION", manual: manualReport });
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate Pag-IBIG report");
      const updatedReport = data.report as Report;
      setReports((current) => updatingReportId ? current.map((report) => report.id === updatedReport.id ? updatedReport : report) : [updatedReport, ...current]);
      if (reportDraftId !== null) setReportDrafts((current) => current.filter((draft) => draft.id !== reportDraftId));
      setUpdatingReportId(null);
      setReportFormOpen(false);
      setNotice(updatingReportId ? "Pag-IBIG report updated." : "Pag-IBIG report saved as an immutable snapshot.");
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate Pag-IBIG report");
    } finally {
      setGenerating(false);
    }
  };

  return {
    loadReportYearAccounts,
    openReportForm,
    openUpdateReport,
    addReportEmployee,
    removeReportEmployee,
    addAllReportEmployees,
    resetReportYearPreview,
    saveReportDraft,
    resumeReportDraft,
    deleteReportDraft,
    generateReport,
  };
}
