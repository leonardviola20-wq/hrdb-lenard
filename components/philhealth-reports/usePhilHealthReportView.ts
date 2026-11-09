"use client";

import { useMemo } from "react";
import type { Employee, Report } from "@/components/philhealth-reports/types";
import { fullName, period } from "@/components/philhealth-reports/format";

export function usePhilHealthReportView({
  employees,
  reports,
  search,
  statusFilter,
  employeePage,
  reportSearch,
  reportYearFilter,
  reportPage,
}: {
  employees: Employee[];
  reports: Report[];
  search: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  employeePage: number;
  reportSearch: string;
  reportYearFilter: string;
  reportPage: number;
}) {
  const employeePageSize = 10;
  const reportPageSize = 10;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return employees.filter((employee) => {
      const active = employee.philHealthAccount?.active ?? false;
      const statusMatches = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      const searchMatches =
        !query ||
        [fullName(employee), employee.biometricNo, employee.philHealth, employee.status, employee.employerName].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        );
      return statusMatches && searchMatches;
    });
  }, [employees, search, statusFilter]);

  const activeEmployees = employees.filter((employee) => employee.philHealthAccount?.active);
  const activeCount = activeEmployees.length;
  const inactiveCount = employees.filter((employee) => employee.philHealthAccount && !employee.philHealthAccount.active).length;

  const reportYears = useMemo(
    () => Array.from(new Set([new Date().getFullYear(), ...reports.map((report) => report.applicableYear)])).sort((a, b) => b - a),
    [reports],
  );

  const filteredReports = useMemo(() => {
    const query = reportSearch.trim().toLocaleLowerCase();
    return reports.filter((report) => {
      if (reportYearFilter !== "ALL" && String(report.applicableYear) !== reportYearFilter) return false;
      if (!query) return true;
      return [period(report), report.employerName, report.payment?.transactionDate, report.payment?.transactionConfirmationNumber, report.payment?.eparNumber].some(
        (value) => value?.toLocaleLowerCase().includes(query),
      );
    });
  }, [reports, reportSearch, reportYearFilter]);

  const reportPageCount = Math.max(1, Math.ceil(filteredReports.length / reportPageSize));
  const currentReportPage = Math.min(reportPage, reportPageCount);
  const visibleReports = filteredReports.slice((currentReportPage - 1) * reportPageSize, currentReportPage * reportPageSize);

  const displayedReports = useMemo(() => {
    if (reportYearFilter === "ALL") return visibleReports;
    const year = Number(reportYearFilter);
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const existing = reports.find((report) => report.applicableYear === year && report.applicableMonth === month);
      return (
        existing ?? ({ id: -month, applicableMonth: month, applicableYear: year, employerName: "", employerPhicNumber: null, amountDue: "0", entries: [], payment: null } as Report)
      );
    });
  }, [reportYearFilter, reports, visibleReports]);

  const employeePageCount = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const currentEmployeePage = Math.min(employeePage, employeePageCount);
  const visibleEmployees = filteredEmployees.slice((currentEmployeePage - 1) * employeePageSize, currentEmployeePage * employeePageSize);
  const firstEmployeeResult = filteredEmployees.length ? (currentEmployeePage - 1) * employeePageSize + 1 : 0;
  const lastEmployeeResult = Math.min(currentEmployeePage * employeePageSize, filteredEmployees.length);

  const reportAmountDue = activeEmployees.reduce((sum) => sum + 0, 0);

  return {
    filteredEmployees,
    activeEmployees,
    activeCount,
    inactiveCount,
    visibleEmployees,
    employeePageCount,
    currentEmployeePage,
    firstEmployeeResult,
    lastEmployeeResult,
    reportYears,
    filteredReports,
    reportPageCount,
    currentReportPage,
    visibleReports,
    displayedReports,
    reportAmountDue,
  };
}
