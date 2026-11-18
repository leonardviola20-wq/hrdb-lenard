"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { LoanRow } from "@/app/actions/loans";

const filterInputClass =
  "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

type Props = {
  provider: LoanRow["provider"];
  loans: LoanRow[];
  employees: { id: number; fullName: string }[];
  employers: { id: number; name: string }[];
  toolbarActions?: ReactNode;
  years: string[];
  loanTypes: { provider: string; type: string; label: string }[];
  employeeFilter: string;
  employeeSearch: string;
  employerFilter: string;
  yearFilter: string;
  typeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  onEmployeeSearchChange: (value: string) => void;
  onEmployerFilterChange: (value: string) => void;
  onYearFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onRefresh: () => void;
  filteredCount: number;
};

export default function LoanTableToolbar({
  provider,
  loans,
  employees,
  employers,
  toolbarActions,
  years,
  loanTypes,
  employeeFilter,
  employeeSearch,
  employerFilter,
  yearFilter,
  typeFilter,
  onEmployeeFilterChange,
  onEmployeeSearchChange,
  onEmployerFilterChange,
  onYearFilterChange,
  onTypeFilterChange,
  onRefresh,
  filteredCount,
}: Props) {
  return (
    <div className="grid min-w-0 shrink-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 xl:flex xl:flex-nowrap xl:items-center xl:gap-2 xl:overflow-x-auto">
      <div className="flex min-w-0 flex-nowrap items-center gap-2 xl:shrink-0">
        {toolbarActions}
        {provider === "SSS" && (
          <input
            type="search"
            aria-label="Search by employee name"
            placeholder="Search employee"
            value={employeeSearch}
            onChange={(event) => onEmployeeSearchChange(event.target.value)}
            className={`${filterInputClass} w-full min-w-0 sm:w-64 xl:w-52`}
          />
        )}
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Reset filters and refresh loans"
          title="Reset search and filters, then refresh loans"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowPathIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:min-w-max xl:flex-nowrap xl:items-center">
        {provider !== "SSS" && (
          <select
            aria-label="Filter by employee"
            value={employeeFilter}
            onChange={(event) => onEmployeeFilterChange(event.target.value)}
            className={`${filterInputClass} w-full min-w-0 xl:w-44 xl:shrink-0`}
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.fullName}</option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter by employer"
          value={employerFilter}
          onChange={(event) => onEmployerFilterChange(event.target.value)}
          className={`${filterInputClass} w-full min-w-0 xl:w-40 xl:shrink-0`}
        >
          <option value="">All employers</option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.name}>{employer.name}</option>
          ))}
        </select>
        <select
          aria-label="Filter by loan year"
          value={yearFilter}
          onChange={(event) => onYearFilterChange(event.target.value)}
          className={`${filterInputClass} w-full min-w-0 xl:w-28 xl:shrink-0`}
        >
          <option value="">All years</option>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          aria-label="Filter by loan type"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          className={`${filterInputClass} w-full min-w-0 xl:w-44 xl:shrink-0`}
        >
          <option value="">All loan types</option>
          {loanTypes.map((option) => (
            <option key={option.label} value={`${option.provider}|${option.type}`}>{option.label}</option>
          ))}
        </select>
        <span className="text-xs font-medium text-slate-700 sm:col-span-2 xl:shrink-0 xl:whitespace-nowrap">
          Showing {filteredCount} of {loans.length} loan{loans.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
