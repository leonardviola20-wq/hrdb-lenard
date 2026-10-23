import assert from "node:assert/strict";
import test from "node:test";
import {
  getPagibigAccountSetupHref,
  getPagibigCreateEmployeeHref,
  getPagibigReturnContext,
} from "./pagibigEmployeeWorkflow";

test("Pag-IBIG employee creation link carries selected employer and account year", () => {
  assert.equal(
    getPagibigCreateEmployeeHref(2, 2025),
    "/employees/new?returnTo=pagibig&employerId=2&year=2025",
  );
});

test("employee return context is restricted to valid Pag-IBIG create requests", () => {
  assert.deepEqual(
    getPagibigReturnContext("?returnTo=pagibig&employerId=2&year=2025", true),
    { employerId: 2, year: 2025 },
  );
  assert.equal(getPagibigReturnContext("?returnTo=external&employerId=2&year=2025", true), null);
  assert.equal(getPagibigReturnContext("?returnTo=pagibig&employerId=2&year=2019", true), null);
  assert.equal(getPagibigReturnContext("?returnTo=pagibig&employerId=0&year=2025", true), null);
  assert.equal(getPagibigReturnContext("?returnTo=pagibig&employerId=2&year=2025", false), null);
});

test("new employee return link opens account setup for the selected year", () => {
  assert.equal(
    getPagibigAccountSetupHref(2, 2025, 417),
    "/reports/pagibig?view=members&employerId=2&year=2025&addEmployeeId=417",
  );
  assert.equal(getPagibigAccountSetupHref(2, 2025, 0), null);
});
