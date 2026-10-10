import assert from "node:assert/strict";
import test from "node:test";
import { calculateSssLoanOutstandingBalanceCents, calculateSssLoanPaymentAmountCents, getSssLoanFirstAmortizationDate, parseSssLoanDateOnly } from "./sssLoanBalance";

test("loan date parser rejects an overlong or invalid year without throwing", () => {
  assert.equal(parseSssLoanDateOnly("10000-01-01"), null);
  assert.equal(parseSssLoanDateOnly("0000-01-01"), null);
  assert.equal(parseSssLoanDateOnly("2026-02-30"), null);
  assert.equal(parseSssLoanDateOnly("2026-02-28")?.toISOString(), "2026-02-28T00:00:00.000Z");
});

test("loan balance only changes when actual employee payments are recorded", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(10_000_00),
    10_000_00,
  );
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(10_000_00, 2_500_00),
    7_500_00,
  );
});

test("loan balance is unknown when approved principal is unavailable", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(null),
    null,
  );
});

test("actual loan payments cannot reduce the balance below zero", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(5_000_00, 7_500_00),
    0,
  );
});

test("first amortization date is the first day of the second month after the loan date", () => {
  assert.equal(
    getSssLoanFirstAmortizationDate(new Date("2026-12-20T00:00:00.000Z")).toISOString(),
    "2027-02-01T00:00:00.000Z",
  );
});

test("monthly loan payment is due starting the second month after the loan date", () => {
  const loanDate = new Date("2026-05-28T00:00:00.000Z");
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-05-01T00:00:00.000Z")), 0);
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-06-01T00:00:00.000Z")), 0);
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-07-01T00:00:00.000Z")), 2_500_00);
});

test("monthly loan due remains available after the principal amount is amortized", () => {
  assert.equal(
    calculateSssLoanPaymentAmountCents(2_500_00, new Date("2026-01-01T00:00:00.000Z"), new Date("2026-04-01T00:00:00.000Z")),
    2_500_00,
  );
});
