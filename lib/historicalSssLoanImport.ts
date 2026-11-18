export type HistoricalSssImportMatch = {
  sourceReportId?: number;
  employerName: string | null;
  applicableMonth: number;
  applicableYear: number;
  prn: string | null;
  loanAccountNumbers: (string | null)[];
};

function normalizeText(value: string | null): string {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase() ?? "";
}

function normalizeIdentifier(value: string | null): string {
  return value?.trim().toLocaleUpperCase() ?? "";
}

export function findHistoricalSssImportDuplicate(
  candidate: HistoricalSssImportMatch & { sourceReportId: number },
  existingReports: readonly HistoricalSssImportMatch[],
): string | null {
  const candidateEmployer = normalizeText(candidate.employerName);
  const candidatePrn = normalizeIdentifier(candidate.prn);
  const candidateAccounts = new Set(
    candidate.loanAccountNumbers.map(normalizeIdentifier).filter(Boolean),
  );

  for (const existing of existingReports) {
    const samePeriod =
      candidateEmployer !== "" &&
      candidateEmployer === normalizeText(existing.employerName) &&
      candidate.applicableMonth === existing.applicableMonth &&
      candidate.applicableYear === existing.applicableYear;
    const existingPrn = normalizeIdentifier(existing.prn);

    if (
      candidate.sourceReportId === existing.sourceReportId &&
      (samePeriod || (candidatePrn !== "" && candidatePrn === existingPrn))
    ) {
      return "the same source report is already present";
    }

    if (candidatePrn !== "" && candidatePrn === existingPrn) {
      return "the same PRN is already present";
    }

    if (!samePeriod || candidateAccounts.size === 0) continue;

    const hasAccountOverlap = existing.loanAccountNumbers.some((accountNumber) =>
      candidateAccounts.has(normalizeIdentifier(accountNumber)),
    );
    if (hasAccountOverlap) {
      return "a report for the same employer and period contains a matching loan account";
    }
  }

  return null;
}
