import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validateLoanReportSnapshotInput,
  type UpdateLoanReportSnapshotInput,
} from "./loanReportSnapshot";

function createSnapshotInput(): UpdateLoanReportSnapshotInput {
  return {
    applicableDate: "2026-11-01",
    entries: [
      { id: "entry-1", monthlyAmortization: "500.25" },
      { id: "entry-2", monthlyAmortization: "100" },
    ],
  };
}

test("validates the applicable date and normalizes retained monthly amounts", () => {
  const snapshot = validateLoanReportSnapshotInput(createSnapshotInput());

  assert.equal(snapshot.applicableDate.toISOString().slice(0, 10), "2026-11-01");
  assert.deepEqual(snapshot.entries, [
    { id: "entry-1", monthlyAmortization: "500.25" },
    { id: "entry-2", monthlyAmortization: "100.00" },
  ]);
});

test("allows removing entries while requiring at least one remaining", () => {
  const snapshot = createSnapshotInput();
  snapshot.entries = [snapshot.entries[1]];

  assert.deepEqual(validateLoanReportSnapshotInput(snapshot).entries, [
    { id: "entry-2", monthlyAmortization: "100.00" },
  ]);

  snapshot.entries = [];
  assert.throws(() => validateLoanReportSnapshotInput(snapshot), /at least one/);
});

test("validates and normalizes new SSS loan account entries", () => {
  const snapshot = createSnapshotInput();
  snapshot.entries = [
    { id: "entry-1", monthlyAmortization: "500" },
    { loanId: "sss-loan-3", monthlyAmortization: "275.5" },
  ];

  assert.deepEqual(validateLoanReportSnapshotInput(snapshot).entries, [
    { id: "entry-1", monthlyAmortization: "500.00" },
    { loanId: "sss-loan-3", monthlyAmortization: "275.50" },
  ]);
});

test("rejects invalid dates, duplicate IDs, and invalid monthly amounts", () => {
  const invalidDate = createSnapshotInput();
  invalidDate.applicableDate = "2026-02-30";
  assert.throws(() => validateLoanReportSnapshotInput(invalidDate), /applicable date/);

  const duplicateEntry = createSnapshotInput();
  duplicateEntry.entries.push({ ...duplicateEntry.entries[0] });
  assert.throws(() => validateLoanReportSnapshotInput(duplicateEntry), /only be included once/);

  const duplicateLoan = createSnapshotInput();
  duplicateLoan.entries.push({ loanId: "loan-1", monthlyAmortization: "100" });
  duplicateLoan.entries.push({ loanId: "loan-1", monthlyAmortization: "200" });
  assert.throws(() => validateLoanReportSnapshotInput(duplicateLoan), /only be added once/);

  const ambiguousEntry = {
    applicableDate: "2026-11-01",
    entries: [{
      id: "entry-1",
      loanId: "loan-1",
      monthlyAmortization: "100",
    }],
  };
  assert.throws(() => validateLoanReportSnapshotInput(ambiguousEntry), /identify one/);

  const invalidAmount = createSnapshotInput();
  invalidAmount.entries[0].monthlyAmortization = "10000000000";
  assert.throws(() => validateLoanReportSnapshotInput(invalidAmount), /supported maximum/);

  const malformedAmount = createSnapshotInput();
  malformedAmount.entries[0].monthlyAmortization = "-1.00";
  assert.throws(() => validateLoanReportSnapshotInput(malformedAmount), /non-negative amount/);
});
