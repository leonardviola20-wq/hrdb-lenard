import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatLoanReportMonthlyAmount,
  normalizeLoanReportMonthlyAmount,
  sumLoanReportMonthlyAmounts,
} from "./loanReportMonthly";

test("formats monthly amounts only for display and preserves blanks", () => {
  assert.equal(formatLoanReportMonthlyAmount("1234.5"), "1,234.50");
  assert.equal(formatLoanReportMonthlyAmount(""), "");
});

test("normalizes monthly snapshot amounts to two decimal places", () => {
  assert.equal(normalizeLoanReportMonthlyAmount("125"), "125.00");
  assert.equal(normalizeLoanReportMonthlyAmount("00125.5"), "125.50");
  assert.equal(normalizeLoanReportMonthlyAmount("0"), "0.00");
});

test("rejects invalid monthly snapshot amounts", () => {
  for (const value of ["", "-1", "1.234", "1e3", "10000000000", "1.", "abc"]) {
    assert.throws(() => normalizeLoanReportMonthlyAmount(value), /Monthly amount/);
  }
});

test("sums monthly snapshot amounts exactly in cents", () => {
  assert.equal(sumLoanReportMonthlyAmounts(["0.10", "0.20", "125"]), "125.30");
  assert.equal(sumLoanReportMonthlyAmounts([]), "0.00");
});

test("rejects report totals beyond the supported decimal precision", () => {
  assert.throws(
    () => sumLoanReportMonthlyAmounts(["10000000000.00"]),
    /Monthly amount exceeds/,
  );
  assert.throws(
    () => sumLoanReportMonthlyAmounts(Array(101).fill("9999999999.99")),
    /monthly total exceeds/,
  );
});
