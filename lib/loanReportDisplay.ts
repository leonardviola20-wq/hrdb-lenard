type LoanReportEmployerEntry = { employerName: string };
type LoanReportProviderEntry = { provider: string };

export function filterLoanReportsByProvider<T extends { entries: readonly LoanReportProviderEntry[] }>(
  reports: readonly T[],
  provider: string,
): T[] {
  return reports.filter((report) => report.entries.some((entry) => entry.provider === provider));
}

export function isLoanReportPosted(report: { prn: string | null; paymentDate: string | null }): boolean {
  return Boolean(report.prn?.trim() && report.paymentDate);
}

export function hasCompleteHistoricalSssPayment(report: {
  amountPaid: string | null;
  paymentBranch: string | null;
  paymentDate: string | null;
  transactionReference: string | null;
  prn: string | null;
}): boolean {
  return Boolean(
    report.amountPaid?.trim() &&
    report.paymentBranch?.trim() &&
    report.paymentDate &&
    report.transactionReference?.trim() &&
    report.prn?.trim(),
  );
}

export function formatLoanReportBillingMonth(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function formatLoanReportShortBillingMonth(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function countLoanReportEmployees(entries: readonly { employeeName: string }[]): number {
  return new Set(
    entries
      .map((entry) => entry.employeeName.trim().toLocaleLowerCase())
      .filter(Boolean),
  ).size;
}

export function getLoanReportEmployerNames(
  entries: readonly LoanReportEmployerEntry[],
  reportEmployerName?: string | null,
): string[] {
  const reportName = reportEmployerName?.trim();
  if (reportName) return [reportName];

  const employers = new Map<string, string>();
  for (const entry of entries) {
    const name = entry.employerName.trim();
    if (name) employers.set(name.toLocaleLowerCase(), name);
  }

  return Array.from(employers.values());
}

export function getLoanReportEmployerName(
  entries: readonly LoanReportEmployerEntry[],
  reportEmployerName?: string | null,
): string {
  const employers = getLoanReportEmployerNames(entries, reportEmployerName);
  if (reportEmployerName?.trim()) return employers[0] ?? "—";
  if (employers.length > 1) return "Multiple Employers";
  return employers[0] ?? "—";
}

export function getLoanReportPreviewTitle(entries: readonly LoanReportProviderEntry[]): string {
  const providers = new Set(entries.map((entry) => entry.provider));
  if (providers.size === 1 && providers.has("SSS")) return "SSS Loan Report Preview";
  if (providers.size === 1 && providers.has("PAGIBIG")) return "Pag-IBIG Loan Report Preview";
  return "Loan Report Preview";
}

export function formatLoanReportPaymentDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
