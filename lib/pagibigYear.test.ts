import assert from "node:assert/strict";
import test from "node:test";
import { getPagibigAccountYears, validPagibigYear } from "./pagibigYear";

test("account year options include historical years and default to the current year", () => {
  assert.deepEqual(getPagibigAccountYears(2026), [2026, 2025, 2024, 2023, 2022, 2021, 2020]);
});

test("Pag-IBIG year validation accepts 2025 and rejects unsupported years", () => {
  assert.equal(validPagibigYear("2025"), 2025);
  assert.equal(validPagibigYear(2026), 2026);
  assert.equal(validPagibigYear(2019), null);
  assert.equal(validPagibigYear(2201), null);
});
