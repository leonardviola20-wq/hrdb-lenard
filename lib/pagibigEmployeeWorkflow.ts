import { validPagibigYear } from "@/lib/pagibigYear";

export type PagibigReturnContext = { employerId: number; year: number };

function validEmployerId(value: unknown): number | null {
  const employerId = Number(value);
  return Number.isSafeInteger(employerId) && employerId > 0 ? employerId : null;
}

export function getPagibigReturnContext(search: string, isCreate: boolean): PagibigReturnContext | null {
  if (!isCreate) return null;
  const params = new URLSearchParams(search);
  if (params.get("returnTo") !== "pagibig") return null;
  const employerId = validEmployerId(params.get("employerId"));
  const year = validPagibigYear(params.get("year"));
  return employerId && year ? { employerId, year } : null;
}

export function getPagibigCreateEmployeeHref(employerIdValue: unknown, yearValue: unknown): string | null {
  const employerId = validEmployerId(employerIdValue);
  const year = validPagibigYear(yearValue);
  if (!employerId || !year) return null;
  const params = new URLSearchParams({ returnTo: "pagibig", employerId: String(employerId), year: String(year) });
  return `/employees/new?${params.toString()}`;
}

export function getPagibigAccountSetupHref(
  employerIdValue: unknown,
  yearValue: unknown,
  employeeIdValue: unknown,
): string | null {
  const employerId = validEmployerId(employerIdValue);
  const year = validPagibigYear(yearValue);
  const employeeId = Number(employeeIdValue);
  if (!employerId || !year || !Number.isSafeInteger(employeeId) || employeeId <= 0) return null;
  const params = new URLSearchParams({
    view: "members",
    employerId: String(employerId),
    year: String(year),
    addEmployeeId: String(employeeId),
  });
  return `/reports/pagibig?${params.toString()}`;
}
