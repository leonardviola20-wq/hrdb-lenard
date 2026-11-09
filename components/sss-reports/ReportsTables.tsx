"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getSssContributionBracketForYear } from "@/lib/sssContributionTable";
import { Info, MoneyInput } from "./SmallComponents";
import { formatMoney, monthEnd, monthNames } from "./format";
import type { DraftEntry, DraftFormState, Employer, PaymentKind, Report, SssReportDraft } from "./types";

export function DraftsMenu({
  visibleReportDrafts, draftMenuOpen, setDraftMenuOpen, kind, employers, saving, resumeReportDraft, deleteReportDraft,
}: {
  visibleReportDrafts: SssReportDraft[];
  draftMenuOpen: boolean;
  setDraftMenuOpen: (open: boolean) => void;
  kind: PaymentKind;
  employers: Employer[];
  saving: boolean;
  resumeReportDraft: (draft: SssReportDraft) => void;
  deleteReportDraft: (draft: SssReportDraft) => void;
}) {
  const draftMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!draftMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !draftMenuRef.current?.contains(event.target)) setDraftMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraftMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [draftMenuOpen, setDraftMenuOpen]);
  return (
    <div ref={draftMenuRef} className="relative">
      <button type="button" aria-expanded={draftMenuOpen} aria-controls="sss-drafts-menu" onClick={() => setDraftMenuOpen(!draftMenuOpen)} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${visibleReportDrafts.length ? "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
        Drafts
        <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${visibleReportDrafts.length ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700"}`}>{visibleReportDrafts.length}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${draftMenuOpen ? "rotate-180" : ""}`} />
      </button>
      {draftMenuOpen && <div id="sss-drafts-menu" className="absolute right-0 z-30 mt-2 max-h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-amber-200 bg-white shadow-xl">
        <div className="sticky top-0 border-b border-amber-100 bg-amber-50 px-4 py-3">
          <h2 className="font-bold text-slate-900">Saved Drafts</h2>
          <p className="mt-0.5 text-xs text-slate-600">Select a {kind === "CONTRIBUTION" ? "contribution" : "loan"} draft to continue.</p>
        </div>
        {visibleReportDrafts.length ? <ul className="divide-y divide-slate-100">{visibleReportDrafts.map((savedDraft) => <li key={savedDraft.id} className="flex items-start gap-3 px-4 py-3">
          <button type="button" disabled={saving} onClick={() => void resumeReportDraft(savedDraft)} className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <span className="block truncate text-sm font-semibold text-slate-800">{employers.find((employer) => employer.id === savedDraft.employerId)?.name || "Employer not selected"}</span>
            <span className="mt-1 block text-xs text-slate-600">{savedDraft.prn ? `PRN ${savedDraft.prn} · ` : ""}{monthNames[savedDraft.applicableMonth - 1]} {savedDraft.applicableYear} · {savedDraft.entries.length} {savedDraft.kind === "LOAN" ? `loan account${savedDraft.entries.length === 1 ? "" : "s"}` : `employee${savedDraft.entries.length === 1 ? "" : "s"}`}</span>
            <span className="mt-1 block text-[11px] text-slate-500">Updated {new Date(savedDraft.updatedAt).toLocaleString()}</span>
          </button>
          <button type="button" disabled={saving} onClick={() => void deleteReportDraft(savedDraft)} className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"><TrashIcon className="h-3.5 w-3.5" /></button>
        </li>)}</ul> : <p className="px-4 py-6 text-center text-sm text-slate-500">No saved drafts for this report type.</p>}
      </div>}
    </div>
  );
}

export function EntriesTable({
  kind, draftYear, entries, employeeTotal, updateLoanEntry, removeEntry, setRangePickerTarget,
}: {
  kind: PaymentKind;
  draftYear: string;
  entries: DraftEntry[];
  employeeTotal: (entry: DraftEntry, year: number) => number;
  updateLoanEntry: (sssLoanId: number, changes: Partial<DraftEntry>) => void;
  removeEntry: (index: number, entry: DraftEntry) => void;
  setRangePickerTarget: (target: number) => void;
}) {
  const bracketFor = (msc: number | null) => (msc ? getSssContributionBracketForYear(Number(draftYear), msc) : null);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <table className="w-full table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 bg-white text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="break-words w-[5%] px-1.5 py-3 text-center font-semibold">#</th><th className={`${kind === "CONTRIBUTION" ? "w-[25%]" : "w-[19%]"} break-words px-2 py-2 font-semibold`}>Name</th>{kind === "CONTRIBUTION" ? <><th className="break-words w-[14%] px-1.5 py-2 font-semibold">SS Number</th><th className="break-words w-[18%] px-1.5 py-2 font-semibold">MSC</th><th className="break-words w-[11%] px-1.5 py-2 text-right font-semibold">SS</th><th className="break-words w-[8%] px-1.5 py-2 text-right font-semibold">EC</th><th className="break-words w-[14%] px-1.5 py-2 text-right font-semibold">Total Contribution</th></> : <><th className="break-words w-[16%] px-1.5 py-2 font-semibold">SS Number</th><th className="break-words w-[23%] px-1.5 py-2 font-semibold">Loan Account Number</th><th className="break-words w-[23%] px-1.5 py-2 font-semibold">Loan Amount Due</th><th className="break-words w-[14%] px-1.5 py-2 text-right font-semibold">Total</th></>}<th className="break-words w-[4%] px-1 py-3"><span className="sr-only">Remove</span></th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry, index) => {
            const bracket = bracketFor(entry.monthlySalaryCredit);
            return <tr key={kind === "LOAN" ? entry.sssLoanId ?? `${entry.employeeId}-${index}` : entry.employeeId}>
              <td className="px-1.5 py-2 text-center font-medium text-slate-600">{index + 1}</td>
              <td className="px-2 py-2"><span className="font-semibold text-slate-800">{entry.employeeName}</span></td>
              {kind === "CONTRIBUTION" ? <><td className="px-1.5 py-2 font-mono text-slate-700">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2"><button type="button" aria-label={`Choose compensation range for ${entry.employeeName}`} onClick={() => setRangePickerTarget(entry.employeeId)} className="flex h-9 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-slate-300 bg-white px-1.5 text-left text-xs font-semibold text-slate-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"><span className="min-w-0 break-words">{bracket ? formatMoney(bracket.monthlySalaryCredit) : "Select range"}</span><ChevronDownIcon className="h-3 w-3 shrink-0 text-slate-600" /></button></td><td className="px-1.5 py-2 text-right font-semibold text-slate-900">{bracket ? formatMoney(bracket.employerSs + bracket.employerMpf + bracket.employeeSs + bracket.employeeMpf) : "—"}</td><td className="px-1.5 py-2 text-right font-medium text-slate-900">{bracket ? formatMoney(bracket.ec) : "—"}</td><td className="px-1.5 py-2 text-right font-bold text-slate-950">{bracket ? formatMoney(bracket.total) : "—"}</td></> : <><td className="px-1.5 py-2 font-mono text-slate-700">{entry.employeeSssNumber || "—"}</td><td className="px-1.5 py-2 font-mono text-slate-700">{entry.loanAccountNumber || "—"}</td><td className="px-1.5 py-2"><MoneyInput value={entry.loanAmount} disabled={!entry.sssLoanId} onChange={(value) => entry.sssLoanId != null && updateLoanEntry(entry.sssLoanId, { loanAmount: value })} /></td><td className="px-1.5 py-2 text-right font-bold text-slate-800">{employeeTotal(entry, Number(draftYear)) ? formatMoney(employeeTotal(entry, Number(draftYear))) : "—"}</td></>}
              <td className="px-2 py-2"><button type="button" onClick={() => removeEntry(index, entry)} aria-label={`Remove ${entry.employeeName}${kind === "LOAN" ? ` loan ${entry.loanAccountNumber ?? ""}` : ""}`} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><XMarkIcon className="h-4 w-4" /></button></td>
            </tr>;
          })}
          {entries.length === 0 && <tr><td colSpan={kind === "CONTRIBUTION" ? 8 : 7} className="px-4 py-8 text-center text-sm text-slate-400">Select an employer, then add employee entries.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPreview({
  kind, employer, draft, entries, year,
}: {
  kind: PaymentKind;
  employer: Employer | null;
  draft: DraftFormState;
  entries: DraftEntry[];
  year: number;
}) {
  const employerLabel = employer?.name || "Employer not selected";
  return <div className="space-y-5 rounded-xl border border-slate-200 p-4 sm:p-6">
    <div className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">SSS {kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report</p><h3 className="mt-1 text-xl font-bold text-slate-900">{employerLabel}</h3><p className="mt-1 text-sm text-slate-600">{employer?.longAddress || employer?.shortAddress || "Address not set"}</p><p className="text-sm text-slate-600">Employer SSS Number: {employer?.sss || "Not set"}</p></div><div className="text-sm text-slate-700 sm:text-right"><p><span className="text-slate-500">PRN:</span> <span className="font-mono font-semibold text-slate-900">{draft.prn}</span></p><p className="mt-1"><span className="text-slate-500">Applicable Period:</span> <strong className="text-slate-900">{monthNames[Number(draft.month) - 1]} {draft.year}</strong></p><p className="mt-1 text-slate-600">Applicable date: {monthEnd(Number(draft.month), Number(draft.year))}</p></div></div>
    <div className="overflow-x-auto"><table className="min-w-[940px] w-full text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-3 py-2.5 text-center">#</th><th className="px-3 py-2.5">Name</th>{kind === "CONTRIBUTION" ? <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5 text-right">SS</th><th className="px-3 py-2.5 text-right">EC</th><th className="px-3 py-2.5 text-right">Total Contribution</th></> : <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5 text-right">Loan Amount Due</th><th className="px-3 py-2.5 text-right">Total</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry, index) => { const bracket = getSssContributionBracketForYear(year, Number(entry.monthlySalaryCredit)); const ss = bracket ? bracket.employerSs + bracket.employerMpf + bracket.employeeSs + bracket.employeeMpf : 0; return <tr key={kind === "LOAN" ? entry.sssLoanId ?? `${entry.employeeId}-${index}` : entry.employeeId}><td className="px-3 py-2.5 text-center text-slate-600">{index + 1}</td><td className="px-3 py-2.5 font-medium text-slate-800">{entry.employeeName}</td>{kind === "CONTRIBUTION" ? <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{bracket ? formatMoney(bracket.monthlySalaryCredit) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{bracket ? formatMoney(ss) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{bracket ? formatMoney(bracket.ec) : "—"}</td><td className="px-3 py-2.5 text-right font-bold text-slate-950">{bracket ? formatMoney(ss + bracket.ec) : "—"}</td></> : <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatMoney(entry.loanAmount)}</td><td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatMoney(entry.loanAmount)}</td></>}</tr>; })}</tbody></table></div>
    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_-8px_16px_-12px_rgba(15,23,42,0.35)] backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6"><span>Employee Count: <strong className="text-slate-950">{entries.length}</strong></span><span>Generated Amount Due: <strong className="text-slate-950">{formatMoney(draft.amountDue)}</strong></span></div>
  </div>;
}

export function ReportSavedView({ report }: { report: Report }) {
  const employerLabel = report.employerName;
  return <div className="space-y-5">
    <div className="grid gap-6 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
      <div className="grid content-start gap-x-8 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><p className="text-base font-semibold leading-snug text-slate-900">{employerLabel}</p><p className="text-sm leading-relaxed text-slate-700">{report.employerAddress || "?"}</p><p className="font-mono text-sm text-slate-700">{report.employerSssNumber || "?"}</p></div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2"><Info label="PRN:" value={report.prn} /><Info label="Applicable Date:" value={monthEnd(report.applicableMonth, report.applicableYear)} /></div>
      </div>
      <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Payment Details</h3>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Info label="Trans Ref#" value={report.transactionReference} />
          <Info label="Pay Date" value={report.payDate} />
          <Info label="Branch" value={report.sssBranch} />
          <Info label="Pay Type" value={report.paymentType} />
        </div>
      </div>
      <div className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <div><p className="text-xs font-semibold text-slate-500">Amount Due:</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{formatMoney(report.amountDue)}</p></div>
        <div className="border-slate-200 sm:border-l sm:pl-5 lg:pl-6"><p className="text-xs font-semibold text-slate-500">Amount Paid:</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{report.amountPaid ? formatMoney(report.amountPaid) : "Not entered"}</p></div>
      </div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[940px] w-full text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-3 py-2.5 text-center">#</th><th className="px-3 py-2.5">Name</th>{report.kind === "CONTRIBUTION" ? <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5 text-right">SS</th><th className="px-3 py-2.5 text-right">EC</th><th className="px-3 py-2.5 text-right">Total Contribution</th></> : <><th className="px-3 py-2.5">SS Number</th><th className="px-3 py-2.5 text-right">Loan Amount Due</th><th className="px-3 py-2.5 text-right">Total</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{report.entries.map((entry, index) => { const ss = Number(entry.employerSs) + Number(entry.employerMpf) + Number(entry.employeeSs) + Number(entry.employeeMpf); return <tr key={entry.id}><td className="px-3 py-2.5 text-center text-slate-600">{index + 1}</td><td className="px-3 py-2.5 font-medium text-slate-800">{entry.employeeName}</td>{report.kind === "CONTRIBUTION" ? <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{entry.monthlySalaryCredit ? formatMoney(entry.monthlySalaryCredit) : "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{formatMoney(ss)}</td><td className="px-3 py-2.5 text-right font-medium text-slate-900">{formatMoney(entry.ec)}</td><td className="px-3 py-2.5 text-right font-bold text-slate-950">{formatMoney(ss + Number(entry.ec))}</td></> : <><td className="px-3 py-2.5 font-mono text-slate-800">{entry.employeeSssNumber || "—"}</td><td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatMoney(entry.loanAmount)}</td><td className="px-3 py-2.5 text-right font-semibold text-slate-900">{formatMoney(entry.totalAmount)}</td></>}</tr>; })}</tbody></table></div>
  </div>;
}

export function DeleteConfirmDialog({
  message, error, saving, onCancel, onConfirm, confirmLabel,
}: {
  message?: React.ReactNode;
  error?: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return <div>
    <p className="text-sm leading-relaxed text-slate-700">{message}</p>
    {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={onConfirm} disabled={saving} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Deleting..." : confirmLabel}</button></div>
  </div>;
}

export function ReportMetaLine({ report }: { report: Report }) {
  const name = report.creator?.name?.trim() || report.creator?.email || "Unknown";
  const formatted = report.createdAt
    ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(report.createdAt))
    : "—";
  return <p>Added by {name} · {formatted}</p>;
}
