import assert from "node:assert/strict";
import test from "node:test";
import { getSssLoanTypeLabel, getSssLoanTypeListLabel, isSssLoanType, sssLoanTypes } from "./sssLoanTypes";

test("SSS loan type choices have the expected codes and labels", () => {
  assert.deepEqual(sssLoanTypes, [
    { code: "S", label: "Salary Loan" },
    { code: "C", label: "Calamity Loan" },
    { code: "R", label: "Emergency Loan" },
  ]);
  assert.equal(getSssLoanTypeLabel("S"), "Salary Loan (S)");
  assert.equal(getSssLoanTypeLabel("C"), "Calamity Loan (C)");
  assert.equal(getSssLoanTypeLabel("R"), "Emergency Loan (R)");
  assert.equal(getSssLoanTypeListLabel("S"), "S-Salary");
  assert.equal(getSssLoanTypeListLabel("C"), "C-Calamity");
  assert.equal(getSssLoanTypeListLabel("R"), "R-Emergency");
});

test("SSS loan type validation rejects unsupported input", () => {
  assert.equal(isSssLoanType("S"), true);
  assert.equal(isSssLoanType("C"), true);
  assert.equal(isSssLoanType("R"), true);
  assert.equal(isSssLoanType("X"), false);
  assert.equal(isSssLoanType(null), false);
});
