export type EmployeePayloadInput = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: Date | null;
  age: number | null;
  maritalStatus: string | null;
  gender: string | null;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyNumber: string | null;
  emergencyRelation: string | null;
  emergencyAddress: string | null;
  biometricNo: string | null;
  branch: string | null;
  position: string | null;
  jobLevel: string | null;
  supervisorId: number | null;
  photoUrl: string | null;
  employerId: number | null;
  status: string | null;
  dateStarted: Date | null;
  endDate: Date | null;
  sssNumber: string | null;
  pagIbigNumber: string | null;
  philHealth: string | null;
  tinNumber: string | null;
  remarks: string | null;
};

export type EmployeePayloadResult =
  | { ok: true; data: EmployeePayloadInput }
  | { ok: false; error: string };

// Statuses that require an end date before the employee is treated as inactive.
const ENDED_STATUSES = new Set(["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"]);
export const JOB_LEVELS = ["Entry-level", "Junior", "Mid-level", "Senior", "Supervisor/Lead", "Manager", "Executive"] as const;

function isJobLevel(value: string): value is (typeof JOB_LEVELS)[number] {
  return JOB_LEVELS.some((jobLevel) => jobLevel === value);
}

/**
 * Normalizes and validates an employee create/update payload.
 * Shared by the create (POST) and update (PATCH) routes so both accept the same shape.
 */
export function validateEmployeePayload(body: unknown): EmployeePayloadResult {
  const raw = (body ?? {}) as Record<string, unknown>;

  const text = (field: string) => {
    const value = raw[field];
    return typeof value === "string" ? value.trim() || null : null;
  };
  // Returns null when empty, a Date when parseable, and undefined when invalid.
  const date = (field: string) => {
    const value = text(field);
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };
  const number = (field: string) => {
    const value = raw[field];
    return value === "" || value === null || value === undefined ? null : Number(value);
  };

  const firstName = typeof raw.firstName === "string" ? raw.firstName.trim() : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName.trim() : "";
  if (!firstName || !lastName) {
    return { ok: false, error: "First name and last name are required" };
  }

  const status = text("status");
  const dateOfBirth = date("dateOfBirth");
  const dateStarted = date("dateStarted");
  const endDate = ENDED_STATUSES.has(status || "") ? date("endDate") : null;
  if (dateOfBirth === undefined || dateStarted === undefined || endDate === undefined) {
    return { ok: false, error: "Enter valid dates" };
  }

  const age = number("age");
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 130)) {
    return { ok: false, error: "Enter a valid age" };
  }

  const employerId = number("employerId");
  if (employerId !== null && !Number.isInteger(employerId)) {
    return { ok: false, error: "Select a valid employer" };
  }
  const supervisorId = number("supervisorId");
  if (supervisorId !== null && (!Number.isInteger(supervisorId) || supervisorId < 1)) {
    return { ok: false, error: "Select a valid supervisor" };
  }
  const jobLevel = text("jobLevel");
  if (jobLevel !== null && !isJobLevel(jobLevel)) {
    return { ok: false, error: "Select a valid job level" };
  }

  return {
    ok: true,
    data: {
      firstName,
      middleName: text("middleName"),
      lastName,
      dateOfBirth,
      age,
      maritalStatus: text("maritalStatus"),
      gender: text("gender"),
      mobileNumber: text("mobileNumber"),
      email: text("email"),
      address: text("address"),
      emergencyName: text("emergencyName"),
      emergencyNumber: text("emergencyNumber"),
      emergencyRelation: text("emergencyRelation"),
      emergencyAddress: text("emergencyAddress"),
      biometricNo: text("biometricNo"),
      branch: text("branch"),
      position: text("position"),
      jobLevel,
      supervisorId,
      photoUrl: text("photoUrl"),
      employerId,
      status,
      dateStarted,
      endDate,
      sssNumber: text("sssNumber"),
      pagIbigNumber: text("pagIbigNumber"),
      philHealth: text("philHealth"),
      tinNumber: text("tinNumber"),
      remarks: text("remarks"),
    },
  };
}
