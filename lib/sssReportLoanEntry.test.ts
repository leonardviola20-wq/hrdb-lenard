import assert from "node:assert/strict";
import test from "node:test";
import { isLoanAccountLinkedToReportEmployee } from "./sssReportLoanEntry";

test("allows any saved loan status when the account belongs to the selected employee", () => {
  for (const status of ["ACTIVE", "PAID", "ON_HOLD", "NOT_CONNECTED"]) {
    const loan = { employeeId: 42, status };
    assert.equal(isLoanAccountLinkedToReportEmployee(loan, 42), true);
  }
});

test("rejects missing and unrelated loan accounts", () => {
  assert.equal(isLoanAccountLinkedToReportEmployee(undefined, 42), false);
  assert.equal(isLoanAccountLinkedToReportEmployee({ employeeId: null }, 42), false);
  assert.equal(isLoanAccountLinkedToReportEmployee({ employeeId: 43 }, 42), false);
});
