"use client";

import { useEffect, useState } from "react";
import type { Member, Report, ReportEmployer } from "@/components/pagibig-reports/types";

export function usePagibigReportData({
  accountYear,
  paymentsView,
  selectedEmployerId,
}: {
  accountYear: string;
  paymentsView: boolean;
  selectedEmployerId: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportEmployer, setReportEmployer] = useState<ReportEmployer | null>(null);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

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
        setReportEmployer(data.employer as ReportEmployer);
        if (paymentsView) {
          setReports(data.reports as Report[]);
          setCanEditPayments(Boolean(data.canEditPayments));
        } else {
          setMembers(data.employees as Member[]);
        }
        setLoadedContext(
          `${selectedEmployerId}:${paymentsView ? "payments" : `members:${accountYear}`}`,
        );
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load Pag-IBIG data");
        }
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

  const requestRefresh = () => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  };

  return {
    members,
    setMembers,
    reports,
    setReports,
    reportEmployer,
    setReportEmployer,
    canEditPayments,
    loading,
    loadedContext,
    refreshing,
    refreshKey,
    error,
    setError,
    requestRefresh,
  };
}
