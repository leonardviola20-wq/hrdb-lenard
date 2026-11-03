import { test } from "node:test";
import assert from "node:assert/strict";

import { fullName, money, period } from "./philHealthReportHelpers";

test("fullName formats name", () => {
  assert.equal(fullName({ firstName: "Ana", middleName: "M", lastName: "Zulu" }), "Zulu, Ana M.");
  assert.equal(fullName({ firstName: "Ana", middleName: null, lastName: "Zulu" }), "Zulu, Ana");
});

test("money formats amount", () => {
  assert.equal(money(1234.5), "₱1,234.50");
});

test("period formats period", () => {
  assert.equal(period({ applicableMonth: 1, applicableYear: 2025 }), "January 2025");
});