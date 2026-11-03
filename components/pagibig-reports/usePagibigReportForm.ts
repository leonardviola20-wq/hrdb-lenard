"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Member, Report, ReportDraft } from "@/components/pagibig-reports/types";
import type { PagibigPreviewFilter } from "@/lib/pagibigReportPreview";

type GenerateReportContext = {
  employerId: string;
  reportDraftId: number | null;
  setReports: Dispatch<SetStateAction<Report[]>>;
  setReportDrafts: Dispatch<SetStateAction<ReportDraft[]>>;
  setSelectedReport: Dispatch<SetStateAction<Report | null>>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
};

export function usePagibigReportForm() {
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<Member[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewYear, setPreviewYear] = useState("");
  const [previewFilter, setPreviewFilter] = useState<PagibigPreviewFilter>("ALL");
  const [reportEmployeePickerOpen, setReportEmployeePickerOpen] = useState(false);
  const [reportEmployeeId, setReportEmployeeId] = useState("");
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportPin, setReportPin] = useState("");
  const [manualReport, setManualReport] = useState(false);
  const [reportKind, setReportKind] = useState<"CONTRIBUTION" | "LOAN">("CONTRIBUTION");
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const resetPreview = () => {
    setPreviewMembers([]);
    setPreviewError("");
    setPreviewYear("");
  };

  const generateReport = async (
    event: FormEvent<HTMLFormElement> | undefined,
    {
      employerId,
      reportDraftId,
      setReports,
      setReportDrafts,
      setSelectedReport,
      setError,
      setNotice,
    }: GenerateReportContext,
  ) => {
    event?.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const employeeIds = previewMembers.map((member) => member.id);
      const endpoint = updatingReportId
        ? `/api/reports/pagibig/${updatingReportId}?employerId=${encodeURIComponent(employerId)}`
        : "/api/reports/pagibig";
      const method = updatingReportId ? "PUT" : "POST";
      const body = updatingReportId
        ? JSON.stringify({ pin: reportPin, employeeIds })
        : JSON.stringify({
            employerId,
            applicableMonth: reportMonth,
            applicableYear: reportYear,
            pin: reportPin,
            draftId: reportDraftId,
            employeeIds,
            kind: manualReport ? reportKind : "CONTRIBUTION",
            manual: manualReport,
          });
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate Pag-IBIG report");

      const updatedReport = data.report as Report;
      setReports((current) =>
        updatingReportId
          ? current.map((report) => (report.id === updatedReport.id ? updatedReport : report))
          : [updatedReport, ...current],
      );
      if (reportDraftId !== null) {
        setReportDrafts((current) => current.filter((draft) => draft.id !== reportDraftId));
      }
      setUpdatingReportId(null);
      setReportFormOpen(false);
      setSelectedReport(updatedReport);
      setNotice(
        updatingReportId
          ? "Pag-IBIG report updated."
          : "Pag-IBIG report saved as an immutable snapshot.",
      );
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate Pag-IBIG report",
      );
    } finally {
      setGenerating(false);
    }
  };

  return {
    reportFormOpen,
    setReportFormOpen,
    previewMembers,
    setPreviewMembers,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,
    previewYear,
    setPreviewYear,
    previewFilter,
    setPreviewFilter,
    reportEmployeePickerOpen,
    setReportEmployeePickerOpen,
    reportEmployeeId,
    setReportEmployeeId,
    reportMonth,
    setReportMonth,
    reportYear,
    setReportYear,
    reportPin,
    setReportPin,
    manualReport,
    setManualReport,
    reportKind,
    setReportKind,
    updatingReportId,
    setUpdatingReportId,
    generating,
    setGenerating,
    generateReport,
    resetPreview,
  };
}
