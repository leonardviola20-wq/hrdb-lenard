"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContributionEmployerDetails, ContributionProvider, ContributionReport, Employer } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeEmployerDetails(provider: ContributionProvider, value: unknown): ContributionEmployerDetails | null {
  if (!isRecord(value) || !Number.isSafeInteger(value.id) || typeof value.name !== "string") return null;
  const rawNumber = provider === "sss"
    ? value.providerNumber ?? value.sss
    : provider === "pagibig"
    ? value.providerNumber ?? value.pagibigNumber
    : value.providerNumber ?? value.phic;
  return {
    id: Number(value.id),
    name: value.name,
    providerNumber: typeof rawNumber === "string" ? rawNumber : null,
    address: typeof value.address === "string" ? value.address : null,
  };
}

export function useContributionProviderData(
  provider: ContributionProvider,
  initialEmployerId = "",
  onEmployerChange?: (employerId: string) => void,
) {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [employersLoading, setEmployersLoading] = useState(true);
  const [employerError, setEmployerError] = useState("");
  const [selectedEmployerId, setSelectedEmployerId] = useState(initialEmployerId);
  const [reports, setReports] = useState<ContributionReport[]>([]);
  const [employerDetails, setEmployerDetails] = useState<ContributionEmployerDetails | null>(null);
  const [reportsEmployerId, setReportsEmployerId] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reports/sss/employers?summary=1", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { employers?: Employer[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load employers");
        if (!Array.isArray(data.employers)) throw new Error("Employer list response is invalid");
        return data.employers;
      })
      .then((loadedEmployers) => {
        if (controller.signal.aborted) return;
        setEmployers(loadedEmployers);
        const initialEmployerExists = loadedEmployers.some((employer) => String(employer.id) === initialEmployerId);
        setSelectedEmployerId(initialEmployerId
          ? initialEmployerExists ? initialEmployerId : ""
          : String(loadedEmployers[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setEmployerError(error instanceof Error ? error.message : "Unable to load employers");
      })
      .finally(() => {
        if (!controller.signal.aborted) setEmployersLoading(false);
      });
    return () => controller.abort();
  }, [initialEmployerId, provider]);

  useEffect(() => {
    if (!selectedEmployerId) return;
    const controller = new AbortController();
    const endpoint = provider === "sss"
      ? `/api/reports/sss?employerId=${encodeURIComponent(selectedEmployerId)}&kind=CONTRIBUTION`
      : provider === "pagibig"
      ? `/api/reports/pagibig?employerId=${encodeURIComponent(selectedEmployerId)}`
      : `/api/reports/philhealth/reports?employerId=${encodeURIComponent(selectedEmployerId)}`;

    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as {
          reports?: ContributionReport[];
          error?: string;
          employer?: unknown;
        };
        if (!response.ok) throw new Error(data.error || `Unable to load ${provider} contributions`);
        if (!Array.isArray(data.reports)) throw new Error(`${provider} contribution response is invalid`);
        return { reports: data.reports, employer: data.employer };
      })
      .then(({ reports: loadedReports, employer: loadedEmployerDetails }) => {
        if (controller.signal.aborted) return;
        const normalizedEmployer = normalizeEmployerDetails(provider, loadedEmployerDetails);
        if (!normalizedEmployer || String(normalizedEmployer.id) !== selectedEmployerId) {
          throw new Error("Employer details response is invalid");
        }
        setEmployerDetails(normalizedEmployer);
        setReports(loadedReports
          .filter((report) => provider !== "pagibig" || report.kind === "CONTRIBUTION")
          .map((report) => provider === "sss" ? {
            ...report,
            kind: "CONTRIBUTION",
            entries: report.entries.map((entry) => {
              const employeeShare = Number(entry.employeeSs ?? 0) + Number(entry.employeeMpf ?? 0);
              const employerShare = Number(entry.employerSs ?? 0) + Number(entry.employerMpf ?? 0) + Number(entry.ec ?? 0);
              const hasSssComponents = [
                entry.employeeSs,
                entry.employeeMpf,
                entry.employerSs,
                entry.employerMpf,
                entry.ec,
              ].some((amount) => amount !== undefined && amount !== null);
              return {
                ...entry,
                employeeSavings: hasSssComponents
                  ? employeeShare.toFixed(2)
                  : String(Number(entry.totalAmount ?? 0)),
                employerSavings: employerShare.toFixed(2),
              };
            }),
          } : report));
        setReportsEmployerId(selectedEmployerId);
        setReportError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setEmployerDetails(null);
        setReports([]);
        setReportsEmployerId(selectedEmployerId);
        setReportError(error instanceof Error ? error.message : `Unable to load ${provider} contributions`);
      });
    return () => controller.abort();
  }, [provider, selectedEmployerId]);

  const contributionReports = useMemo(
    () => reports.filter((report) => provider !== "pagibig" || report.kind === "CONTRIBUTION"),
    [provider, reports],
  );
  const reportLoading = Boolean(selectedEmployerId) && reportsEmployerId !== selectedEmployerId && !reportError;

  const changeEmployer = (employerId: string) => {
    setSelectedEmployerId(employerId);
    setEmployerDetails(null);
    setReportsEmployerId("");
    setReportError("");
    onEmployerChange?.(employerId);
  };

  return {
    employers,
    employersLoading,
    employerError,
    selectedEmployerId,
    employerDetails,
    contributionReports,
    reportError,
    reportLoading,
    changeEmployer,
  };
}
