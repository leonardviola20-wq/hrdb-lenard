"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { DraftEntry, DraftFormState, DraftSaveStatus } from "../shared/types";

type AutoSaveDeps = {
  createOpen: boolean;
  editReport: boolean;
  saving: boolean;
  draft: DraftFormState;
  entries: DraftEntry[];
  persistReportDraft: (finalise: boolean) => Promise<unknown>;
  draftSaveQueueRef: { current: Promise<unknown> };
  setDraftSaveStatus: Dispatch<SetStateAction<DraftSaveStatus>>;
  setError: (message: string) => void;
};

/** Hook: debounce-save the report draft while the create dialog is open. */
export function useReportDebouncedAutoSave(deps: AutoSaveDeps) {
  useEffect(() => {
    if (!deps.createOpen || deps.editReport || deps.saving || !deps.draft.prn.trim()
      || (!deps.entries.length && !deps.draft.employerId && !deps.draft.prn && !deps.draft.amountDue)) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      deps.setDraftSaveStatus("saving");
      deps.draftSaveQueueRef.current = deps.draftSaveQueueRef.current.then(async () => {
        try {
          await deps.persistReportDraft(false);
          if (!cancelled) deps.setDraftSaveStatus("saved");
        } catch (saveError) {
          if (!cancelled) {
            deps.setDraftSaveStatus("idle");
            deps.setError(saveError instanceof Error ? saveError.message : "Unable to save SSS report draft");
          }
        }
      });
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deps.createOpen, deps.draft, deps.editReport, deps.entries, deps.persistReportDraft,
    deps.saving, deps.draftSaveQueueRef, deps.setDraftSaveStatus, deps.setError,
  ]);
}
