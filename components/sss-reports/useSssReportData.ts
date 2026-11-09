"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type DraftSaveStatus, type DraftFormState, type DraftEntry, type Employer, type PaymentKind,
  type Report, type SssReportDraft,
} from "./types";

export type UseSssReportDataArgs = {
  kind: PaymentKind;
  selectedEmployerId: string;
  currentYear: number;
};

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();
  if (!response.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

/** Loads employers, reports and saved drafts; exposes filtered derived lists and refresh helpers. */
export function useSssReportData({ kind, selectedEmployerId, currentYear }: UseSssReportDataArgs) {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [reportDrafts, setReportDrafts] = useState<SssReportDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [search, setSearch] = useState("");
  const [refreshingRecords, setRefreshingRecords] = useState(false);

  const loadReports = useCallback(async () => {
    if (!selectedEmployerId) {
      setReports([]);
      setCanEditPayments(false);
      return;
    }
    const data = await fetchJson<{ reports: Report[]; canEditPayments: boolean }>(
      `/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
    setReports(data.reports);
    setCanEditPayments(data.canEditPayments === true);
  }, [selectedEmployerId]);

  const loadReportDrafts = useCallback(async () => {
    const data = await fetchJson<{ drafts: SssReportDraft[] }>(
      `/api/reports/sss/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" });
    setReportDrafts(data.drafts);
  }, [selectedEmployerId]);

  const refreshSssRecords = useCallback(async () => {
    await Promise.all([loadReports(), loadReportDrafts()]);
  }, [loadReports, loadReportDrafts]);

  const resetFiltersAndRefresh = useCallback(async () => {
    setYearFilter(String(currentYear));
    setSearch("");
    setRefreshingRecords(true);
    setError("");
    try {
      await refreshSssRecords();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh SSS reports");
    } finally {
      setRefreshingRecords(false);
    }
  }, [currentYear, refreshSssRecords]);

  useEffect(() => {
    if (!selectedEmployerId) return;
    let cancelled = false;
    Promise.all([
      fetchJson<{ employers: Employer[] }>("/api/reports/sss/employers", { cache: "no-store" }),
      fetchJson<{ reports: Report[]; canEditPayments: boolean }>(
        `/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" }),
      fetchJson<{ drafts: SssReportDraft[] }>(
        `/api/reports/sss/drafts?employerId=${encodeURIComponent(selectedEmployerId)}`, { cache: "no-store" }),
    ]).then(([employerData, reportData, draftData]) => {
      if (cancelled) return;
      setEmployers(employerData.employers);
      setReports(reportData.reports);
      setCanEditPayments(reportData.canEditPayments === true);
      setReportDrafts(draftData.drafts);
      setError("");
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load SSS data");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEmployerId]);

  const years = useMemo(
    () => [...new Set([String(currentYear), ...reports.map((report) => String(report.applicableYear))])].sort((a, b) => b.localeCompare(a)),
    [reports, currentYear],
  );

  const annualReports = useMemo(() => {
    const selectedYear = yearFilter || String(currentYear);
    const yearReports = reports.filter((report) => report.kind === kind
      && String(report.employerId) === selectedEmployerId
      && String(report.applicableYear) === selectedYear);
    const monthlyMap = new Map(yearReports.map((report) => [report.applicableMonth, report]));
    const monthlyList: (Report | null)[] = [];
    for (let month = 1; month <= 12; month++) monthlyList.push(monthlyMap.get(month) || null);
    return monthlyList;
  }, [reports, kind, selectedEmployerId, yearFilter, currentYear]);

  const visibleReportDrafts = useMemo(
    () => reportDrafts.filter((savedDraft) => savedDraft.kind === kind && String(savedDraft.employerId) === selectedEmployerId),
    [reportDrafts, kind, selectedEmployerId],
  );

  const removeDraft = (draftId: number) => setReportDrafts((current) => current.filter((item) => item.id !== draftId));

  return {
    employers, reports, setReports, canEditPayments, reportDrafts, removeDraft,
    loading, error, setError, notice, setNotice, yearFilter, setYearFilter, search, setSearch,
    refreshingRecords, refreshSssRecords, resetFiltersAndRefresh,
    years, annualReports, visibleReportDrafts,
  };
}

export type SssReportData = ReturnType<typeof useSssReportData>;

/** Persisted-draft queue + autosave state shared by create/edit/report flows. */
export function useSssDraftPersistence(args: {
  kind: PaymentKind;
  draft: DraftFormState;
  entries: DraftEntry[];
}) {
  const { kind, draft, entries } = args;
  const [draftId, setDraftId] = useState<number | null>(null);
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  const draftSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");

  const persistReportDraft = useCallback(async (release: boolean) => {
    const data = await fetchJson<{ draft: SssReportDraft }>("/api/reports/sss/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draftIdRef.current,
        release,
        kind,
        employerId: Number(draft.employerId) || null,
        prn: draft.prn,
        applicableMonth: Number(draft.month),
        applicableYear: Number(draft.year),
        amountDue: draft.amountDue,
        entries,
      }),
    });
    draftIdRef.current = data.draft.id;
    setDraftId(data.draft.id);
    return data.draft;
  }, [draft, entries, kind]);

  const resetDraftId = () => {
    draftIdRef.current = null;
    setDraftId(null);
    setDraftSaveStatus("idle");
  };

  const setDraftIdDirect = (id: number | null) => {
    draftIdRef.current = id;
    setDraftId(id);
  };

  return { draftId, draftIdRef, draftSaveQueueRef, draftSaveStatus, setDraftSaveStatus, persistReportDraft, resetDraftId, setDraftIdDirect };
}


