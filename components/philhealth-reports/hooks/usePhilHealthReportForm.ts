"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee, Employer, Report } from "@/components/philhealth-reports/shared/types";
import { getPhilHealthShares } from "@/lib/philHealthReportTotals";
import { money } from "@/components/philhealth-reports/shared/format";

export function usePhilHealthReportForm({
  employerId,
  view,
  employees,
  setEmployer,
  setEmployees,
  setError,
  setNotice,
  requestRefresh,
}: {
  employerId: string;
  view: "employees" | "reports";
  employees: Employee[];
  setEmployer: (e: Employer | null) => void;
  setEmployees: (e: Employee[] | ((prev: Employee[]) => Employee[])) => void;
  setError: (e: string) => void;
  setNotice: (n: string) => void;
  requestRefresh: () => void;
}) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [saving, setSaving] = useState(false);

  const openReportForm = useCallback(async () => {
    setError("");
    if (employerId && view === "reports") {
      try {
        const response = await fetch(`/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`, { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setEmployer(data.employer as Employer);
          setEmployees(data.employees as Employee[]);
        }
      } catch {
        // Keep the dialog usable with any employee data already loaded.
      }
    }
    setReportOpen(true);
  }, [employerId, view, setEmployer, setEmployees, setError]);

  const shares = getPhilHealthShares(Number(reportYear));
  const defaultPs = shares ? (shares.psCents / 100).toFixed(2) : "0.00";
  const defaultEs = shares ? (shares.esCents / 100).toFixed(2) : "0.00";
  const activeEmployees = employees.filter((e) => e.philHealthAccount?.active);

  const createReport = useCallback(
    async () => {
      const entries = activeEmployees
        .map((employee) => {
          const ps = Number(defaultPs);
          const es = Number(defaultEs);
          const total = ps + es;
          return { employeeId: employee.id, amount: total > 0 ? total.toFixed(2) : "" };
        })
        .filter((entry) => entry.amount.trim() !== "");
      if (!entries.length) {
        setError("Enter an amount for at least one active employee.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        const response = await fetch("/api/reports/philhealth/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employerId: Number(employerId),
            applicableMonth: Number(reportMonth),
            applicableYear: Number(reportYear),
            entries,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to create contribution report");
        setReportOpen(false);
        setNotice(`PhilHealth report created. Amount due: ${money((data.report as Report).amountDue)}.`);
        requestRefresh();
        router.push(`/reports/philhealth?view=reports&employerId=${encodeURIComponent(employerId)}`);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to create contribution report");
      } finally {
        setSaving(false);
      }
    },
    [activeEmployees, defaultPs, defaultEs, employerId, reportMonth, reportYear, setError, setNotice, requestRefresh, router],
  );

  return {
    reportOpen,
    setReportOpen,
    reportMonth,
    setReportMonth,
    reportYear,
    setReportYear,
    saving,
    openReportForm,
    createReport,
    defaultPs,
    defaultEs,
    activeEmployees,
  };
}
