import assert from "node:assert/strict";
import test from "node:test";
import {
  countEmployeesMissingRequirements,
  employeeRequirementGroups,
  employeeRequirements,
  getApplicableEmployeeRequirements,
  getEmployeeRequirementCompletion,
  isEmployeeRequirementKey,
  isSingleEmployee,
} from "./employeeRequirements";

test("employee requirement definitions contain the complete checklist", () => {
  assert.equal(employeeRequirements.length, 17);
  assert.equal(new Set(employeeRequirements.map((requirement) => requirement.key)).size, 17);
  assert.equal(employeeRequirements[0].key, "twoByTwoPictures");
  assert.equal(employeeRequirements.find((requirement) => requirement.key === "updatedResume")?.label, "Updated Resume");
});

test("employee requirement groups cover each checklist item exactly once", () => {
  const groupedKeys = employeeRequirementGroups.flatMap((group) => group.keys);
  assert.equal(groupedKeys.length, employeeRequirements.length);
  assert.deepEqual(
    new Set(groupedKeys),
    new Set(employeeRequirements.map((requirement) => requirement.key)),
  );

  const renewableGroup = employeeRequirementGroups.find(
    (group) => group.label === "Expiring & Renewable Documents",
  );
  assert.deepEqual(renewableGroup?.keys, [
    "barangayClearance",
    "mayorsPermit",
    "healthCertificate",
    "nbiOrPoliceClearance",
    "drugTest",
  ]);
});

test("validates requirement keys against the checklist", () => {
  assert.equal(isEmployeeRequirementKey("drugTest"), true);
  assert.equal(isEmployeeRequirementKey("unknownRequirement"), false);
  assert.equal(isEmployeeRequirementKey(null), false);
});

test("counts employees missing at least one distinct requirement", () => {
  const allRequirements = employeeRequirements.map(({ key }) => ({ requirementKey: key }));
  assert.equal(countEmployeesMissingRequirements([
    { requirements: allRequirements, bdoAccountNumbers: [{ id: 1 }] },
    { requirements: [] },
    { requirements: allRequirements.slice(0, -1), bdoAccountNumbers: [{ id: 1 }] },
    { requirements: [...allRequirements, allRequirements[0]], bdoAccountNumbers: [{ id: 1 }] },
  ]), 2);
});

test("Single employees do not need a Marriage Contract", () => {
  assert.equal(isSingleEmployee(" Single "), true);
  assert.equal(isSingleEmployee("Married"), false);
  assert.equal(getApplicableEmployeeRequirements("Single").length, 16);
  assert.equal(getApplicableEmployeeRequirements("Married").length, 17);

  const withoutMarriageContract = employeeRequirements
    .filter(({ key }) => key !== "marriageContract")
    .map(({ key }) => ({ requirementKey: key }));
  assert.equal(countEmployeesMissingRequirements([
    { maritalStatus: "Single", requirements: withoutMarriageContract, bdoAccountNumbers: [{ id: 1 }] },
  ]), 0);
  assert.equal(countEmployeesMissingRequirements([
    { maritalStatus: "Married", requirements: withoutMarriageContract, bdoAccountNumbers: [{ id: 1 }] },
  ]), 1);
});

test("BDO completion requires an account number", () => {
  const completedItems = employeeRequirements.map(({ key }) => ({ requirementKey: key, isComplete: true }));
  assert.equal(getEmployeeRequirementCompletion(completedItems, "Married", 0).completed, 16);
  assert.equal(getEmployeeRequirementCompletion(completedItems, "Married", 1).completed, 17);
  assert.equal(countEmployeesMissingRequirements([
    { maritalStatus: "Married", requirements: completedItems, bdoAccountNumbers: [] },
  ]), 1);
});

test("bypassed employees are excluded from the missing-requirements count", () => {
  assert.equal(countEmployeesMissingRequirements([
    { requirementsBypassed: true, maritalStatus: "Married", requirements: [], bdoAccountNumbers: [] },
    { requirementsBypassed: false, maritalStatus: "Married", requirements: [], bdoAccountNumbers: [] },
    { requirements: [] },
  ]), 2);
  assert.equal(countEmployeesMissingRequirements([
    { requirementsBypassed: true, requirements: [] },
  ]), 0);
});
