"use client";

import { useState, useCallback } from "react";
import type { ReportDraft } from '@/components/pagibig-reports/shared/types';

// Draft-related state + handlers extracted from PagIbigReportsPage (Tier 6 PR 1 slice).

export type PagibigDraftsState = {
  reportDrafts: ReportDraft[];
  savingDraft: boolean;
  draftsOpen: boolean;
  reportDraftId: number | null;
};

export function usePagibigDrafts(initial?: Partial<PagibigDraftsState>) {
  const [reportDrafts, setReportDrafts] = useState<ReportDraft[]>(initial?.reportDrafts ?? []);
  const [savingDraft, setSavingDraft] = useState(initial?.savingDraft ?? false);
  const [draftsOpen, setDraftsOpen] = useState(initial?.draftsOpen ?? false);
  const [reportDraftId, setReportDraftId] = useState<number | null>(initial?.reportDraftId ?? null);

  const deleteReportDraft = useCallback(async (draft: ReportDraft) => {
    try {
      const response = await fetch(`/api/reports/pagibig/drafts/${draft.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete Pag-IBIG draft");
      setReportDrafts((current) => current.filter((item) => item.id !== draft.id));
      setDraftsOpen(false);
      if (reportDraftId === draft.id) setReportDraftId(null);
    } catch {
      // caller handles error display
    }
  }, [reportDraftId]);

  return {
    reportDrafts,
    setReportDrafts,
    savingDraft,
    setSavingDraft,
    draftsOpen,
    setDraftsOpen,
    reportDraftId,
    setReportDraftId,
    deleteReportDraft,
  };
}