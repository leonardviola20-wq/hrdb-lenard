import assert from "node:assert/strict";
import test from "node:test";
import {
  SSS_CONTRIBUTION_TABLE_2023_2024,
  SSS_CONTRIBUTION_TABLE_2025,
  getSssContributionBracketForYear,
  sssContributionTableForYear,
} from "./sssContributionTable";

test("sssContributionTableForYear(2023) returns the 2023-2024 table", () => {
  const table = sssContributionTableForYear(2023);
  assert.equal(table.length, SSS_CONTRIBUTION_TABLE_2023_2024.length);
  assert.equal(table[0].monthlySalaryCredit, 5_000);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 35_000);
});

test("sssContributionTableForYear(2024) returns the 2023-2024 table", () => {
  const table = sssContributionTableForYear(2024);
  assert.equal(table.length, SSS_CONTRIBUTION_TABLE_2023_2024.length);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 35_000);
});

test("sssContributionTableForYear(2025) returns the 2025 table", () => {
  const table = sssContributionTableForYear(2025);
  assert.equal(table.length, SSS_CONTRIBUTION_TABLE_2025.length);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 20_000);
});

test("sssContributionTableForYear(2026) returns the 2025 table", () => {
  const table = sssContributionTableForYear(2026);
  assert.equal(table.length, SSS_CONTRIBUTION_TABLE_2025.length);
  assert.equal(table[table.length - 1].monthlySalaryCredit, 20_000);
});

test("getSssContributionBracketForYear(2023, 35000) returns the top bracket", () => {
  const bracket = getSssContributionBracketForYear(2023, 35_000);
  assert.ok(bracket);
  assert.equal(bracket?.monthlySalaryCredit, 35_000);
  assert.equal(bracket?.employerSs, 2_000);
  assert.equal(bracket?.employeeSs, 1_000);
  assert.equal(bracket?.employerMpf, 1_500);
  assert.equal(bracket?.employeeMpf, 750);
  assert.equal(bracket?.ec, 30);
  assert.equal(bracket?.total, 5_280);
});

test("getSssContributionBracketForYear(2024, 35000) returns the top bracket", () => {
  const bracket = getSssContributionBracketForYear(2024, 35_000);
  assert.ok(bracket);
  assert.equal(bracket?.monthlySalaryCredit, 35_000);
  assert.equal(bracket?.total, 5_280);
});

test("getSssContributionBracketForYear(2025, 35000) returns null (out of 2025 range)", () => {
  const bracket = getSssContributionBracketForYear(2025, 35_000);
  assert.equal(bracket, null);
});

test("getSssContributionBracketForYear(2025, 20000) returns the top 2025 bracket", () => {
  const bracket = getSssContributionBracketForYear(2025, 20_000);
  assert.ok(bracket);
  assert.equal(bracket?.monthlySalaryCredit, 20_000);
  assert.equal(bracket?.employerSs, 2_000);
  assert.equal(bracket?.employeeSs, 1_000);
  assert.equal(bracket?.employerMpf, 0);
  assert.equal(bracket?.employeeMpf, 0);
  assert.equal(bracket?.ec, 30);
  assert.equal(bracket?.total, 3_030);
});

test("getSssContributionBracketForYear(2023, 5000) returns the bottom bracket", () => {
  const bracket = getSssContributionBracketForYear(2023, 5_000);
  assert.ok(bracket);
  assert.equal(bracket?.monthlySalaryCredit, 5_000);
  assert.equal(bracket?.employerSs, 500);
  assert.equal(bracket?.employeeSs, 250);
  assert.equal(bracket?.ec, 10);
  assert.equal(bracket?.total, 760);
});

test("getSssContributionBracketForYear returns null for invalid MSC", () => {
  assert.equal(getSssContributionBracketForYear(2023, 1_000), null);
  assert.equal(getSssContributionBracketForYear(2025, 1_000), null);
});