import assert from "node:assert/strict";
import test from "node:test";
import { getSssLoanStatusLabel, isSssLoanStatus, normalizeSssLoanStatus } from "./sssLoanStatus";

test("SSS loan status normalization accepts On-hold without a reason", () => {
  assert.deepEqual(normalizeSssLoanStatus("ON_HOLD", null), { status: "ON_HOLD", reason: null });
  assert.deepEqual(normalizeSssLoanStatus("ON_HOLD", ""), { status: "ON_HOLD", reason: null });
  assert.equal(normalizeSssLoanStatus("ON_HOLD", "RESIGNED"), null);
});

test("SSS loan status labels include On-hold and preserve existing statuses", () => {
  assert.equal(getSssLoanStatusLabel("ON_HOLD", null), "On-Hold");
  assert.equal(getSssLoanStatusLabel("ACTIVE", null), "Active");
  assert.equal(getSssLoanStatusLabel("PAID", "FULLY_PAID"), "Paid · Fully paid");
  assert.equal(getSssLoanStatusLabel("PAID", "APPLIED_FOR_NEW_LOAN"), "Paid · Applied for new loan");
  assert.equal(getSssLoanStatusLabel("NOT_CONNECTED", "RESIGNED"), "Not connected · Resigned");
});

test("SSS loan status validation rejects unsupported values", () => {
  assert.equal(isSssLoanStatus("ON_HOLD"), true);
  assert.equal(isSssLoanStatus("ACTIVE"), true);
  assert.equal(isSssLoanStatus("UNKNOWN"), false);
  assert.equal(isSssLoanStatus(null), false);
});
