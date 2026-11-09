"use client";

import type { Report } from '@/components/pagibig-reports/shared/types';

/**
 * Deletes the pending report target, syncing the reports list and closing any
 * dialog that showed the deleted report.
 */
export function useDeleteReport({
  deleteReportTarget,
  setDeleteReportTarget,
  setReports,
  selectedReport,
  setSelectedReport,
  paymentReport,
  setPaymentReport,
  setError,
  setNotice,
}: {
  deleteReportTarget: Report | null;
  setDeleteReportTarget: (target: Report | null) => void;
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  selectedReport: Report | null;
  setSelectedReport: (report: Report | null) => void;
  paymentReport: Report | null;
  setPaymentReport: (report: Report | null) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setError("");
    try {
      const response = await fetch(`/api/reports/pagibig/${deleteReportTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error((data as { error?: string } | null)?.error || "Unable to delete Pag-IBIG report");
      const deletedId = deleteReportTarget.id;
      setReports((current) => current.filter((report) => report.id !== deletedId));
      if (selectedReport?.id === deletedId) setSelectedReport(null);
      if (paymentReport?.id === deletedId) setPaymentReport(null);
      setDeleteReportTarget(null);
      setNotice("Pag-IBIG report deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Pag-IBIG report");
    }
  };

  return deleteReport;
}
