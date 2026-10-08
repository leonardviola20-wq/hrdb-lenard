import assert from "node:assert/strict";
import test from "node:test";
import {
  countEmployeesMissingRequirements,
  employeeRequirements,
  isEmployeeRequirementKey,
} from "./employeeRequirements";

test("employee requirement definitions contain the complete checklist", () => {
  assert.equal(employeeRequirements.length, 17);
  assert.equal(new Set(employeeRequirements.map((requirement) => requirement.key)).size, 17);
});

test("validates requirement keys against the checklist", () => {
  assert.equal(isEmployeeRequirementKey("drugTest"), true);
  assert.equal(isEmployeeRequirementKey("unknownRequirement"), false);
  assert.equal(isEmployeeRequirementKey(null), false);
});

test("counts employees missing at least one distinct requirement", () => {
  const allRequirements = employeeRequirements.map(({ key }) => ({ requirementKey: key }));
  assert.equal(countEmployeesMissingRequirements([
    { requirements: allRequirements },
    { requirements: [] },
    { requirements: allRequirements.slice(0, -1) },
    { requirements: [...allRequirements, allRequirements[0]] },
  ]), 2);
});
