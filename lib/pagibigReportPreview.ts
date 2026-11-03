export type PagibigPreviewFilter = "ALL" | "READY" | "EXCLUDED" | "MISSING_MID" | "NO_ACCOUNT";

export type PagibigPreviewEmployee = {
  id?: number;
  pagIbigNumber: string | null;
  pagIbigAccount: { excludedFromReport: boolean } | null;
  lastName?: string | null;
  firstName?: string | null;
  employeeCode?: string | null;
};

export function comparePagibigPreviewMembers<T extends { id?: number }>(
  left: T & Partial<PagibigPreviewEmployee>,
  right: T & Partial<PagibigPreviewEmployee>,
): number {
  const leftLast = String(left.lastName ?? "").trim();
  const rightLast = String(right.lastName ?? "").trim();
  const lastCompare = leftLast.localeCompare(rightLast, undefined, { sensitivity: "base" });
  if (lastCompare !== 0) return lastCompare;

  const leftFirst = String(left.firstName ?? "").trim();
  const rightFirst = String(right.firstName ?? "").trim();
  const firstCompare = leftFirst.localeCompare(rightFirst, undefined, { sensitivity: "base" });
  if (firstCompare !== 0) return firstCompare;

  const leftCode = String(left.employeeCode ?? "").trim();
  const rightCode = String(right.employeeCode ?? "").trim();
  const codeCompare = leftCode.localeCompare(rightCode, undefined, { numeric: true, sensitivity: "base" });
  if (codeCompare !== 0) return codeCompare;

  return Number(left.id ?? 0) - Number(right.id ?? 0);
}

export function sortPagibigPreviewMembers<T extends { id?: number }>(
  members: readonly T[],
): T[] {
  return [...members].sort((left, right) =>
    comparePagibigPreviewMembers(
      left as T & Partial<PagibigPreviewEmployee>,
      right as T & Partial<PagibigPreviewEmployee>,
    ),
  );
}

export function mergePagibigPreviewMembers<T extends { id: number }>(
  yearMembers: T[],
  manuallySelectedMembers: T[],
): T[] {
  const yearMemberIds = new Set(yearMembers.map((member) => member.id));
  const merged = [
    ...yearMembers,
    ...manuallySelectedMembers.filter((member) => !yearMemberIds.has(member.id)),
  ];
  return sortPagibigPreviewMembers(merged) as T[];
}

export function isPagibigPreviewReady(employee: PagibigPreviewEmployee): boolean {
  return Boolean(employee.pagIbigAccount && employee.pagIbigNumber && !employee.pagIbigAccount.excludedFromReport);
}

export function getPagibigPreviewCount(
  employees: PagibigPreviewEmployee[],
  filter: PagibigPreviewFilter,
): number {
  if (filter === "ALL") return employees.length;
  return employees.filter((employee) => {
    const account = employee.pagIbigAccount;
    if (filter === "READY") return isPagibigPreviewReady(employee);
    if (filter === "NO_ACCOUNT") return !account;
    if (filter === "EXCLUDED") return Boolean(account && employee.pagIbigNumber && account.excludedFromReport);
    return Boolean(account && !employee.pagIbigNumber);
  }).length;
}

export function filterPagibigPreviewEmployees<T extends PagibigPreviewEmployee>(
  employees: T[],
  filter: PagibigPreviewFilter,
): T[] {
  if (filter === "ALL") return employees;
  return employees.filter((employee) => {
    const account = employee.pagIbigAccount;
    if (filter === "READY") return isPagibigPreviewReady(employee);
    if (filter === "NO_ACCOUNT") return !account;
    if (filter === "EXCLUDED") return Boolean(account && employee.pagIbigNumber && account.excludedFromReport);
    return Boolean(account && !employee.pagIbigNumber);
  });
}
