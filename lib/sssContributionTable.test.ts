import assert from "node:assert/strict";
import test from "node:test";
import {
  SSS_AVAILABLE_YEARS,
  sssContributionTableForYear,
  getSssContributionBracketForYear,
} from "./sssContributionTable";

test("available years include 2019-2025", () => {
  assert.deepEqual(SSS_AVAILABLE_YEARS, [2019, 2020, 2021, 2022, 2023, 2024, 2025]);
});

test("2025 table has 61 rows and max MSC 35000", () => {
  const table = sssContributionTableForYear(2025);
  assert.equal(table.length, 61);
  assert.equal(table[0].monthlySalaryCredit, 5_000);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 35_000);
});

test("2023 table has 53 rows and max MSC 30000", () => {
  const table = sssContributionTableForYear(2023);
  assert.equal(table.length, 53);
  assert.equal(table[0].monthlySalaryCredit, 4_000);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 30_000);
});

test("2021 table has 45 rows and max MSC 25000", () => {
  const table = sssContributionTableForYear(2021);
  assert.equal(table.length, 45);
  assert.equal(table[0].monthlySalaryCredit, 3_000);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 25_000);
});

test("2019 table has 37 rows and max MSC 20000", () => {
  const table = sssContributionTableForYear(2019);
  assert.equal(table.length, 37);
  assert.equal(table[0].monthlySalaryCredit, 2_000);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 20_000);
});

test("2025 top bracket values", () => {
  const bracket = getSssContributionBracketForYear(2025, 35_000);
  assert.ok(bracket);
  assert.equal(bracket?.employerSs, 2_000);
  assert.equal(bracket?.employeeSs, 1_000);
  assert.equal(bracket?.employerMpf, 1_500);
  assert.equal(bracket?.employeeMpf, 750);
  assert.equal(bracket?.ec, 30);
  assert.equal(bracket?.total, 5_280);
});

test("2023 top bracket values", () => {
  const bracket = getSssContributionBracketForYear(2023, 30_000);
  assert.ok(bracket);
  assert.equal(bracket?.employerSs, 1_900);
  assert.equal(bracket?.employeeSs, 900);
  assert.equal(bracket?.employerMpf, 950);
  assert.equal(bracket?.employeeMpf, 450);
  assert.equal(bracket?.ec, 30);
  assert.equal(bracket?.total, 4_230);
});

test("2025 bottom bracket values", () => {
  const bracket = getSssContributionBracketForYear(2025, 5_000);
  assert.ok(bracket);
  assert.equal(bracket?.employerSs, 500);
  assert.equal(bracket?.employeeSs, 250);
  assert.equal(bracket?.employerMpf, 0);
  assert.equal(bracket?.employeeMpf, 0);
  assert.equal(bracket?.ec, 10);
  assert.equal(bracket?.total, 760);
});

test("invalid MSC returns null", () => {
  assert.equal(getSssContributionBracketForYear(2025, 1_000), null);
  assert.equal(getSssContributionBracketForYear(2023, 1_000), null);
});
