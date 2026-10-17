import { Prisma } from "@prisma/client";

type PagibigReportWithEntries = Prisma.PagibigReportGetPayload<{ include: { PagibigReportEntry: true } }>;

const snapshotText = (value: Prisma.JsonValue | null, key: string) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value[key];
  return typeof item === "string" || typeof item === "number" ? String(item) : null;
};

export function serializePagibigReport(report: PagibigReportWithEntries) {
  const entries = report.PagibigReportEntry.map((entry) => ({
    ...entry,
    midNumber: entry.employeePagibigNumber,
    employeeSavings: entry.memberSavings.toString(),
    employerSavings: entry.modifiedSavings.toString(),
    mp2AccountNumber: snapshotText(entry.ledgerSnapshot, "mp2AccountNo"),
    mp2Amount: snapshotText(entry.ledgerSnapshot, "mp2Amount") ?? "0",
    calamityLoanAmount: entry.calamityLoan.toString(),
    mplLoanAmount: entry.multiPurposeLoan.toString(),
    emergencyLoanAmount: entry.emergencyLoan.toString(),
    safeLoanAmount: entry.safeLoan.toString(),
    totalAmount: entry.totalAmount.toString(),
  }));
  const total = (field: keyof typeof entries[number]) => entries.reduce(
    (sum, entry) => sum.plus(String(entry[field])),
    new Prisma.Decimal(0),
  ).toString();
  const reportData = { ...report };
  Reflect.deleteProperty(reportData, "PagibigReportEntry");
  return {
    ...reportData,
    employeeSavingsTotal: total("employeeSavings"),
    employerSavingsTotal: total("employerSavings"),
    mp2Total: total("mp2Amount"),
    calamityLoanTotal: total("calamityLoanAmount"),
    mplLoanTotal: total("mplLoanAmount"),
    emergencyLoanTotal: total("emergencyLoanAmount"),
    safeLoanTotal: total("safeLoanAmount"),
    entries,
  };
}
