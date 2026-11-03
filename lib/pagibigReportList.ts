import type { Report } from "@/components/pagibig-reports/types";

export type PagibigReportView = "PIF" | "MANUAL";

export function computePagibigYears(reports: Report[], reportView: PagibigReportView): number[] {
  return [...new Set([new Date().getFullYear(), ...reports.filter((report) => (reportView === "MANUAL") === report.manual).map((report) => report.applicableYear)])].sort((a, b) => b - a);
}

export function filterPagibigReports(
  reports: Report[],
  reportView: PagibigReportView,
  yearFilter: string,
  paymentStatusFilter: "ALL" | "PAID" | "UNPAID",
  search: string,
  monthNames: string[]
): Report[] {
  return reports.filter((report) => {
    if ((reportView === "MANUAL") !== report.manual) return false;
    if (yearFilter && String(report.applicableYear) !== yearFilter) return false;
    const paid = report.amountPaid !== null && report.payDate !== null;
    if (paymentStatusFilter !== "ALL" && (paymentStatusFilter === "PAID") !== paid) return false;
    const query = search.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${monthNames[report.applicableMonth - 1]} ${report.applicableYear} ${report.amountDue} ${report.amountPaid ?? ""} ${report.entries.map((entry) => `${entry.employeeName} ${entry.midNumber ?? ""}`).join(" ")}`
      .toLocaleLowerCase()
      .includes(query);
  });
}

export function buildDisplayedPagibigReports(
  yearFilter: string,
  tableReports: Report[],
  pagedReports: Report[],
  selectedEmployerId: string,
  reportEmployerName: string | null,
  reportEmployerPagibigNumber: string | null,
  reportView: PagibigReportView
): Report[] {
  if (!yearFilter) return pagedReports;
  const year = Number(yearFilter);
  const isManual = reportView === "MANUAL";
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const existing = tableReports.find((report) => report.applicableYear === year && report.applicableMonth === month);
    return (
      existing ?? ({
        id: -month,
        kind: "CONTRIBUTION",
        manual: isManual,
        pin: "",
        employerId: Number(selectedEmployerId),
        employerName: reportEmployerName ?? "",
        employerPagibigNumber: reportEmployerPagibigNumber,
        applicableMonth: month,
        applicableYear: year,
        employeeSavingsTotal: "0",
        employerSavingsTotal: "0",
        mp2Total: "0",
        calamityLoanTotal: "0",
        mplLoanTotal: "0",
        emergencyLoanTotal: "0",
        safeLoanTotal: "0",
        amountDue: "0",
        amountPaid: null,
        paymentType: null,
        payDate: null,
        transactionReference: null,
        entries: [],
      } as Report)
    );
  });
}
export function mergeManualPagibigReports(visibleReports: Report[]): Report[] {
  const groups = new Map<string, Report[]>();
  for (const r of visibleReports) {
    const key = `${r.applicableYear}-${r.applicableMonth}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const merged: Report[] = [];
  for (const grp of groups.values()) {
    const contrib = grp.find((r) => r.kind === "CONTRIBUTION");
    const loan = grp.find((r) => r.kind === "LOAN");
    const base = contrib || loan;
    if (!base) continue;
    const allPaid = grp.every((r) => r.amountPaid !== null && r.payDate !== null);
    merged.push({
      ...base,
      manual: true,
      employeeSavingsTotal: contrib ? contrib.employeeSavingsTotal : "0",
      employerSavingsTotal: contrib ? contrib.employerSavingsTotal : "0",
      mp2Total: contrib ? contrib.mp2Total : "0",
      calamityLoanTotal: loan ? loan.calamityLoanTotal : "0",
      mplLoanTotal: loan ? loan.mplLoanTotal : "0",
      emergencyLoanTotal: loan ? loan.emergencyLoanTotal : "0",
      safeLoanTotal: loan ? loan.safeLoanTotal : "0",
      amountDue: String(Number(contrib ? contrib.amountDue : 0) + Number(loan ? loan.amountDue : 0)),
      amountPaid: allPaid
        ? String(Number(contrib ? contrib.amountPaid : 0) + Number(loan ? loan.amountPaid : 0))
        : contrib
        ? contrib.amountPaid
        : loan
        ? loan.amountPaid
        : null,
      paymentType: contrib ? contrib.paymentType : loan ? loan.paymentType : null,
      payDate: allPaid ? (contrib ? contrib.payDate : loan ? loan.payDate : null) : null,
      transactionReference: contrib ? contrib.transactionReference : loan ? loan.transactionReference : null,
      entries: [...(contrib ? contrib.entries : []), ...(loan ? loan.entries : [])],
    });
  }
  return merged.sort((a, b) => b.applicableYear - a.applicableYear || b.applicableMonth - a.applicableMonth);
}