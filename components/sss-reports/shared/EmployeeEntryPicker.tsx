"use client";

import { useEffect, useRef } from "react";
import { CheckIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Field } from "./SmallComponents";
import { formatMoney } from "./format";
import { inputClass } from "./constants";
import type { Employee, PaymentKind, SssLoan } from "./types";

/** Employee / loan-account entry picker shown over the report form. */
export function EmployeeEntryPicker({
  kind, onClose, employeeSssSearch, setEmployeeSssSearch, loanEntrySearch, setLoanEntrySearch,
  filteredContributionEmployees, chosenEmployeeIds, selectedEmployeeId, selectEmployeeForContribution,
  selectedContributionEmployee, employeeDropdownOpen, setEmployeeDropdownOpen, loadingEmployerEmployees,
  selectedMsc, setSelectedMsc, setRangePickerTarget,
  availableLoanEntries, loadingLoans, selectedLoanIds, setSelectedLoanIds, addSelected,
}: {
  kind: PaymentKind;
  onClose: () => void;
  employeeSssSearch: string;
  setEmployeeSssSearch: (value: string) => void;
  loanEntrySearch: string;
  setLoanEntrySearch: (value: string) => void;
  filteredContributionEmployees: Employee[];
  chosenEmployeeIds: Set<number>;
  selectedEmployeeId: string;
  selectEmployeeForContribution: (employee: Employee) => void;
  selectedContributionEmployee: Employee | null;
  employeeDropdownOpen: boolean;
  setEmployeeDropdownOpen: (open: boolean) => void;
  loadingEmployerEmployees: boolean;
  selectedMsc: string;
  setSelectedMsc: (value: string) => void;
  setRangePickerTarget: (target: "new") => void;
  availableLoanEntries: SssLoan[];
  loadingLoans: boolean;
  selectedLoanIds: number[];
  setSelectedLoanIds: (updater: (current: number[]) => number[]) => void;
  addSelected: () => void;
}) {
  const employeeDropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!employeeDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [employeeDropdownOpen, setEmployeeDropdownOpen]);

  const employeeName = (employee: Pick<Employee, "firstName" | "middleName" | "lastName">) => {
    const middleInitial = employee.middleName?.trim().charAt(0);
    return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
  };

  const dropdownOptions = filteredContributionEmployees
    .filter((employee) => !chosenEmployeeIds.has(employee.id) || String(employee.id) === selectedEmployeeId);
  const searchMatches = filteredContributionEmployees.filter((employee) => !chosenEmployeeIds.has(employee.id));

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 pb-4 pt-[8vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="employee-entry-title" className="flex h-[min(80dvh,42rem)] w-full max-w-xl flex-col rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex shrink-0 items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{kind === "CONTRIBUTION" ? "Contribution entry" : "Loan entry"}</p><h3 id="employee-entry-title" className="mt-1 text-lg font-bold text-slate-900">{kind === "CONTRIBUTION" ? "Select employee" : "Select loan account"}</h3><p className="mt-1 text-xs text-slate-500">{kind === "CONTRIBUTION" ? "Choose any employee from the database, regardless of employer or status." : "Choose any saved loan account linked to an employee, regardless of status or report period."}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {kind === "CONTRIBUTION" && <Field label="Search by employee name or SS Number"><input type="search" value={employeeSssSearch} onChange={(event) => setEmployeeSssSearch(event.target.value)} className={inputClass} placeholder="Type a name or SS Number" autoComplete="off" /></Field>}
          {kind === "LOAN" && <Field label="Search by name or SS Number"><input type="search" value={loanEntrySearch} onChange={(event) => setLoanEntrySearch(event.target.value)} className={inputClass} placeholder="Type a name or SS Number" autoComplete="off" /></Field>}
          {kind === "CONTRIBUTION" && employeeSssSearch.trim() && <div className="-mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white" role="listbox" aria-label="Matching employees">
            {searchMatches.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No employees match this name or SS Number.</p>}
            {searchMatches.map((employee) => <button key={employee.id} type="button" role="option" aria-selected={selectedEmployeeId === String(employee.id)} onClick={() => selectEmployeeForContribution(employee)} className={`block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-blue-50 ${selectedEmployeeId === String(employee.id) ? "bg-blue-50" : "bg-white"}`}><span className="block text-sm font-bold text-slate-900">{employeeName(employee)} <span className="font-mono font-medium">· {employee.sssNumber || "No SS Number"}</span></span></button>)}
          </div>}
          {kind === "CONTRIBUTION"
            ? <Field label="Employee from database" required><div ref={employeeDropdownRef} className="relative"><button type="button" disabled={loadingEmployerEmployees} onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)} className={`${inputClass} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`} aria-haspopup="listbox" aria-expanded={employeeDropdownOpen}><span className="min-w-0 truncate">{loadingEmployerEmployees ? "Loading employees..." : selectedContributionEmployee ? <><span className="font-bold text-slate-900">{employeeName(selectedContributionEmployee)}</span> <span className="font-mono font-medium text-slate-600">· {selectedContributionEmployee.sssNumber || "Not set"}</span></> : "Select employee"}</span><ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-600" /></button>{employeeDropdownOpen && !loadingEmployerEmployees && <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg" role="listbox" aria-label="Employees from database">{dropdownOptions.length === 0 ? <p className="px-3 py-2 text-sm text-slate-500">No employees available.</p> : dropdownOptions.map((employee) => <button key={employee.id} type="button" role="option" aria-selected={selectedEmployeeId === String(employee.id)} onClick={() => { selectEmployeeForContribution(employee); setEmployeeDropdownOpen(false); }} className={`block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-blue-50 ${selectedEmployeeId === String(employee.id) ? "bg-blue-50" : "bg-white"}`}><span className="block text-sm font-bold text-slate-900">{employeeName(employee)} <span className="font-mono font-medium text-slate-600">· {employee.sssNumber || "Not set"}</span></span></button>)}</div>}</div></Field>
            : <Field label="Loan Account" required><div className="overflow-hidden rounded-lg border border-slate-300" role="group" aria-label="Loan accounts"><div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)_minmax(6rem,auto)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600"><span>Name</span><span>Loan Account Number</span><span className="text-right">Loan Amount</span></div><div className="max-h-60 overflow-y-auto">{loadingLoans ? <p className="px-3 py-4 text-center text-sm text-slate-500">Loading loan accounts...</p> : availableLoanEntries.map((loan) => <label key={loan.id} className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)_minmax(6rem,auto)] items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0 hover:bg-blue-50 ${selectedLoanIds.includes(loan.id) ? "bg-blue-50" : "bg-white"}`}><span className="flex min-w-0 items-center gap-2 font-medium text-slate-900"><input type="checkbox" name="loan-account" value={loan.id} checked={selectedLoanIds.includes(loan.id)} onChange={() => setSelectedLoanIds((current) => current.includes(loan.id) ? current.filter((id) => id !== loan.id) : [...current, loan.id])} className="shrink-0 rounded accent-blue-600" /><span className="truncate">{loan.employeeName}</span></span><span className="truncate font-mono text-xs text-slate-700">{loan.loanAccountNumber}</span><span className="text-right font-semibold tabular-nums text-slate-900">{formatMoney(Number(loan.monthlyPayment) > 0 ? loan.monthlyPayment : loan.monthlyAmortization)}</span></label>)}{!loadingLoans && availableLoanEntries.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-500">{loanEntrySearch.trim() ? "No loan accounts match this name or SS Number." : "No unselected saved loan accounts are available."}</p>}</div></div></Field>}
          {kind === "CONTRIBUTION" && <Field label="MSC"><button type="button" disabled={!selectedEmployeeId} onClick={() => setRangePickerTarget("new")} className={`${inputClass} flex items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}><span>{selectedMsc ? formatMoney(Number(selectedMsc)) : selectedEmployeeId ? "Select range" : "Select an employee first"}</span><ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-600" /></button></Field>}
        </div>
        <div className="mt-4 flex shrink-0 justify-end gap-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>{kind === "LOAN" && <button type="button" disabled={loadingLoans || selectedLoanIds.length === 0} onClick={addSelected} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckIcon className="h-4 w-4" /> Add {selectedLoanIds.length} Account{selectedLoanIds.length === 1 ? "" : "s"}</button>}</div>
      </section>
    </div>
  );
}
