"use client";

import { useState, useCallback, useEffect } from "react";
import type { Report, ReportDraft } from "@/components/pagibig-reports/types";

// Draft-related state + handlers extracted from PagIbigReportsPage (Tier 6 PR 1 slice).

export type PagibigDraftsState = {
  reportDrafts: ReportDraft[];
  savingDraft: boolean;
  draftsOpen: boolean;
  reportDraftId: number | null;
};

export function usePagibigDrafts({
  setError,
  setNotice,
  employerId,
  paymentsView,
  refreshKey,
  initial,
}: {
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  employerId: string;
  paymentsView: boolean;
  refreshKey: number;
  initial?: Partial<PagibigDraftsState>;
}) {
  const [reportDrafts, setReportDrafts] = useState<ReportDraft[]>(initial?.reportDrafts ?? []);
  const [savingDraft, setSavingDraft] = useState(initial?.savingDraft ?? false);
  const [draftsOpen, setDraftsOpen] = useState(initial?.draftsOpen ?? false);
  const [reportDraftId, setReportDraftId] = useState<number | null>(initial?.reportDraftId ?? null);

  useEffect(() => {
    if (!paymentsView || !employerId) return;

    let cancelled = false;
    fetch(`/api/reports/pagibig/drafts?employerId=${encodeURIComponent(employerId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load Pag-IBIG drafts");
        return data.drafts as ReportDraft[];
      })
      .then((drafts) => {
        if (!cancelled) setReportDrafts(drafts);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Pag-IBIG drafts");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employerId, paymentsView, refreshKey, setError]);

  const deleteReportDraft = useCallback(async (draft: ReportDraft) => {
    try {
      const response = await fetch(`/api/reports/pagibig/drafts/${draft.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete Pag-IBIG draft");
      setReportDrafts((current) => current.filter((item) => item.id !== draft.id));
      setDraftsOpen(false);
      if (reportDraftId === draft.id) setReportDraftId(null);
      setNotice("Draft deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete Pag-IBIG draft",
      );
    }
  }, [reportDraftId, setError, setNotice]);

  const saveReportDraft = async ({
    reports,
    employerId,
    month,
    year,
    pin,
    manual,
    kind,
  }: {
    reports: Report[];
    employerId: string;
    month: string;
    year: string;
    pin: string;
    manual: boolean;
    kind: "CONTRIBUTION" | "LOAN";
  }) => {
    setError("");
    setSavingDraft(true);

    if (
      reports.some(
        (report) =>
          report.applicableMonth === Number(month) &&
          report.applicableYear === Number(year) &&
          (manual ? report.manual && report.kind === kind : !report.manual),
      )
    ) {
      setError("A Pag-IBIG report already exists for this month and year.");
      setSavingDraft(false);
      return;
    }

    if (
      reportDrafts.some(
        (draft) =>
          draft.id !== reportDraftId &&
          draft.applicableMonth === Number(month) &&
          draft.applicableYear === Number(year) &&
          draft.kind === (manual ? kind : "CONTRIBUTION"),
      )
    ) {
      setError("A draft already exists for this month and year. Open it from Drafts instead.");
      setSavingDraft(false);
      return;
    }

    try {
      const response = await fetch("/api/reports/pagibig/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reportDraftId,
          employerId,
          applicableMonth: month,
          applicableYear: year,
          pin,
          kind: manual ? kind : "CONTRIBUTION",
          manual,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save Pag-IBIG draft");

      const draft = data.draft as ReportDraft;
      setReportDraftId(draft.id);
      setReportDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
      setNotice("Draft saved. You can resume it from Drafts.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Pag-IBIG draft");
    } finally {
      setSavingDraft(false);
    }
  };

  return {
    reportDrafts,
    setReportDrafts,
    savingDraft,
    draftsOpen,
    setDraftsOpen,
    reportDraftId,
    setReportDraftId,
    saveReportDraft,
    deleteReportDraft,
  };
}