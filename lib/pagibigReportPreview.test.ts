import assert from "node:assert/strict";
import test from "node:test";
import {
  filterPagibigPreviewEmployees,
  getPagibigPreviewCount,
  isPagibigPreviewReady,
  mergePagibigPreviewMembers,
  type PagibigPreviewFilter,
} from "./pagibigReportPreview";

const employees = [
  { id: 1, pagIbigNumber: "MID-1", pagIbigAccount: { excludedFromReport: false, year: 2025 } },
  { id: 2, pagIbigNumber: "MID-2", pagIbigAccount: { excludedFromReport: true, year: 2025 } },
  { id: 3, pagIbigNumber: null, pagIbigAccount: { excludedFromReport: false, year: 2025 } },
  { id: 4, pagIbigNumber: "MID-4", pagIbigAccount: null },
];

test("Pag-IBIG report preview keeps employees with no selected-year account visible but not ready", () => {
  assert.equal(isPagibigPreviewReady(employees[3]), false);
  assert.equal(getPagibigPreviewCount(employees, "ALL"), 4);
  assert.equal(getPagibigPreviewCount(employees, "READY"), 1);
  assert.equal(getPagibigPreviewCount(employees, "NO_ACCOUNT"), 1);
  assert.deepEqual(
    filterPagibigPreviewEmployees(employees, "NO_ACCOUNT").map((employee) => employee.id),
    [4],
  );
  assert.deepEqual(filterPagibigPreviewEmployees(employees, "ALL"), employees);
});

test("Pag-IBIG report preview filters preserve excluded and missing-MID categories", () => {
  const filters: PagibigPreviewFilter[] = ["EXCLUDED", "MISSING_MID"];
  assert.deepEqual(filters.map((filter) => getPagibigPreviewCount(employees, filter)), [1, 1]);
  assert.deepEqual(
    filterPagibigPreviewEmployees(employees, "EXCLUDED").map((employee) => employee.id),
    [2],
  );
  assert.deepEqual(
    filterPagibigPreviewEmployees(employees, "MISSING_MID").map((employee) => employee.id),
    [3],
  );
});

test("year-account refresh retains manually selected employees and replaces stale year account data", () => {
  type TestMember = { id: number; pagIbigAccount: { year: number; employeeSavings: string } | null };
  const currentYearMembers: TestMember[] = [
    { id: 1, pagIbigAccount: { year: 2025, employeeSavings: "200" } },
  ];
  const manuallySelectedMembers: TestMember[] = [
    { id: 1, pagIbigAccount: null },
    { id: 5, pagIbigAccount: null },
  ];
  const merged = mergePagibigPreviewMembers(currentYearMembers, manuallySelectedMembers);

  assert.deepEqual(merged, [
    { id: 1, pagIbigAccount: { year: 2025, employeeSavings: "200" } },
    { id: 5, pagIbigAccount: null },
  ]);
});
