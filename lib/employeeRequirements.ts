export const employeeRequirements = [
  { key: "twoByTwoPictures", label: "2x2 Pictures (2 pcs)" },
  { key: "updatedResume", label: "Updated Resume" },
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
  { key: "bdoSavingsAccount", label: "Savings Account Number (BDO savings only)" },
  { key: "drugTest", label: "Drug Test" },
] as const;

export type EmployeeRequirementKey = (typeof employeeRequirements)[number]["key"];

export const employeeRequirementGroups: {
  label: string;
  keys: readonly EmployeeRequirementKey[];
}[] = [
  {
    label: "Personal & Family",
    keys: [
      "twoByTwoPictures",
      "updatedResume",
      "birthCertificatePsa",
      "marriageContract",
      "childrenBirthCertificatesPsa",
      "residenceSketch",
    ],
  },
  {
    label: "Government & Membership",
    keys: ["tin1902", "sssForms", "philHealthMdr", "pagIbigMdf"],
  },
  {
    label: "Expiring & Renewable Documents",
    keys: [
      "barangayClearance",
      "mayorsPermit",
      "healthCertificate",
      "nbiOrPoliceClearance",
      "drugTest",
    ],
  },
  {
    label: "Employment",
    keys: ["employmentCertificate"],
  },
  {
    label: "Banking",
    keys: ["bdoSavingsAccount"],
  },
];

export function isEmployeeRequirementKey(value: unknown): value is EmployeeRequirementKey {
  return typeof value === "string"
    && employeeRequirements.some((requirement) => requirement.key === value);
}

export function isSingleEmployee(maritalStatus: string | null | undefined) {
  return maritalStatus?.trim().toLowerCase() === "single";
}

export function getApplicableEmployeeRequirements(maritalStatus: string | null | undefined) {
  return employeeRequirements.filter(
    (requirement) => !(requirement.key === "marriageContract" && isSingleEmployee(maritalStatus)),
  );
}

export function getEmployeeRequirementCompletion(
  requirements: readonly { requirementKey: string; isComplete?: boolean }[],
  maritalStatus: string | null | undefined,
  bdoAccountNumberCount: number,
) {
  const completedKeys = new Set(
    requirements.filter((requirement) => requirement.isComplete !== false).map((requirement) => requirement.requirementKey),
  );
  const applicableRequirements = getApplicableEmployeeRequirements(maritalStatus);
  const completed = applicableRequirements.filter((requirement) => (
    completedKeys.has(requirement.key)
    && (requirement.key !== "bdoSavingsAccount" || bdoAccountNumberCount > 0)
  )).length;

  return { completed, total: applicableRequirements.length };
}

export function countEmployeesMissingRequirements(
  employees: readonly {
    maritalStatus?: string | null;
    requirementsBypassed?: boolean | null;
    requirements: readonly { requirementKey: string }[];
    bdoAccountNumbers?: readonly { id?: number }[];
  }[],
) {
  return employees.filter((employee) => {
    if (employee.requirementsBypassed) return false;
    const completedKeys = new Set(employee.requirements.map((requirement) => requirement.requirementKey));
    return getApplicableEmployeeRequirements(employee.maritalStatus).some((requirement) => (
      !completedKeys.has(requirement.key)
      || (requirement.key === "bdoSavingsAccount" && !employee.bdoAccountNumbers?.length)
    ));
  }).length;
}
