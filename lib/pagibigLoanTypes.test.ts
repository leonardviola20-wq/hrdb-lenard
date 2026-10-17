import assert from "node:assert/strict";
import test from "node:test";
import { getPagibigLoanTermEndDate, normalizePagibigLoanType } from "./pagibigLoanTypes";

test("normalizes existing Pag-IBIG loan type labels", () => {
  assert.equal(normalizePagibigLoanType("CALAMITY"), "CAL");
  assert.equal(normalizePagibigLoanType("MPL"), "MPL");
  assert.equal(normalizePagibigLoanType("Emergency"), "EMER");
  assert.equal(normalizePagibigLoanType("SAFE"), "SAFE");
  assert.equal(normalizePagibigLoanType("UNKNOWN"), null);
});

test("calculates a term end date and clamps leap-day dates", () => {
  assert.equal(
    getPagibigLoanTermEndDate(new Date("2024-02-29T00:00:00.000Z"), 1).toISOString().slice(0, 10),
    "2025-02-28",
  );
  assert.equal(
    getPagibigLoanTermEndDate(new Date("2024-05-31T00:00:00.000Z"), 3).toISOString().slice(0, 10),
    "2027-05-31",
  );
});
