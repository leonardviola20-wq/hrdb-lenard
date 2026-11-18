import { test } from "node:test";
import assert from "node:assert/strict";

import {
  countLoanReportEmployees,
  filterLoanReportsByProvider,
  formatLoanReportBillingMonth,
  formatLoanReportShortBillingMonth,
  formatLoanReportPaymentDate,
  getLoanReportEmployerName,
  getLoanReportEmployerNames,
  getLoanReportPreviewTitle,
  hasCompleteHistoricalSssPayment,
  isLoanReportPosted,
} from "./loanReportDisplay";
import {
  getExistingLoanReportMonths,
  getPreviousLoanEntriesForAvailableLoans,
  getLatestPreviousLoanReportForEmployer,
  getPreviousLoanReportsForEmployer,
  hasDuplicateLoanReportMonth,
  sortLoanRowsByEmployee,
  validateLoanReportEmployerId,
} from "./loanReportGeneration";

test("formats the billing month with month and year only", () => {
  assert.equal(formatLoanReportBillingMonth("2026-11-01"), "November 2026");
});

test("formats the short billing month with abbreviated month and year", () => {
  assert.equal(formatLoanReportShortBillingMonth("2026-09-01"), "Sep 2026");
});

test("counts distinct employees in report entries", () => {
  assert.equal(
    countLoanReportEmployees([
      { employeeName: "Jane Doe" },
      { employeeName: " jane doe " },
      { employeeName: "John Smith" },
    ]),
    2,
  );
});

test("formats saved payment dates and missing values", () => {
  assert.equal(formatLoanReportPaymentDate("2026-11-12"), "Nov 12, 2026");
  assert.equal(formatLoanReportPaymentDate(null), "—");
});

test("a report is posted only when both PRN and payment date are present", () => {
  assert.equal(isLoanReportPosted({ prn: "PRN-1", paymentDate: "2026-11-12" }), true);
  assert.equal(isLoanReportPosted({ prn: null, paymentDate: "2026-11-12" }), false);
  assert.equal(isLoanReportPosted({ prn: "PRN-1", paymentDate: null }), false);
  assert.equal(isLoanReportPosted({ prn: "  ", paymentDate: "2026-11-12" }), false);
});

test("provider dashboard reports exclude reports with no entries for that provider", () => {
  const reports = [
    { id: "sss", entries: [{ provider: "SSS" }] },
    { id: "pagibig", entries: [{ provider: "PAGIBIG" }] },
    { id: "mixed", entries: [{ provider: "SSS" }, { provider: "PAGIBIG" }] },
  ];

  assert.deepEqual(filterLoanReportsByProvider(reports, "SSS").map((report) => report.id), ["sss", "mixed"]);
  assert.deepEqual(
    filterLoanReportsByProvider(reports, "PAGIBIG").map((report) => report.id),
    ["pagibig", "mixed"],
  );
});

test("historical SSS payments require every payment field and reject blanks", () => {
  const complete = {
    amountPaid: "100.00",
    paymentBranch: "Branch",
    paymentDate: "2026-11-12",
    transactionReference: "REF-1",
    prn: "PRN-1",
  };
  assert.equal(hasCompleteHistoricalSssPayment(complete), true);
  assert.equal(hasCompleteHistoricalSssPayment({ ...complete, amountPaid: null }), false);
  assert.equal(hasCompleteHistoricalSssPayment({ ...complete, paymentBranch: " " }), false);
  assert.equal(hasCompleteHistoricalSssPayment({ ...complete, paymentDate: null }), false);
  assert.equal(hasCompleteHistoricalSssPayment({ ...complete, transactionReference: "" }), false);
  assert.equal(hasCompleteHistoricalSssPayment({ ...complete, prn: " " }), false);
});

test("resolves the employer name for one or multiple employers", () => {
  assert.equal(getLoanReportEmployerName([{ employerName: "Acme Ltd." }]), "Acme Ltd.");
  assert.equal(
    getLoanReportEmployerName([{ employerName: "Acme Ltd." }, { employerName: "Other Co." }]),
    "Multiple Employers",
  );
  assert.equal(getLoanReportEmployerName([{ employerName: "" }]), "—");
});

test("prefers an assigned report employer while preserving legacy entry fallback", () => {
  const entries = [{ employerName: "Employee's current employer" }];
  assert.equal(getLoanReportEmployerName(entries, "Assigned employer"), "Assigned employer");
  assert.deepEqual(getLoanReportEmployerNames(entries, " Assigned employer "), ["Assigned employer"]);
  assert.equal(getLoanReportEmployerName(entries), "Employee's current employer");
});

test("validates the selected employer identifier", () => {
  assert.equal(validateLoanReportEmployerId(12), 12);
  for (const invalidId of [0, -1, 1.5, "12", null, undefined]) {
    assert.throws(() => validateLoanReportEmployerId(invalidId), /Select a valid employer/);
  }
});

test("filters previous reports to the selected employer and orders newest first", () => {
  const reports = [
    { id: "older", employerName: "Acme", applicableDate: "2026-01-01", createdAt: "2026-01-01T10:00:00Z", entries: [] },
    { id: "other", employerName: "Other", applicableDate: "2026-12-01", createdAt: "2026-12-01T10:00:00Z", entries: [] },
    { id: "newer", employerName: " acme ", applicableDate: "2026-02-01", createdAt: "2026-02-01T10:00:00Z", entries: [] },
  ];
  assert.deepEqual(
    getPreviousLoanReportsForEmployer(reports, "Acme").map((report) => report.id),
    ["newer", "older"],
  );
  assert.equal(getLatestPreviousLoanReportForEmployer(reports, "Acme")?.id, "newer");
  assert.equal(getLatestPreviousLoanReportForEmployer(reports, "Missing"), null);
});

test("finds occupied employer/provider months across generated and posted snapshots", () => {
  const reports = [
    {
      id: "sss-generated",
      employerName: "Acme",
      applicableDate: "2026-03-01",
      createdAt: "2026-03-01T10:00:00Z",
      prn: null,
      paymentDate: null,
      entries: [{ employerName: "Acme", loanId: "sss-1", monthlyAmortization: "100", provider: "SSS" }],
    },
    {
      id: "sss-posted",
      employerName: "Acme",
      applicableDate: "2026-01-01",
      createdAt: "2026-01-01T10:00:00Z",
      prn: "PRN-1",
      paymentDate: "2026-01-10",
      entries: [{ employerName: "Acme", loanId: "sss-2", monthlyAmortization: "200", provider: "SSS" }],
    },
    {
      id: "hdmf",
      employerName: "Acme",
      applicableDate: "2026-02-01",
      createdAt: "2026-02-01T10:00:00Z",
      entries: [{ employerName: "Acme", loanId: "hdmf-1", monthlyAmortization: "300", provider: "PAGIBIG" }],
    },
    {
      id: "other-employer",
      employerName: "Other",
      applicableDate: "2026-04-01",
      createdAt: "2026-04-01T10:00:00Z",
      entries: [{ employerName: "Other", loanId: "sss-3", monthlyAmortization: "400", provider: "SSS" }],
    },
  ];

  assert.deepEqual(getExistingLoanReportMonths(reports, " acme ", "SSS"), ["2026-01", "2026-03"]);
  assert.deepEqual(getExistingLoanReportMonths(reports, "Acme", "PAGIBIG"), ["2026-02"]);
  assert.equal(hasDuplicateLoanReportMonth(reports, "Acme", "SSS", "2026-01-01"), true);
  assert.equal(hasDuplicateLoanReportMonth(reports, "Acme", "PAGIBIG", "2026-01-01"), false);
  assert.equal(hasDuplicateLoanReportMonth(reports, "Other", "SSS", "2026-01-01"), false);
});

test("loads a previous report atomically only when all loan entries are available", () => {
  const entries = [
    { loanId: "loan-1", monthlyAmortization: "100.00" },
    { loanId: "loan-2", monthlyAmortization: "200.00" },
  ];
  assert.deepEqual(
    getPreviousLoanEntriesForAvailableLoans(entries, new Set(["loan-1", "loan-2"])),
    entries,
  );
  assert.throws(
    () => getPreviousLoanEntriesForAvailableLoans(entries, new Set(["loan-1"])),
    /1 loan from this report is not available/,
  );
  assert.throws(
    () => getPreviousLoanEntriesForAvailableLoans([entries[0], entries[0]], new Set(["loan-1"])),
    /duplicate loan/,
  );
});

test("sorts report loan rows by employee name ascending, case-insensitively", () => {
  const loans = [{ employeeName: "Zoë" }, { employeeName: "alice" }, { employeeName: "Bob" }];
  assert.deepEqual(sortLoanRowsByEmployee(loans).map((loan) => loan.employeeName), ["alice", "Bob", "Zoë"]);
  assert.equal(loans[0].employeeName, "Zoë");
});

test("uses a provider-specific title for consistent SSS and Pag-IBIG reports", () => {
  assert.equal(getLoanReportPreviewTitle([{ provider: "SSS" }]), "SSS Loan Report Preview");
  assert.equal(getLoanReportPreviewTitle([{ provider: "PAGIBIG" }]), "Pag-IBIG Loan Report Preview");
  assert.equal(
    getLoanReportPreviewTitle([{ provider: "SSS" }, { provider: "PAGIBIG" }]),
    "Loan Report Preview",
  );
});
