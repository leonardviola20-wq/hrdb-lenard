import assert from "node:assert/strict";
import test from "node:test";
import { buildSssContributionHistory, buildSssContributionMatrix, type SssContributionEntryInput } from "./sssContributionHistory";

const entry = (overrides: Partial<SssContributionEntryInput>): SssContributionEntryInput => ({
  id: 1,
  reportId: 1,
  employerName: "Acme Corp",
  prn: "PRN-1",
  totalAmount: "1000.00",
  salaryRange: "20,000 - 20,249.99",
  monthlySalaryCredit: "20000",
  employerSs: "1900",
  employeeSs: "900",
  employerMpf: "0",
  employeeMpf: "0",
  ec: "30",
  employeeEmployerName: null,
  applicableYear: 2026,
  applicableMonth: 1,
  ...overrides,
});

test("empty history reports zero totals", () => {
  const history = buildSssContributionHistory([]);
  assert.equal(history.entryCount, 0);
  assert.equal(history.totalAmount, "0.00");
  assert.deepEqual(history.months, []);
});

test("groups entries by applicable month and sums totals", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, reportId: 10, totalAmount: "1000.00", applicableYear: 2026, applicableMonth: 1 }),
    entry({ id: 2, reportId: 11, totalAmount: "250.50", applicableYear: 2026, applicableMonth: 1 }),
    entry({ id: 3, reportId: 12, totalAmount: "500.25", applicableYear: 2025, applicableMonth: 12 }),
  ]);

  assert.equal(history.entryCount, 3);
  assert.equal(history.totalAmount, "1750.75");
  assert.equal(history.months.length, 2);
  assert.deepEqual(
    history.months.map((month) => ({ year: month.year, month: month.month, total: month.totalAmount })),
    [
      { year: 2026, month: 1, total: "1250.50" },
      { year: 2025, month: 12, total: "500.25" },
    ],
  );
  assert.deepEqual(history.months[0].entries.map((item) => item.id), [1, 2]);
});

test("orders months newest first", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, applicableYear: 2025, applicableMonth: 6 }),
    entry({ id: 2, applicableYear: 2026, applicableMonth: 2 }),
    entry({ id: 3, applicableYear: 2025, applicableMonth: 12 }),
  ]);

  assert.deepEqual(history.months.map((month) => `${month.year}-${month.month}`), ["2026-2", "2025-12", "2025-6"]);
});

test("normalizes amounts to two decimal strings and keeps null MSC", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, totalAmount: 7, monthlySalaryCredit: null, employerSs: 0, ec: "12.345" }),
  ]);
  const [month] = history.months;
  const [row] = month.entries;
  assert.equal(row.totalAmount, "7.00");
  assert.equal(row.monthlySalaryCredit, null);
  assert.equal(row.employerSs, 0);
  assert.equal(row.ec, 12.35);
});

test("carries the report payment date onto each entry and defaults to null", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, payDate: "2026-01-17" }),
    entry({ id: 2 }),
  ]);
  assert.deepEqual(history.months[0].entries.map((item) => item.payDate), ["2026-01-17", null]);
});

test("keeps the payment employer separate from the employee employer snapshot", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, employerName: "Report Employer", employeeEmployerName: "Entry Employer" }),
    entry({ id: 2, employerName: "Report Employer", employeeEmployerName: null }),
  ]);
  assert.deepEqual(history.months[0].entries.map((item) => item.employeeEmployerName), ["Entry Employer", null]);
  assert.deepEqual(history.months[0].entries.map((item) => item.employerName), ["Report Employer", "Report Employer"]);
});

test("buckets the same month across different years separately", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, applicableYear: 2025, applicableMonth: 3, totalAmount: "100.00" }),
    entry({ id: 2, applicableYear: 2026, applicableMonth: 3, totalAmount: "200.00" }),
  ]);
  assert.equal(history.months.length, 2);
  assert.deepEqual(history.months.map((month) => month.year), [2026, 2025]);
});

test("matrix includes only years with entries, newest first", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, applicableYear: 2024, applicableMonth: 11 }),
    entry({ id: 2, applicableYear: 2026, applicableMonth: 2 }),
    entry({ id: 3, applicableYear: 2024, applicableMonth: 1 }),
  ]);
  const matrix = buildSssContributionMatrix(history);
  assert.deepEqual(matrix.map((row) => row.year), [2026, 2024]);
});

test("matrix fills months without contributions with 0.00", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, applicableYear: 2026, applicableMonth: 3, totalAmount: "150.00" }),
  ]);
  const [row] = buildSssContributionMatrix(history);
  assert.equal(row.months.length, 12);
  assert.equal(row.months[0], "0.00");
  assert.equal(row.months[2], "150.00");
  assert.equal(row.months[11], "0.00");
  assert.deepEqual(buildSssContributionMatrix(buildSssContributionHistory([])), []);
});

test("matrix sums multiple entries in the same month", () => {
  const history = buildSssContributionHistory([
    entry({ id: 1, applicableYear: 2026, applicableMonth: 6, totalAmount: "1000.00" }),
    entry({ id: 2, applicableYear: 2026, applicableMonth: 6, totalAmount: "250.75" }),
  ]);
  const [row] = buildSssContributionMatrix(history);
  assert.equal(row.months[5], "1250.75");
});
