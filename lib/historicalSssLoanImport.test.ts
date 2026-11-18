import assert from "node:assert/strict";
import test from "node:test";
import {
  findHistoricalSssImportDuplicate,
  type HistoricalSssImportMatch,
} from "./historicalSssLoanImport";

const candidate: HistoricalSssImportMatch & { sourceReportId: number } = {
  sourceReportId: 18,
  employerName: "Example Foods",
  applicableMonth: 9,
  applicableYear: 2026,
  prn: "PRN-18",
  loanAccountNumbers: ["SSS-100", "SSS-200"],
};

test("detects an already-imported source report", () => {
  assert.equal(
    findHistoricalSssImportDuplicate(candidate, [
      { ...candidate, loanAccountNumbers: [] },
    ]),
    "the same source report is already present",
  );
});

test("detects a matching PRN regardless of employer formatting", () => {
  assert.equal(
    findHistoricalSssImportDuplicate(candidate, [
      { ...candidate, sourceReportId: 99, employerName: "Different Employer", prn: " prn-18 " },
    ]),
    "the same PRN is already present",
  );
});

test("detects overlapping loan accounts for the same employer and period", () => {
  assert.equal(
    findHistoricalSssImportDuplicate(candidate, [
      {
        ...candidate,
        sourceReportId: 99,
        employerName: "  EXAMPLE   FOODS ",
        prn: "OTHER-PRN",
        loanAccountNumbers: [" sss-200 "],
      },
    ]),
    "a report for the same employer and period contains a matching loan account",
  );
});

test("does not treat unrelated accounts or employers as duplicates", () => {
  assert.equal(
    findHistoricalSssImportDuplicate(candidate, [
      {
        ...candidate,
        sourceReportId: 99,
        employerName: "Another Employer",
        prn: "OTHER-PRN",
        loanAccountNumbers: ["SSS-100"],
      },
      {
        ...candidate,
        sourceReportId: 100,
        prn: "OTHER-PRN",
        loanAccountNumbers: ["SSS-300"],
      },
    ]),
    null,
  );
});
