export type EmployeeNavigationFilters = {
  status: string;
  branch: string;
  employer: string;
};

export type NavigableEmployee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string | null;
  branch: string | null;
  employerId: number | null;
  employerName: string | null;
};

const activeStatuses = new Set(["Regular", "Contractual", "Trainee", "Leave"]);

export function matchesEmployeeStatus(status: string | null, filter: string) {
  if (filter === "ALL") return true;
  if (filter === "ACTIVE") return activeStatuses.has(status || "");
  if (filter === "INACTIVE") return !activeStatuses.has(status || "");
  return status === filter;
}

export function matchesEmployeeNavigationFilters(
  employee: NavigableEmployee,
  filters: EmployeeNavigationFilters,
) {
  return matchesEmployeeStatus(employee.status, filters.status)
    && (!filters.branch || employee.branch === filters.branch)
    && (!filters.employer || String(employee.employerId ?? "") === filters.employer);
}

export function sortNavigableEmployees<T extends Pick<NavigableEmployee, "firstName" | "middleName" | "lastName">>(
  employees: readonly T[],
) {
  return [...employees].sort(compareEmployeeNames);
}

export function getFirstMatchingEmployee(
  employees: readonly NavigableEmployee[],
  filters: EmployeeNavigationFilters,
) {
  return sortNavigableEmployees(employees.filter((employee) =>
    matchesEmployeeNavigationFilters(employee, filters),
  ))[0] ?? null;
}

function compareEmployeeNames(
  left: Pick<NavigableEmployee, "firstName" | "middleName" | "lastName"> & { id?: number },
  right: Pick<NavigableEmployee, "firstName" | "middleName" | "lastName"> & { id?: number },
) {
  const leftName = [left.firstName, left.middleName, left.lastName].filter(Boolean).join(" ");
  const rightName = [right.firstName, right.middleName, right.lastName].filter(Boolean).join(" ");
  return leftName.localeCompare(rightName, undefined, { numeric: true, sensitivity: "base" })
    || (left.id !== undefined && right.id !== undefined ? left.id - right.id : 0);
}

export function getEmployeeNavigation(
  employees: readonly NavigableEmployee[],
  currentEmployee: NavigableEmployee,
  filters: EmployeeNavigationFilters,
) {
  const matching = sortNavigableEmployees(employees.filter((employee) =>
    matchesEmployeeNavigationFilters(employee, filters),
  ));
  const currentIndex = matching.findIndex((employee) => employee.id === currentEmployee.id);
  const insertionIndex = currentIndex >= 0
    ? currentIndex
    : matching.findIndex((employee) => compareEmployeeNames(employee, currentEmployee) > 0) < 0
      ? matching.length
      : matching.findIndex((employee) => compareEmployeeNames(employee, currentEmployee) > 0);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : insertionIndex;
  const previousIndex = currentIndex >= 0 ? currentIndex - 1 : insertionIndex - 1;

  return {
    matching,
    currentIndex,
    position: currentIndex >= 0 ? currentIndex + 1 : 0,
    previous: previousIndex >= 0 ? matching[previousIndex] ?? null : null,
    next: nextIndex >= 0 ? matching[nextIndex] ?? null : null,
  };
}

export function employeeProfileHref(employeeId: number, filters: EmployeeNavigationFilters, tab?: string) {
  const search = new URLSearchParams({
    status: filters.status,
    branch: filters.branch,
    employer: filters.employer,
  });
  if (tab) search.set("tab", tab);
  return `/employees/${employeeId}?${search.toString()}`;
}

export function employeeDirectoryHref(filters: EmployeeNavigationFilters) {
  const search = new URLSearchParams({
    status: filters.status,
    branch: filters.branch,
    employer: filters.employer,
  });
  return `/employees?${search.toString()}`;
}

export function navigationFilterLabel(
  filters: EmployeeNavigationFilters,
  employerName: string | null,
) {
  const parts = [
    filters.branch || "All branches",
    filters.employer ? employerName || "Selected employer" : null,
    filters.status === "ACTIVE"
      ? "Active"
      : filters.status === "INACTIVE"
        ? "Inactive"
        : filters.status === "ALL"
          ? "All statuses"
          : filters.status,
  ].filter(Boolean);
  return `Navigating ${parts.join(" · ")}`;
}
