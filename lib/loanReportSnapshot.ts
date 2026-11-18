export type LoanReportSnapshotEntryInput =
  | { id: string; monthlyAmortization: string }
  | { loanId: string; monthlyAmortization: string };

export type UpdateLoanReportSnapshotInput = {
  applicableDate: string;
  entries: LoanReportSnapshotEntryInput[];
};

export type ValidLoanReportSnapshot = {
  applicableDate: Date;
  entries: LoanReportSnapshotEntryInput[];
};

function parseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Enter a valid applicable date.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid applicable date.");
  }
  return date;
}

function normalizeMonthlyAmount(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Monthly amount must be a non-negative amount with up to 2 decimal places.");
  }
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    throw new Error("Monthly amount must be a non-negative amount with up to 2 decimal places.");
  }
  const whole = match[1].replace(/^0+(?=\d)/, "");
  if (whole.length > 10) throw new Error("Monthly amount exceeds the supported maximum.");
  return `${whole}.${(match[2] ?? "").padEnd(2, "0")}`;
}

export function validateLoanReportSnapshotInput(input: unknown): ValidLoanReportSnapshot {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Enter valid loan report details.");
  }
  const candidate = input as Partial<UpdateLoanReportSnapshotInput>;
  const applicableDate = parseDate(candidate.applicableDate);
  if (!Array.isArray(candidate.entries) || candidate.entries.length === 0) {
    throw new Error("A report must contain at least one saved loan entry.");
  }

  const seenIds = new Set<string>();
  const seenLoanIds = new Set<string>();
  const entries = candidate.entries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Enter valid saved loan entry details.");
    }
    const hasEntryId = Object.prototype.hasOwnProperty.call(entry, "id");
    const hasLoanId = Object.prototype.hasOwnProperty.call(entry, "loanId");
    if (hasEntryId === hasLoanId) {
      throw new Error("Each report entry must identify one saved entry or one SSS loan account.");
    }

    const monthlyAmortization = normalizeMonthlyAmount(entry.monthlyAmortization);
    if (hasEntryId) {
      if (!("id" in entry)) throw new Error("Enter a valid report entry ID.");
      if (typeof entry.id !== "string") throw new Error("Enter a valid report entry ID.");
      const id = entry.id.trim();
      if (!id || id.length > 100) throw new Error("Enter a valid report entry ID.");
      if (seenIds.has(id)) throw new Error("A saved loan entry can only be included once.");
      seenIds.add(id);
      return { id, monthlyAmortization };
    }

    if (!("loanId" in entry)) throw new Error("Enter a valid SSS loan account ID.");
    if (typeof entry.loanId !== "string") throw new Error("Enter a valid SSS loan account ID.");
    const loanId = entry.loanId.trim();
    if (!loanId || loanId.length > 100) throw new Error("Enter a valid SSS loan account ID.");
    if (seenLoanIds.has(loanId)) throw new Error("An SSS loan account can only be added once.");
    seenLoanIds.add(loanId);
    return { loanId, monthlyAmortization };
  });

  return { applicableDate, entries };
}
