"use client";

import { useCallback, useEffect, useState } from "react";
import type { Employee, Employer, Report } from "@/components/philhealth-reports/types";

export function usePhilHealthReportData({
  employerId,
  view,
}: {
  employerId: string;
  view: "employees" | "reports";
}) {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [loadedContext, setLoadedContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!employerId) return;
    const context = `${employerId}:${view}`;
    const endpoint =
      view === "employees"
        ? `/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`
        : `/api/reports/philhealth/reports?employerId=${encodeURIComponent(employerId)}`;
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load PhilHealth records");
        return data;
      })
      .then((data) => {
        setError("");
        if (view === "employees") {
          setEmployer(data.employer as Employer);
          setEmployees(data.employees as Employee[]);
        } else {
          setEmployer(data.employer as Employer);
          setReports(data.reports as Report[]);
          setCanEditPayments(data.canEditPayments === true);
        }
        setLoadedContext(context);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setEmployees([]);
        setReports([]);
        setCanEditPayments(false);
        setLoadedContext(context);
        setError(loadError instanceof Error ? loadError.message : "Unable to load PhilHealth records");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [employerId, refreshKey, view]);

  const requestRefresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    employer,
    setEmployer,
    employees,
    setEmployees,
    reports,
    setReports,
    canEditPayments,
    setCanEditPayments,
    loadedContext,
    loading,
    setLoading,
    error,
    setError,
    refreshKey,
    requestRefresh,
  };
}
