const activeStatuses = new Set(["Regular", "Contractual", "Trainee", "Leave"]);

export function isActiveEmployeeStatus(status: string | null) {
  return activeStatuses.has(status || "");
}
