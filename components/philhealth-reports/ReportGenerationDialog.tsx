"use client";

import type { FormEventHandler } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Employee } from "@/components/philhealth-reports/types";
import { fullName, money, period } from "@/components/philhealth-reports/format";
import { inputClass, labelClass, months } from "@/components/philhealth-reports/constants";

type ReportGenerationDialogProps = {
  open: boolean;
  employer: { name: string | null; phic: string | null } | null;
  activeEmployees: Employee[];
  defaultPs: string;
  defaultEs: string;
  reportMonth: string;
  reportYear: string;
  reportAmountDue: number;
  saving: boolean;
  setReportMonth: (m: string) => void;
  setReportYear: (y: string) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ReportGenerationDialog({
  open,
  employer,
  activeEmployees,
  defaultPs,
  defaultEs,
  reportMonth,
  reportYear,
  reportAmountDue,
  saving,
  setReportMonth,
  setReportYear,
  onClose,
  onSubmit,
}: ReportGenerationDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={onSubmit} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold">Create Monthly Contribution Report</h2><p className="text-sm text-slate-600">{employer?.name} · {employer?.phic || "—"}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 overflow-auto p-4"><table className="w-full text-sm"><thead><tr><th className="bg-slate-100 px-3 py-2 text-left">Employee</th><th className="bg-slate-100 px-3 py-2 text-right">PS</th><th className="bg-slate-100 px-3 py-2 text-right">ES</th><th className="bg-slate-100 px-3 py-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{activeEmployees.map((employee) => <tr key={employee.id}><td className="px-3 py-2"><div className="font-medium">{fullName(employee)}</div><div className="text-xs text-slate-500">{employee.philHealth || "—"}</div></td><td className="px-3 py-2 text-right tabular-nums">{money(defaultPs)}</td><td className="px-3 py-2 text-right tabular-nums">{money(defaultEs)}</td><td className="px-3 py-2 text-right font-medium tabular-nums">{money(Number(defaultPs) + Number(defaultEs))}</td></tr>)}{!activeEmployees.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No active PhilHealth accounts are available.</td></tr>}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4"><p className="text-sm font-semibold">Amount Due: {money(reportAmountDue)}</p><div className="flex gap-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving || activeEmployees.length === 0} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Create Report"}</button></div></div>
      </form>
    </div>
  );
}