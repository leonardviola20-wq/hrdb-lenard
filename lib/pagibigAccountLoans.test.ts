import { test } from "node:test";
import assert from "node:assert/strict";

import type { LoanDetail } from "../components/pagibig-reports/shared/types";
import {
  isDuplicateLoanApplication,
  validateLoanDetail,
  loanStatusValue,
  availableLoanTypes,
  visibleAccountLoanTypes,
  accountLoanCounts,
} from "./pagibigAccountLoans";

function makeDetail(overrides: Partial<LoanDetail> = {}): LoanDetail {
  return {
    applicationNo: "APP1",
    loanTermDate: "2025-01-01",
    termYears: "2",
    amount: "1000",
    status: "ACTIVE",
    ...overrides,
  };
}

test("isDuplicateLoanApplication detects duplicates", () => {
  const details = { CAL: makeDetail({ applicationNo: "APP1" }), MPL: makeDetail({ applicationNo: "APP2" }) } as any;
  assert.equal(isDuplicateLoanApplication(details, "MPL", "APP1"), true);
  assert.equal(isDuplicateLoanApplication(details, "MPL", "APP3"), false);
  assert.equal(isDuplicateLoanApplication(details, "MPL", ""), false);
});

test("validateLoanDetail validates fields", () => {
  assert.equal(validateLoanDetail(makeDetail(), ""), true);
  assert.equal(validateLoanDetail(makeDetail({ applicationNo: "" }), ""), false);
  assert.equal(validateLoanDetail(makeDetail({ termYears: "0" }), ""), false);
  assert.equal(validateLoanDetail(makeDetail({ status: "INACTIVE" }), "RESIGNED"), true);
  assert.equal(validateLoanDetail(makeDetail({ status: "INACTIVE" }), ""), false);
});

test("loanStatusValue produces status string", () => {
  assert.equal(loanStatusValue(makeDetail({ status: "ACTIVE" }), ""), "ACTIVE");
  assert.equal(loanStatusValue(makeDetail({ status: "INACTIVE" }), "PAID"), "INACTIVE_PAID");
});

test("availableLoanTypes / visible / counts", () => {
  const details = { CAL: makeDetail({ applicationNo: "A", status: "ACTIVE" }), MPL: makeDetail({ applicationNo: "B", status: "INACTIVE" }) } as any;
  assert.deepEqual(availableLoanTypes(details), ["MPL", "EMER", "SAFE"]);
  // Actually available excludes active loans with appNo
  const counts = accountLoanCounts(details);
  assert.equal(counts.ACTIVE, 1);
  assert.equal(counts.INACTIVE, 1);
  const visible = visibleAccountLoanTypes(details, "ACTIVE");
  assert.deepEqual(visible, ["CAL"]);
});