import { getLoanReportEmployerNames } from "@/lib/loanReportDisplay";

export function validateLoanReportEmployerId(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error("Select a valid employer.");
  }
  return value;
}

type EmployerReport = {
  id: string;
  employerName?: string | null;
  applicableDate: string;
  createdAt: string;
  entries: {
    employerName: string;
    loanId: string;
    monthlyAmortization: string;
    provider?: string;
  }[];
};

type EmployerProviderMonthReport = {
  employerName?: string | null;
  applicableDate: string;
  entries: { employerName: string; provider: string }[];
};

export function getExistingLoanReportMonths(
  reports: readonly EmployerProviderMonthReport[],
  employerName: string,
  provider: string,
): string[] {
  const expectedName = employerName.trim().toLocaleLowerCase();
  if (!expectedName) return [];
  return Array.from(
    new Set(
      reports
        .filter((report) =>
          report.entries.some((entry) => entry.provider === provider) &&
          getLoanReportEmployerNames(report.entries, report.employerName)
            .some((name) => name.trim().toLocaleLowerCase() === expectedName),
        )
        .map((report) => report.applicableDate.slice(0, 7)),
    ),
  ).sort();
}

export function hasDuplicateLoanReportMonth(
  reports: readonly EmployerProviderMonthReport[],
  employerName: string,
  provider: string,
  applicableDate: string,
): boolean {
  return getExistingLoanReportMonths(reports, employerName, provider)
    .includes(applicableDate.slice(0, 7));
}

export function getPreviousLoanReportsForEmployer<T extends EmployerReport>(
  reports: readonly T[],
  employerName: string,
): T[] {
  const expectedName = employerName.trim().toLocaleLowerCase();
  if (!expectedName) return [];
  return reports
    .filter((report) =>
      getLoanReportEmployerNames(report.entries, report.employerName)
        .some((name) => name.trim().toLocaleLowerCase() === expectedName),
    )
    .sort((left, right) =>
      right.applicableDate.localeCompare(left.applicableDate) ||
      right.createdAt.localeCompare(left.createdAt),
    );
}

export function getLatestPreviousLoanReportForEmployer<T extends EmployerReport>(
  reports: readonly T[],
  employerName: string,
): T | null {
  return getPreviousLoanReportsForEmployer(reports, employerName)[0] ?? null;
}

export function getPreviousLoanEntriesForAvailableLoans(
  entries: readonly { loanId: string; monthlyAmortization: string }[],
  availableLoanIds: ReadonlySet<string>,
): { loanId: string; monthlyAmortization: string }[] {
  const seen = new Set<string>();
  const unavailableLoanIds: string[] = [];
  for (const entry of entries) {
    if (seen.has(entry.loanId)) {
      throw new Error("The previous report contains a duplicate loan and cannot be loaded.");
    }
    seen.add(entry.loanId);
    if (!availableLoanIds.has(entry.loanId)) unavailableLoanIds.push(entry.loanId);
  }
  if (unavailableLoanIds.length > 0) {
    const unavailableCount = unavailableLoanIds.length;
    throw new Error(
      `${unavailableCount} loan${unavailableCount === 1 ? "" : "s"} from this report ${unavailableCount === 1 ? "is" : "are"} not available in the current list. Refresh the loans and try again.`,
    );
  }
  return entries.map(({ loanId, monthlyAmortization }) => ({ loanId, monthlyAmortization }));
}

export function sortLoanRowsByEmployee<T extends { employeeName: string }>(loans: readonly T[]): T[] {
  return [...loans].sort((left, right) =>
    left.employeeName.localeCompare(right.employeeName, "en", { sensitivity: "base" }),
  );
}
