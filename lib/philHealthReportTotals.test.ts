import assert from "node:assert/strict";
import test from "node:test";
import { parsePhilHealthMoneyCents, sumPhilHealthContributionCents } from "./philHealthReportTotals";

test("parses non-negative PhilHealth contribution amounts as cents", () => {
  assert.equal(parsePhilHealthMoneyCents("0.10"), 10);
  assert.equal(parsePhilHealthMoneyCents(200.25), 20_025);
  assert.equal(parsePhilHealthMoneyCents(""), null);
  assert.equal(parsePhilHealthMoneyCents("-0.01"), null);
  assert.equal(parsePhilHealthMoneyCents("not-money"), null);
});

test("sums employee contributions without floating point drift", () => {
  const cents = ["0.10", "0.20", "1.05"].map(parsePhilHealthMoneyCents);
  assert.equal(sumPhilHealthContributionCents(cents), 135);
  assert.equal(sumPhilHealthContributionCents([10, null]), null);
});

test("rejects contribution totals that exceed the report amount limit", () => {
  const maximum = parsePhilHealthMoneyCents("999999999.99");
  assert.equal(maximum, 99_999_999_999);
  assert.equal(sumPhilHealthContributionCents([maximum ?? 0, 1]), null);
});
