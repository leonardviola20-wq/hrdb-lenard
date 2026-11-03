import { test } from "node:test";
import assert from "node:assert/strict";

import {
  monthEnd,
  localDateInputValue,
  dateOnly,
  creatorLabel,
  formatReportCreatedAt,
  formatLoanDateMdy,
  formatAmountDue,
} from "./sssReportHelpers";

test("monthEnd formats month end date", () => {
  assert.equal(monthEnd(1, 2025), "January 31, 2025");
});

test("localDateInputValue formats date", () => {
  assert.equal(localDateInputValue(new Date(2025, 0, 5)), "2025-01-05");
});

test("dateOnly returns slice or dash", () => {
  assert.equal(dateOnly("2025-01-05"), "2025-01-05");
  assert.equal(dateOnly(null), "—");
});

test("creatorLabel falls back to email/Unknown", () => {
  assert.equal(creatorLabel({ creator: { name: "Jane", email: "j@x.com" } }), "Jane");
  assert.equal(creatorLabel({ creator: { name: null, email: "j@x.com" } }), "j@x.com");
  assert.equal(creatorLabel({ creator: null }), "Unknown");
});

test("formatReportCreatedAt returns dash for invalid", () => {
  assert.equal(formatReportCreatedAt("not-a-date"), "—");
});

test("formatLoanDateMdy formats MDY", () => {
  assert.equal(formatLoanDateMdy("2025-01-05"), "01/05/2025");
  assert.equal(formatLoanDateMdy(null), "—");
});

test("formatAmountDue formats or empty", () => {
  assert.equal(formatAmountDue("1234.5"), "1,234.50");
  assert.equal(formatAmountDue(""), "");
  assert.equal(formatAmountDue("abc"), "");
});