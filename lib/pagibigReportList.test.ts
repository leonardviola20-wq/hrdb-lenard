import { test } from "node:test";
import assert from "node:assert/strict";

import type { Report } from "../components/pagibig-reports/shared/types";
import { computePagibigYears, filterPagibigReports, mergeManualPagibigReports } from "./pagibigReportList";

function makeReport(overrides: Partial<Report>): Report {
  return {
    id: 1,
    kind: "CONTRIBUTION",
    manual: false,
    pin: "P",
    employerId: 1,
    employerName: "Emp",
    employerPagibigNumber: null,
    applicableMonth: 1,
    applicableYear: 2025,
    employeeSavingsTotal: "0",
    employerSavingsTotal: "0",
    mp2Total: "0",
    calamityLoanTotal: "0",
    mplLoanTotal: "0",
    emergencyLoanTotal: "0",
    safeLoanTotal: "0",
    amountDue: "100",
    amountPaid: null,
    paymentType: null,
    payDate: null,
    transactionReference: null,
    entries: [],
    ...overrides,
  };
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

test("computePagibigYears includes current year", () => {
  const years = computePagibigYears([], "PIF");
  assert.ok(years.includes(new Date().getFullYear()));
});

test("filterPagibigReports filters by manual flag and year", () => {
  const r1 = makeReport({ id: 1, manual: false, applicableYear: 2025 });
  const r2 = makeReport({ id: 2, manual: true, applicableYear: 2025 });
  const out = filterPagibigReports([r1, r2], "PIF", "2025", "ALL", "", months);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 1);
});

test("mergeManualPagibigReports merges contrib+loan", () => {
  const contrib = makeReport({ id: 1, kind: "CONTRIBUTION", manual: true, applicableMonth: 3, applicableYear: 2025, amountDue: "100", amountPaid: "100", payDate: "2025-03-01" });
  const loan = makeReport({ id: 2, kind: "LOAN", manual: true, applicableMonth: 3, applicableYear: 2025, amountDue: "50", amountPaid: "50", payDate: "2025-03-01" });
  const merged = mergeManualPagibigReports([contrib, loan]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].amountDue, "150");
  assert.equal(merged[0].amountPaid, "150");
});