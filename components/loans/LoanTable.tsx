"use client";

import { useState, type ReactNode } from "react";
import type { LoanRow } from "@/app/actions/loans";
import LoanTableData from "./LoanTableData";
import LoanTableToolbar from "./LoanTableToolbar";

export default function LoanTable({
  provider,
  loans,
  employees,
  employers,
  initialEmployerFilter,
  toolbarActions,
  hideToolbar = false,
  belowToolbarContent,
  onEdit,
  onDelete,
  onRefresh,
}: {
  provider: LoanRow["provider"];
  loans: LoanRow[];
  employees: { id: number; fullName: string }[];
  employers: { id: number; name: string }[];
  initialEmployerFilter?: string;
  toolbarActions?: ReactNode;
  hideToolbar?: boolean;
  belowToolbarContent?: ReactNode;
  onEdit: (loan: LoanRow) => void;
  onDelete: (loan: LoanRow) => void;
  onRefresh: () => void;
}) {
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employerFilter, setEmployerFilter] = useState(initialEmployerFilter ?? "");
  const [yearFilter, setYearFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const years = Array.from(
    new Set(loans.filter((loan) => loan.loanDate).map((loan) => loan.loanDate!.slice(0, 4))),
  ).sort((a, b) => Number(b) - Number(a));
  const loanTypes = Array.from(new Set(loans.map((loan) => `${loan.provider}|${loan.loanType}`)))
    .map((combined) => {
      const [loanProvider, type] = combined.split("|");
      return {
        provider: loanProvider,
        type,
        label: `${loanProvider === "PAGIBIG" ? "Pag-IBIG" : "SSS"} — ${type}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const employeeNameQuery = employeeSearch.trim().toLocaleLowerCase("en");
  const resetFiltersAndRefresh = () => {
    setEmployeeFilter("");
    setEmployeeSearch("");
    setEmployerFilter("");
    setYearFilter("");
    setTypeFilter("");
    onRefresh();
  };
  const filtered = loans.filter((loan) => {
    if (provider === "SSS" && employeeNameQuery) {
      if (
        !loan.employeeName.toLocaleLowerCase("en").includes(employeeNameQuery) &&
        !loan.employeeNameMiddleInitial.toLocaleLowerCase("en").includes(employeeNameQuery)
      ) {
        return false;
      }
    }
    if (provider !== "SSS" && employeeFilter && String(loan.employeeId) !== employeeFilter) return false;
    if (employerFilter && loan.employerName !== employerFilter) return false;
    if (yearFilter && (loan.loanDate ?? "").slice(0, 4) !== yearFilter) return false;
    if (typeFilter && `${loan.provider}|${loan.loanType}` !== typeFilter) return false;
    return true;
  });
  if (provider === "SSS") {
    filtered.sort((left, right) =>
      left.employeeName.localeCompare(right.employeeName, "en", { sensitivity: "base" }),
    );
  }

  return (
    <div className={provider === "SSS" ? "flex min-h-0 min-w-0 flex-1 flex-col gap-4" : "space-y-4"}>
      {!hideToolbar && <LoanTableToolbar
        provider={provider}
        loans={loans}
        employees={employees}
        employers={employers}
        toolbarActions={toolbarActions}
        years={years}
        loanTypes={loanTypes}
        employeeFilter={employeeFilter}
        employeeSearch={employeeSearch}
        employerFilter={employerFilter}
        yearFilter={yearFilter}
        typeFilter={typeFilter}
        onEmployeeFilterChange={setEmployeeFilter}
        onEmployeeSearchChange={setEmployeeSearch}
        onEmployerFilterChange={setEmployerFilter}
        onYearFilterChange={setYearFilter}
        onTypeFilterChange={setTypeFilter}
        onRefresh={resetFiltersAndRefresh}
        filteredCount={filtered.length}
      />}
      <LoanTableData
        provider={provider}
        loans={loans}
        filtered={filtered}
        belowToolbarContent={belowToolbarContent}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
