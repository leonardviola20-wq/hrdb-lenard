import assert from "node:assert/strict";
import test from "node:test";
import { calculatePagIbigReportTotals, parsePagIbigMoneyCents } from "./pagibigReportTotals";

test("parses non-negative Pag-IBIG money as integer cents", () => {
  assert.equal(parsePagIbigMoneyCents("200.25"), 20_025);
  assert.equal(parsePagIbigMoneyCents(0), 0);
  assert.equal(parsePagIbigMoneyCents("-0.01"), null);
  assert.equal(parsePagIbigMoneyCents("not-money"), null);
});

test("calculates report column, employee, and overall totals without floating point drift", () => {
  const result = calculatePagIbigReportTotals([
    { employeeSavings: "200.10", employerSavings: "200.10", mp2Amount: "25.25", calamityLoanAmount: "0", mplLoanAmount: "100.05", emergencyLoanAmount: "0", safeLoanAmount: "0" },
    { employeeSavings: "200.10", employerSavings: "200.10", mp2Amount: "0", calamityLoanAmount: "50.50", mplLoanAmount: "0", emergencyLoanAmount: "0", safeLoanAmount: "0" },
  ]);

  assert.ok(result);
  assert.equal(result.entries[0].totalCents, 52_550);
  assert.equal(result.totals.employeeSavings, 40_020);
  assert.equal(result.totals.calamityLoanAmount, 5_050);
  assert.equal(result.amountDueCents, 97_620);
});

test("rejects invalid values and totals that exceed the report decimal precision", () => {
  const invalid = calculatePagIbigReportTotals([
    { employeeSavings: -1, employerSavings: 0, mp2Amount: 0, calamityLoanAmount: 0, mplLoanAmount: 0, emergencyLoanAmount: 0, safeLoanAmount: 0 },
  ]);
  const overflow = calculatePagIbigReportTotals([
    { employeeSavings: "999999999.99", employerSavings: "999999999.99", mp2Amount: "999999999.99", calamityLoanAmount: "999999999.99", mplLoanAmount: "999999999.99", emergencyLoanAmount: "999999999.99", safeLoanAmount: "999999999.99" },
    { employeeSavings: "999999999.99", employerSavings: "999999999.99", mp2Amount: "999999999.99", calamityLoanAmount: "999999999.99", mplLoanAmount: "999999999.99", emergencyLoanAmount: "999999999.99", safeLoanAmount: "999999999.99" },
  ]);
  assert.equal(invalid, null);
  assert.equal(overflow, null);
});
