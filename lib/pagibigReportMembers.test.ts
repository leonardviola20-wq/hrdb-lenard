import { test } from "node:test";
import assert from "node:assert/strict";

import type { Member } from "../components/pagibig-reports/types";
import { filterAndSortPagibigMembers, paginateMembers } from "./pagibigReportMembers";

function makeMember(overrides: Partial<Member>): Member {
  return {
    id: 1,
    employeeCode: "E001",
    firstName: "Ana",
    middleName: null,
    lastName: "Zulu",
    status: "Regular",
    pagIbigNumber: "123",
    pagIbigAccount: null,
    ...overrides,
  };
}

const nameOf = (m: Member) => `${m.firstName} ${m.middleName ?? ""} ${m.lastName}`.trim();

test("filterAndSortPagibigMembers filters by status", () => {
  const active = makeMember({ id: 1, lastName: "A", pagIbigAccount: { excludedFromReport: false } as Member["pagIbigAccount"] });
  const inactive = makeMember({ id: 2, lastName: "B", pagIbigAccount: { excludedFromReport: true } as Member["pagIbigAccount"] });
  const all = filterAndSortPagibigMembers([active, inactive], "ALL", "", nameOf);
  assert.equal(all.length, 2);
  const onlyActive = filterAndSortPagibigMembers([active, inactive], "ACTIVE", "", nameOf);
  assert.equal(onlyActive.length, 1);
  assert.equal(onlyActive[0].id, 1);
  const onlyInactive = filterAndSortPagibigMembers([active, inactive], "INACTIVE", "", nameOf);
  assert.equal(onlyInactive.length, 1);
  assert.equal(onlyInactive[0].id, 2);
});

test("filterAndSortPagibigMembers searches across fields", () => {
  const m = makeMember({ id: 1, employeeCode: "CODE9", pagIbigNumber: "999", lastName: "Smith" });
  assert.equal(filterAndSortPagibigMembers([m], "ALL", "code9", nameOf).length, 1);
  assert.equal(filterAndSortPagibigMembers([m], "ALL", "999", nameOf).length, 1);
  assert.equal(filterAndSortPagibigMembers([m], "ALL", "nope", nameOf).length, 0);
});

test("filterAndSortPagibigMembers sorts by last, first, code, id", () => {
  const a = makeMember({ id: 2, firstName: "Zed", lastName: "Alpha", employeeCode: "Z" });
  const b = makeMember({ id: 1, firstName: "Ana", lastName: "Alpha", employeeCode: "A" });
  const sorted = filterAndSortPagibigMembers([a, b], "ALL", "", nameOf);
  assert.deepEqual(sorted.map((m) => m.id), [1, 2]);
});

test("paginateMembers computes pages", () => {
  const items = [1, 2, 3, 4, 5];
  const r = paginateMembers(items, 1, 2);
  assert.equal(r.pageCount, 3);
  assert.equal(r.currentPage, 1);
  assert.deepEqual(r.visible, [1, 2]);
  assert.equal(r.firstResult, 1);
  assert.equal(r.lastResult, 2);
  const r2 = paginateMembers(items, 2, 2);
  assert.deepEqual(r2.visible, [3, 4]);
  const r3 = paginateMembers(items, 99, 2);
  assert.equal(r3.currentPage, 3);
  assert.deepEqual(r3.visible, [5]);
  const empty = paginateMembers([], 1, 2);
  assert.equal(empty.pageCount, 1);
  assert.equal(empty.firstResult, 0);
});