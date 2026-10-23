import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePhilHealthMoneyCents,
  sumPhilHealthContributionCents,
  getPhilHealthMinimumContributionCents,
  getPhilHealthShares,
} from "./philHealthReportTotals";

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

test("returns minimum monthly contribution cents per year from reference table", () => {
  assert.equal(getPhilHealthMinimumContributionCents(2019), 27500);
  assert.equal(getPhilHealthMinimumContributionCents(2020), 30000);
  assert.equal(getPhilHealthMinimumContributionCents(2021), 35000);
  assert.equal(getPhilHealthMinimumContributionCents(2022), 40000);
  assert.equal(getPhilHealthMinimumContributionCents(2023), 40000);
  assert.equal(getPhilHealthMinimumContributionCents(2024), 50000);
  assert.equal(getPhilHealthMinimumContributionCents(2025), 50000);
  assert.equal(getPhilHealthMinimumContributionCents(2026), 50000);
  assert.equal(getPhilHealthMinimumContributionCents(2030), 50000);
  assert.equal(getPhilHealthMinimumContributionCents(2018), null);
  assert.equal(getPhilHealthMinimumContributionCents(NaN as unknown as number), null);
});

test("computes PS, ES, and Total shares as half of minimum contribution", () => {
  assert.deepEqual(getPhilHealthShares(2019), { psCents: 13750, esCents: 13750, totalCents: 27500 });
  assert.deepEqual(getPhilHealthShares(2020), { psCents: 15000, esCents: 15000, totalCents: 30000 });
  assert.deepEqual(getPhilHealthShares(2021), { psCents: 17500, esCents: 17500, totalCents: 35000 });
  assert.deepEqual(getPhilHealthShares(2022), { psCents: 20000, esCents: 20000, totalCents: 40000 });
  assert.deepEqual(getPhilHealthShares(2024), { psCents: 25000, esCents: 25000, totalCents: 50000 });
  assert.deepEqual(getPhilHealthShares(2030), { psCents: 25000, esCents: 25000, totalCents: 50000 });
  assert.equal(getPhilHealthShares(2018), null);
});

test("regression: minimum PhilHealth contributions are stored as cents, not pesos", () => {
  // 2019 minimum monthly premium is ₱275.00 => 27500 cents, not 275.
  assert.equal(getPhilHealthMinimumContributionCents(2019), 27500);
  assert.notEqual(getPhilHealthMinimumContributionCents(2019), 275);
});
