export type PagibigPreviewFilter = "ALL" | "READY" | "EXCLUDED" | "MISSING_MID" | "NO_ACCOUNT";

export type PagibigPreviewEmployee = {
  pagIbigNumber: string | null;
  pagIbigAccount: { excludedFromReport: boolean } | null;
};

export function mergePagibigPreviewMembers<T extends { id: number }>(
  yearMembers: T[],
  manuallySelectedMembers: T[],
): T[] {
  const yearMemberIds = new Set(yearMembers.map((member) => member.id));
  return [
    ...yearMembers,
    ...manuallySelectedMembers.filter((member) => !yearMemberIds.has(member.id)),
  ];
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
