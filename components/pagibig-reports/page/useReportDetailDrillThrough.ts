"use client";

import { useState } from "react";
import type { Report } from "../types";

/**
 * Manages the details/manual-reports drill-through stack: a report can be
 * opened from the manual-reports dialog and returns to it when closed,
 * while "pay from here" closes both and jumps straight to the payment dialog.
 */
export function useReportDetailDrillThrough({ onPay }: { onPay: (report: Report) => void }) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedManualReports, setSelectedManualReports] = useState<Report[] | null>(null);
  const [manualViewReturnReports, setManualViewReturnReports] = useState<Report[] | null>(null);

  /** Shows the details dialog, remembering which manual-reports list to return to afterwards. */
  const openReportDetails = (report: Report, fromManualReports: Report[] | null) => {
    if (fromManualReports) { setSelectedManualReports(fromManualReports); setManualViewReturnReports(null); }
    setSelectedReport(report);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
    if (manualViewReturnReports) { setSelectedManualReports(manualViewReturnReports); setManualViewReturnReports(null); }
  };

  /** From the details dialog, pay the report directly (skips back to manual list). */
  const payFromDetails = (paidReport: Report) => {
    setSelectedReport(null);
    setManualViewReturnReports(null);
    onPay(paidReport);
  };

  const closeManualReports = () => setSelectedManualReports(null);

  const payFromManualReports = (report: Report) => {
    setSelectedManualReports(null);
    onPay(report);
  };

  return {
    selectedReport, setSelectedReport,
    selectedManualReports, setSelectedManualReports, setManualViewReturnReports,
    openReportDetails, closeReportDetails, payFromDetails,
    closeManualReports, payFromManualReports,
  };
}
