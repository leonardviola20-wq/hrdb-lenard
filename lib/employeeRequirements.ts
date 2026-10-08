export const employeeRequirements = [
  { key: "updatedResume", label: "Updated Resume with Recent Photo" },
  { key: "barangayClearance", label: "Barangay Clearance" },
  { key: "mayorsPermit", label: "Mayor's Permit" },
  { key: "healthCertificate", label: "Health Certificate" },
  { key: "nbiOrPoliceClearance", label: "NBI Clearance / Police Clearance" },
  { key: "tin1902", label: "TIN Number with 1902 Form" },
  { key: "sssForms", label: "SSS Number / E-1 / E-4 / E-6" },
  { key: "philHealthMdr", label: "PhilHealth Number with Member Data Record (MDR)" },
  { key: "pagIbigMdf", label: "Pag-IBIG Number / MDF" },
  { key: "birthCertificatePsa", label: "Birth Certificate / PSA" },
  { key: "marriageContract", label: "Marriage Contract (if married)" },
  { key: "childrenBirthCertificatesPsa", label: "Birth Certificates of Children / PSA" },
  { key: "residenceSketch", label: "Sketch of Permanent Residence" },
  { key: "employmentCertificate", label: "Latest Employment Certificate (COE)" },
  { key: "bdoSavingsAccount", label: "Savings Account Number (BDO)" },
  { key: "twoByTwoPictures", label: "2×2 Pictures (2 pcs.)" },
  { key: "drugTest", label: "Drug Test" },
] as const;

export type EmployeeRequirementKey = (typeof employeeRequirements)[number]["key"];

export function isEmployeeRequirementKey(value: unknown): value is EmployeeRequirementKey {
  return typeof value === "string"
    && employeeRequirements.some((requirement) => requirement.key === value);
}

export function countEmployeesMissingRequirements(
  employees: readonly { requirements: readonly { requirementKey: string }[] }[],
) {
  return employees.filter((employee) => {
    const completedKeys = new Set(employee.requirements.map((requirement) => requirement.requirementKey));
    return employeeRequirements.some((requirement) => !completedKeys.has(requirement.key));
  }).length;
}
