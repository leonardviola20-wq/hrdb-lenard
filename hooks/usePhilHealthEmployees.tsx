import { useMemo, useState, useRef, type ReactNode } from "react";
import { Employee } from "@/types/philHealthTypes";

export function usePhilHealthEmployees(
  employerId: string,
  view: "employees" | "reports"
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [accountEmployeePickerOpen, setAccountEmployeePickerOpen] = useState<boolean>(false);
  const [accountEmployeeSearch, setAccountEmployeeSearch] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [employeePage, setEmployeePage] = useState<number>(1);
  const [notice, setNotice] = useState<string>("");
  const accountPickerRef = useRef<HTMLDivElement>(null);
  const employeePageSize = 10;

  const fullName = (emp: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
    const middleInitial = emp.middleName?.trim().charAt(0);
    return `${emp.lastName}, ${emp.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
  };

  const employeeNameWithBoldFirstName = (emp: Pick<Employee, "firstName" | "middleName" | "lastName">): ReactNode => (
    <>
      {emp.lastName}, {" "}
      <span className="font-bold">{emp.firstName}</span>
      {emp.middleName?.trim().charAt(0) ? ` ${emp.middleName.trim().charAt(0).toLocaleUpperCase()}.` : ""}
    </>
  );

  const money = (amount: number | string) => `₱${(Number(amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const period = (report: { applicableMonth: number; applicableYear: number }) =>
    `${months[report.applicableMonth - 1]} ${report.applicableYear}`;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      const active = employee.philHealthAccount?.active ?? false;
      const statusMatches = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      const searchMatches = !query || [
        fullName(employee),
        employee.biometricNo,
        employee.philHealth,
        employee.status,
        employee.employerName,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
      return statusMatches && searchMatches;
    });
  }, [employees, search, statusFilter]);

  const activeCount = employees.filter((e) => e.philHealthAccount?.active).length;
  const inactiveCount = employees.filter((e) => e.philHealthAccount && !e.philHealthAccount.active).length;

  const employeePageCount = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const currentEmployeePage = Math.min(employeePage, employeePageCount);
  const visibleEmployees = filteredEmployees.slice(
    (currentEmployeePage - 1) * employeePageSize,
    currentEmployeePage * employeePageSize
  );
  const firstEmployeeResult = filteredEmployees.length ? (currentEmployeePage - 1) * employeePageSize + 1 : 0;
  const lastEmployeeResult = Math.min(currentEmployeePage * employeePageSize, filteredEmployees.length);

  return {
    employees, setEmployees,
    employeeOptions, setEmployeeOptions,
    selectedEmployeeId, setSelectedEmployeeId,
    accountEmployeePickerOpen, setAccountEmployeePickerOpen,
    accountEmployeeSearch, setAccountEmployeeSearch,
    search, setSearch,
    statusFilter, setStatusFilter,
    activeCount, inactiveCount,
    filteredEmployees,
    employeePage, setEmployeePage,
    employeePageCount,
    currentEmployeePage,
    visibleEmployees,
    firstEmployeeResult, lastEmployeeResult,
  };
}