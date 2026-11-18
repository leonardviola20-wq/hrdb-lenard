import type { DraftEntry, DraftFormState } from "../shared/types";

/** Routine: decide whether an in-progress report draft still has unsaved content. */
export function draftHasContent(deps: {
  draftId: number | null;
  draft: DraftFormState;
  entries: DraftEntry[];
  currentMonth: number;
  currentYear: number;
}): boolean {
  return deps.draftId !== null
    || Boolean(deps.draft.employerId || deps.draft.prn.trim() || deps.draft.amountDue.trim() || deps.entries.length)
    || Number(deps.draft.month) !== deps.currentMonth
    || Number(deps.draft.year) !== deps.currentYear;
}

const labels: Record<string, string> = {
  prn: "PRN (Payment Reference Number)",
  employerId: "Employer",
  month: "Applicable Month",
  year: "Applicable Year",
  amountDue: "Amount Due",
};

/** Routine: validate the report form fields before a manual draft save. Returns the first error or "". */
export function validateDraftFields(draft: DraftFormState): string {
  if (!draft.prn.trim()) return "PRN (Payment Reference Number) is required before saving the draft.";
  if (!draft.employerId) return labels.employerId + " is required before saving the draft.";
  if (!draft.month || Number(draft.month) < 1 || Number(draft.month) > 12) return labels.month + " is required before saving the draft.";
  if (!draft.year || Number(draft.year) < 2023) return labels.year + " is required before saving the draft.";
  if (!draft.amountDue || !Number.isFinite(Number(draft.amountDue))) return labels.amountDue + " is required before saving the draft.";
  return "";
}
