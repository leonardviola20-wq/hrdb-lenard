import assert from "node:assert/strict";
import test from "node:test";
import { buildPhilHealthContributionHistory } from "@/lib/philHealthContributionHistory";

test("groups contribution snapshots by period and sums entries across employers", () => {
  const history = buildPhilHealthContributionHistory([
    {
      id: 2,
      reportId: 12,
      employerName: "Beta",
      applicableYear: 2025,
      applicableMonth: 5,
      amount: "123.45",
      payDate: null,
      eparNumber: null,
      eparDate: null,
    },
    {
      id: 1,
      reportId: 11,
      employerName: "Alpha",
      applicableYear: 2025,
      applicableMonth: 5,
      amount: "100.10",
      payDate: "2025-06-10",
      eparNumber: "EPAR-001",
      eparDate: "2025-06-11",
    },
    {
      id: 3,
      reportId: 13,
      employerName: "Alpha",
      applicableYear: 2024,
      applicableMonth: 12,
      amount: "50",
      payDate: null,
      eparNumber: null,
      eparDate: null,
    },
  ]);

  assert.equal(history.entryCount, 3);
  assert.equal(history.totalAmount, "273.55");
  assert.deepEqual(history.months.map(({ year, month, totalAmount }) => ({ year, month, totalAmount })), [
    { year: 2025, month: 5, totalAmount: "223.55" },
    { year: 2024, month: 12, totalAmount: "50.00" },
  ]);
  assert.deepEqual(history.months[0].entries.map(({ employerName }) => employerName), ["Alpha", "Beta"]);
  assert.equal(history.months[0].entries[0].eparNumber, "EPAR-001");
  assert.equal(history.months[0].entries[0].eparDate, "2025-06-11");
  assert.equal(history.months[0].entries[1].payDate, null);
});

test("returns an empty history without inventing contributions", () => {
  assert.deepEqual(buildPhilHealthContributionHistory([]), {
    entryCount: 0,
    totalAmount: "0.00",
    months: [],
  });
});

test("rejects malformed periods and invalid saved amounts", () => {
  assert.throws(() => buildPhilHealthContributionHistory([{
    id: 1,
    reportId: 1,
    employerName: "Alpha",
    applicableYear: 2025,
    applicableMonth: 13,
    amount: "1.00",
    payDate: null,
    eparNumber: null,
    eparDate: null,
  }]), /period/);
  assert.throws(() => buildPhilHealthContributionHistory([{
    id: 1,
    reportId: 1,
    employerName: "Alpha",
    applicableYear: 2025,
    applicableMonth: 1,
    amount: "invalid",
    payDate: null,
    eparNumber: null,
    eparDate: null,
  }]), /amount/);
});
