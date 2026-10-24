// Import directly from your custom un-lockable Prisma location
import { Prisma } from "../prisma/generated/client";

type PagibigReportWithEntries = Prisma.PagibigReportGetPayload<{ 
  include: { PagibigReportEntry: true } 
}>;

// Explicitly type the mapped entries to reuse in your totals calculation
type SerializedEntry = ReturnType<typeof serializeEntries>[number];

const snapshotText = (value: Prisma.JsonValue | null, key: string): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = (value as Record<string, unknown>)[key];
  return typeof item === "string" || typeof item === "number" ? String(item) : null;
};

// Helper function to map individual entries with correct TypeScript inferencing
function serializeEntries(entries: PagibigReportWithEntries["PagibigReportEntry"]) {
  return entries.map((entry) => ({
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
}

export function serializePagibigReport(report: PagibigReportWithEntries) {
  const entries = serializeEntries(report.PagibigReportEntry);

  // Type parameters 'sum' and 'entry' explicitly to resolve the TS7006 implicit any error
  const total = (field: keyof SerializedEntry): string => 
    entries.reduce(
      (sum: Prisma.Decimal, entry: SerializedEntry) => sum.plus(String(entry[field])),
      new Prisma.Decimal(0)
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
