"use client";

import { useCallback, useState } from "react";
import type { Employee } from "@/components/philhealth-reports/types";
import { getPhilHealthShares } from "@/lib/philHealthReportTotals";

export function usePhilHealthReportForm({
  employerId,
  employees,
  setError,
  setNotice,
}: {
  employerId: string;
  employees: Employee[];
  setError: (e: string) => void;
  setNotice: (n: string) => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [saving, setSaving] = useState(false);

  const openReportForm = useCallback(async () => {
    setError("");
    if (employerId) {
      try {
        const response = await fetch(`/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`, { cache: "no-store" });
        await response.json().catch(() => ({}));
        // employer/employees managed by parent data hook

      } catch {
        // keep dialog usable
      }
    }
    setReportOpen(true);
  }, [employerId, setError]);

  const shares = getPhilHealthShares(Number(reportYear));
  const defaultPs = shares ? (shares.psCents / 100).toFixed(2) : "0.00";
  const defaultEs = shares ? (shares.esCents / 100).toFixed(2) : "0.00";
  const activeEmployees = employees.filter((e) => e.philHealthAccount?.active);

  const createReport = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
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
        setNotice(`PhilHealth report created. Amount due ${data.amountDue ?? ""}`.trim());
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to create contribution report");
      } finally {
        setSaving(false);
      }
    },
    [activeEmployees, defaultPs, defaultEs, employerId, reportMonth, reportYear, setError, setNotice],
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
