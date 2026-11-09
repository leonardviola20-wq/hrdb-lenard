import { memberAmountColumns } from "@/components/pagibig-reports/shared/format";
import type { Account, Member } from "@/components/pagibig-reports/shared/types";

export function computeMemberTotals(filteredMembers: Member[]): number[] {
  return memberAmountColumns.map((column) =>
    filteredMembers.reduce((total, member) => total + Number(member.pagIbigAccount?.[column.field] ?? 0), 0)
  );
}

export function computeMemberSavingsTotal(totals: number[]): number {
  return (totals[0] ?? 0) + (totals[1] ?? 0);
}

export function computeMemberOverallTotal(totals: number[]): number {
  return totals.reduce((total, amount) => total + amount, 0);
}

export function computePreviewTotal(filteredPreviewMembers: Member[], field: keyof Account): number {
  return filteredPreviewMembers.reduce((total, member) => total + Number(member.pagIbigAccount?.[field] ?? 0), 0);
}

export function computePreviewOverall(
  filteredPreviewMembers: Member[],
  showSavingsColumns: boolean,
  showLoanColumns: boolean
): number {
  const fields = [
    ...(showSavingsColumns ? (["employeeSavings", "employerSavings", "mp2Amount"] as const) : []),
    ...(showLoanColumns ? (["calamityLoanAmount", "mplLoanAmount", "emergencyLoanAmount", "safeLoanAmount"] as const) : []),
  ];
  return fields.reduce((sum, field) => sum + computePreviewTotal(filteredPreviewMembers, field), 0);
}

export function getReportEmployeeOptions(allEmployees: Member[], previewMembers: Member[]): Member[] {
  return allEmployees.filter((employee) => !previewMembers.some((member) => member.id === employee.id));
}

export type PagibigMemberStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/**
 * Pure filter + sort for the Pag-IBIG Employee List.
 * Extracted from PagIbigReportsPage so it can be unit-tested without rendering.
 */
export function filterAndSortPagibigMembers(
  members: Member[],
  statusFilter: PagibigMemberStatusFilter,
  search: string,
  formatEmployeeName: (member: Member) => string
): Member[] {
  const query = search.trim().toLocaleLowerCase();
  return members
    .filter((member) => {
      const isInactive = Boolean(member.pagIbigAccount?.excludedFromReport);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "INACTIVE" ? isInactive : !isInactive);
      const matchesSearch =
        !query ||
        [formatEmployeeName(member), member.employeeCode, member.pagIbigNumber, member.status].some((value) =>
          value?.toLocaleLowerCase().includes(query)
        );
      return matchesStatus && matchesSearch;
    })
    .sort((left, right) => {
      const last = left.lastName.localeCompare(right.lastName, undefined, { sensitivity: "base" });
      if (last !== 0) return last;
      const first = left.firstName.localeCompare(right.firstName, undefined, { sensitivity: "base" });
      if (first !== 0) return first;
      const code = left.employeeCode.localeCompare(right.employeeCode, undefined, { numeric: true, sensitivity: "base" });
      if (code !== 0) return code;
      return left.id - right.id;
    });
}

export function paginateMembers<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = items.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, items.length);
  return { pageCount, currentPage, visible, firstResult, lastResult };
}