"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import {
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { Employee, Employer } from "@/components/philhealth-reports/types";
import { employeeNameWithBoldFirstName } from "@/components/philhealth-reports/format";
import { inputClass, labelClass } from "@/components/philhealth-reports/constants";

type AccountFormDialogProps = {
  open: boolean;
  employer: Employer | null;
  employeeOptions: Employee[];
  setEmployeeOptions: Dispatch<SetStateAction<Employee[]>>;
  setError: (e: string) => void;
  setNotice: (n: string) => void;
  saving: boolean;
  accountEmployeePickerOpen: boolean;
  setAccountEmployeePickerOpen: (open: boolean) => void;
  accountEmployeeSearch: string;
  setAccountEmployeeSearch: (s: string) => void;
  accountPickerRef: React.RefObject<HTMLDivElement>;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  selectedAccountEmployee: Employee | undefined;
  accountAssignedEmployees: Employee[];
  accountOtherEmployees: Employee[];
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function AccountFormDialog({
  open,
  employer,
  employeeOptions,
  setEmployeeOptions,
  setError,
  setNotice,
  saving,
  accountEmployeePickerOpen,
  setAccountEmployeePickerOpen,
  accountEmployeeSearch,
  setAccountEmployeeSearch,
  accountPickerRef,
  selectedEmployeeId,
  setSelectedEmployeeId,
  selectedAccountEmployee,
  accountAssignedEmployees,
  accountOtherEmployees,
  onClose,
  onSubmit,
}: AccountFormDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="space-y-3 p-5"><div className="block"><span className={labelClass}>Employee · current employer employees listed first</span><div className="relative" ref={accountPickerRef}><button type="button" disabled={saving} aria-haspopup="listbox" aria-expanded={accountEmployeePickerOpen} onClick={() => { setAccountEmployeeSearch(""); setAccountEmployeePickerOpen((_: boolean) => !_); }} className={`${inputClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:bg-slate-100`}><span className={selectedAccountEmployee ? "truncate text-slate-900" : "truncate text-slate-600"}>{selectedAccountEmployee ? employeeNameWithBoldFirstName(selectedAccountEmployee) : "Select employee"}{selectedAccountEmployee?.philHealth ? <span className="ml-2 font-normal text-slate-500">· {selectedAccountEmployee.philHealth}</span> : null}</span><ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${accountEmployeePickerOpen ? "rotate-180" : ""}`} /></button>{accountEmployeePickerOpen && <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl"><div className="border-b border-slate-200 p-2"><input autoFocus type="search" value={accountEmployeeSearch} onChange={(event) => setAccountEmployeeSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setAccountEmployeePickerOpen(false); }} aria-label="Search employees" placeholder="Search name, PhilHealth number, or employer" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div><div role="listbox" aria-label="Employees" className="max-h-56 overflow-y-auto overscroll-contain">{accountAssignedEmployees.length > 0 && <div className="sticky top-0 z-10 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">{`Assigned to ${employer?.name ?? "selected employer"}`}</div>}{accountAssignedEmployees.map((employee) => { const selected = String(employee.id) === selectedEmployeeId; return <button key={employee.id} type="button" role="option" aria-selected={selected} onClick={() => { setSelectedEmployeeId(String(employee.id)); setAccountEmployeePickerOpen(false); setAccountEmployeeSearch(""); }} className={`flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50 ${selected ? "bg-emerald-50" : "bg-white"}`}><span className="text-sm text-slate-900">{employeeNameWithBoldFirstName(employee)} <span className="font-normal text-slate-500">· {employee.philHealth || "No PhilHealth number"}</span></span></button>; })}{accountOtherEmployees.length > 0 && <div className="sticky top-0 z-10 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">All other employees</div>}{accountOtherEmployees.map((employee) => { const selected = String(employee.id) === selectedEmployeeId; return <button key={employee.id} type="button" role="option" aria-selected={selected} onClick={() => { setSelectedEmployeeId(String(employee.id)); setAccountEmployeePickerOpen(false); setAccountEmployeeSearch(""); }} className={`flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50 ${selected ? "bg-emerald-50" : "bg-white"}`}><span className="text-sm text-slate-900">{employeeNameWithBoldFirstName(employee)} <span className="font-normal text-slate-500">· {employee.philHealth || "No PhilHealth number"}{employee.employerName ? ` · ${employee.employerName}` : ""}</span></span></button>; })}{accountAssignedEmployees.length === 0 && accountOtherEmployees.length === 0 && <p className="px-3 py-4 text-sm font-medium text-slate-600">No employees found.</p>}</div></div>}{/* hidden required field keeps form submission semantics */}<input type="hidden" required value={selectedEmployeeId} onChange={() => {}} /></div></div><p className="text-xs text-slate-500">Employees assigned to the selected employer are listed first; all employees remain available. The selected employee is linked to {employer?.name ?? "the selected employer"} and their existing PhilHealth number is retained.</p></div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={!selectedEmployeeId || saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Add Account"}</button></div>
      </form>
    </div>
  );
}