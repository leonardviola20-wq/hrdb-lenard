import type { Dispatch, SetStateAction } from "react";
import type { Report } from "../shared/types";

export type MessageSetter = { setError: (message: string) => void; setNotice: (message: string) => void };

/** Routine: DELETE an SSS report and drop it from the in-memory list. */
export async function deleteReport(
  report: Report,
  deps: {
    setReports: Dispatch<SetStateAction<Report[]>>;
    setViewReport: Dispatch<SetStateAction<Report | null>>;
    dismissDeleteTarget: () => void;
    refreshSssRecords: () => Promise<void>;
  } & MessageSetter,
) {
  deps.setError("");
  try {
    const response = await fetch(`/api/reports/sss/${report.id}`, { method: "DELETE" });
    const responseText = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(responseText?.error || "Unable to delete SSS report");
    deps.setViewReport((current) => (current?.id === report.id ? null : current));
    deps.dismissDeleteTarget();
    deps.setReports((current) => current.filter((candidate) => candidate.id !== report.id));
    deps.setNotice("SSS report deleted.");
    await deps.refreshSssRecords();
  } catch (deleteError) {
    deps.setError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS report");
  }
}

/** Routine: reopen a saved draft through the API "continue" action. */
export async function resumeReportDraft(
  savedDraft: {
    id: number;
    employerId: number | null;
    prn: string;
    applicableMonth: number;
    applicableYear: number;
    amountDue: string;
    entries: ConstructorParameters<typeof Array>[0] extends never ? never : import("../shared/types").DraftEntry[];
  },
  deps: {
    pathname: string;
    search: string;
    routerReplace: (href: string) => void;
    removeDraft: (id: number) => void;
    resetDraftId: () => void;
    setDraftIdDirect: (id: number) => void;
    setDraft: Dispatch<SetStateAction<import("../shared/types").DraftFormState>>;
    setEntries: Dispatch<SetStateAction<import("../shared/types").DraftEntry[]>>;
    setPreview: (value: boolean) => void;
    setPickerOpen: (value: boolean) => void;
    setCreateOpen: (value: boolean) => void;
  } & MessageSetter,
) {
  deps.setError("");
  try {
    const response = await fetch(`/api/reports/sss/drafts/${savedDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "continue" }),
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error || "Unable to continue this SSS report draft");
    deps.removeDraft(savedDraft.id);
  } catch (resumeError) {
    deps.setError(resumeError instanceof Error ? resumeError.message : "Unable to continue this SSS report draft");
    return false;
  }
  const routeParams = new URLSearchParams(deps.search);
  if (savedDraft.employerId) routeParams.set("employerId", String(savedDraft.employerId));
  const routeQuery = routeParams.toString();
  deps.routerReplace(`${deps.pathname}${routeQuery ? `?${routeQuery}` : ""}`);
  deps.resetDraftId();
  deps.setDraftIdDirect(savedDraft.id);
  deps.setDraft({
    employerId: savedDraft.employerId ? String(savedDraft.employerId) : "",
    prn: savedDraft.prn,
    month: String(savedDraft.applicableMonth),
    year: String(savedDraft.applicableYear),
    amountDue: savedDraft.amountDue,
  });
  deps.setEntries(savedDraft.entries);
  deps.setPreview(false);
  deps.setPickerOpen(false);
  deps.setError("");
  deps.setCreateOpen(true);
  return true;
}

/** Routine: DELETE a saved draft from the Saved Drafts menu. */
export async function deleteReportDraft(
  savedDraft: { id: number },
  deps: { removeDraft: (id: number) => void; refreshSssRecords: () => Promise<void> } & MessageSetter,
): Promise<boolean> {
  if (!window.confirm("Delete this saved SSS report draft?")) return false;
  try {
    const response = await fetch(`/api/reports/sss/drafts/${savedDraft.id}`, { method: "DELETE" });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error || "Unable to delete SSS report draft");
    deps.removeDraft(savedDraft.id);
    await deps.refreshSssRecords();
    deps.setNotice("Draft deleted.");
    return true;
  } catch (deleteError) {
    deps.setError(deleteError instanceof Error ? deleteError.message : "Unable to delete SSS report draft");
    return false;
  }
}

export type SaveReportInput = {
  editReport: Report | null;
  kind: "CONTRIBUTION" | "LOAN";
  employer: { id: number; name: string };
  prn: string;
  applicableMonth: number;
  applicableYear: number;
  amountDue: string;
  entries: import("../shared/types").DraftEntry[];
  draftId: number | null;
  prnTrimmed: boolean;
};

/** Routine: POST/PUT the report (or finalise its draft) and return success. */
export async function saveReportRequest(
  input: SaveReportInput,
  deps: { refreshSssRecords: () => Promise<void> } & MessageSetter,
): Promise<boolean> {
  deps.setError("");
  try {
    const response = await fetch(input.editReport ? `/api/reports/sss/${input.editReport.id}` : "/api/reports/sss", {
      method: input.editReport ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(input.editReport ? {} : { draftId: input.draftId }),
        kind: input.kind,
        employerId: input.employer.id,
        prn: input.prn,
        applicableMonth: input.applicableMonth,
        applicableYear: input.applicableYear,
        amountDue: input.amountDue,
        entries: input.entries.map((entry) => ({ employeeId: entry.employeeId, sssLoanId: entry.sssLoanId, monthlySalaryCredit: entry.monthlySalaryCredit, loanAmount: entry.loanAmount })),
      }),
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error || "Unable to save report");
    await deps.refreshSssRecords();
    window.dispatchEvent(new Event("hrdb-sss-records-updated"));
    deps.setNotice(input.editReport ? "The SSS report was updated." : "The SSS report was saved. Payment details can be added after the payment is made.");
    return true;
  } catch (saveError) {
    deps.setError(saveError instanceof Error ? saveError.message : "Unable to save report");
    return false;
  }
}

/** Routine: PATCH payment details onto a saved report. Returns the updated report or null. */
export async function savePaymentRequest(
  report: Report,
  paymentForm: Record<string, string>,
  deps: { refreshSssRecords: () => Promise<void> } & MessageSetter,
): Promise<Report | null> {
  deps.setError("");
  try {
    const response = await fetch(`/api/reports/sss/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error || "Unable to save payment details");
    await deps.refreshSssRecords();
    window.dispatchEvent(new Event("hrdb-sss-records-updated"));
    deps.setNotice("Payment details saved.");
    return responseData.report as Report;
  } catch (saveError) {
    deps.setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    return null;
  }
}
