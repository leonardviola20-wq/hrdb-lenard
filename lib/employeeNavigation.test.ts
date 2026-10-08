import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  employeeDirectoryHref,
  employeeProfileHref,
  getFirstMatchingEmployee,
  getEmployeeNavigation,
  matchesEmployeeNavigationFilters,
  matchesEmployeeStatus,
  navigationFilterLabel,
  sortNavigableEmployees,
} from "./employeeNavigation";

const employee = {
  id: 1,
  firstName: "Alex",
  middleName: null,
  lastName: "Example",
  status: "Regular",
  branch: "Branch A",
  employerId: 12,
  employerName: "Example Co",
};

describe("employee navigation filters", () => {
  it("uses the directory's active, inactive, all, and specific status semantics", () => {
    assert.equal(matchesEmployeeStatus("Regular", "ACTIVE"), true);
    assert.equal(matchesEmployeeStatus("Leave", "ACTIVE"), true);
    assert.equal(matchesEmployeeStatus("Resigned", "INACTIVE"), true);
    assert.equal(matchesEmployeeStatus("Resigned", "ALL"), true);
    assert.equal(matchesEmployeeStatus("Regular", "Trainee"), false);
  });

  it("requires status, branch, and employer filters to all match", () => {
    assert.equal(matchesEmployeeNavigationFilters(employee, {
      status: "ACTIVE",
      branch: "Branch A",
      employer: "12",
    }), true);
    assert.equal(matchesEmployeeNavigationFilters(employee, {
      status: "INACTIVE",
      branch: "Branch A",
      employer: "12",
    }), false);
    assert.equal(matchesEmployeeNavigationFilters(employee, {
      status: "ACTIVE",
      branch: "Branch B",
      employer: "12",
    }), false);
    assert.equal(matchesEmployeeNavigationFilters(employee, {
      status: "ACTIVE",
      branch: "Branch A",
      employer: "13",
    }), false);
  });

  it("sorts by the displayed full name", () => {
    const sorted = sortNavigableEmployees([
      { ...employee, firstName: "Zed" },
      { ...employee, firstName: "Alex" },
    ]);
    assert.deepEqual(sorted.map((item) => item.firstName), ["Alex", "Zed"]);
  });

  it("returns the first alphabetized employee matching changed filters", () => {
    const employees = [
      { ...employee, id: 1, firstName: "Zed" },
      { ...employee, id: 2, firstName: "Alex", branch: "Branch B" },
      { ...employee, id: 3, firstName: "Blair" },
    ];
    assert.equal(
      getFirstMatchingEmployee(employees, { status: "ACTIVE", branch: "Branch A", employer: "12" })?.id,
      3,
    );
    assert.equal(
      getFirstMatchingEmployee(employees, { status: "INACTIVE", branch: "Branch A", employer: "12" }),
      null,
    );
  });

  it("navigates only through matching employees and indicates an excluded current employee as zero", () => {
    const employees = [
      { ...employee, id: 1, firstName: "Alex" },
      { ...employee, id: 2, firstName: "Blair", branch: "Branch B" },
      { ...employee, id: 3, firstName: "Casey" },
    ];
    const filters = { status: "ACTIVE", branch: "Branch A", employer: "12" };

    const navigation = getEmployeeNavigation(employees, employees[0], filters);
    assert.equal(navigation.position, 1);
    assert.equal(navigation.matching.length, 2);
    assert.equal(navigation.previous, null);
    assert.equal(navigation.next?.id, 3);

    const excludedNavigation = getEmployeeNavigation(employees, employees[1], filters);
    assert.equal(excludedNavigation.position, 0);
    assert.equal(excludedNavigation.matching.length, 2);
    assert.equal(excludedNavigation.previous?.id, 1);
    assert.equal(excludedNavigation.next?.id, 3);
  });

  it("preserves selected directory filters in profile and Back URLs", () => {
    const filters = { status: "Trainee", branch: "Branch A", employer: "12" };
    assert.equal(
      employeeProfileHref(17, filters),
      "/employees/17?status=Trainee&branch=Branch+A&employer=12",
    );
    assert.equal(
      employeeDirectoryHref(filters),
      "/employees?status=Trainee&branch=Branch+A&employer=12",
    );
  });

  it("describes the navigation scope using the chosen branch, employer, and status", () => {
    assert.equal(
      navigationFilterLabel({ status: "Trainee", branch: "Branch A", employer: "12" }, "Example Co"),
      "Navigating Branch A · Example Co · Trainee",
    );
  });
});
