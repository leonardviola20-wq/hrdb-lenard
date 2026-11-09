"use client";

import { useState } from "react";
import { SSS_AVAILABLE_YEARS, sssContributionTableForYear } from "@/lib/sssContributionTable";
import { Modal } from "./Modal";
import { DeleteConfirmDialog } from "./ReportsTables";
import { formatMoney, monthNames, paymentTypes } from "./format";
import { AmountPaidInput, Field } from "./SmallComponents";
import { inputClass } from "./constants";
import type { PaymentFormState, Report } from "./types";

export function ReportDeleteDialog({
  target, saving, error, onCancel, onConfirm,
}: {
  target: Report | null;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  return <Modal title="Delete SSS Report?" subtitle="This action cannot be undone." onClose={onCancel}>
    <DeleteConfirmDialog
      message={<>Delete the <strong>{target.kind === "LOAN" ? "loan" : "contribution"}</strong> report for <strong>{target.employerName}</strong> covering <strong>{monthNames[target.applicableMonth - 1]} {target.applicableYear}</strong> (PRN <strong>{target.prn}</strong>)? Its {target.entries.length} employee {target.entries.length === 1 ? "entry" : "entries"} and any recorded payment details will also be removed. Saved drafts are not affected.</>}
      error={error}
      saving={saving}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Delete Report"
    />
  </Modal>;
}

export function PaymentDialog({
  report, paymentForm, setPaymentForm, saving, error, onSubmit, onClose,
}: {
  report: Report;
  paymentForm: PaymentFormState;
  setPaymentForm: (updater: (current: PaymentFormState) => PaymentFormState) => void;
  saving: boolean;
  error: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return <Modal title="Record Payment" subtitle="Enter these details after the SSS payment has been made." onClose={onClose}>
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{report.employerName}</p><p className="mt-1 text-slate-500">Amount Due: {formatMoney(report.amountDue)} · {monthNames[report.applicableMonth - 1]} {report.applicableYear}</p></div>
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Amount Paid" required><AmountPaidInput value={paymentForm.amountPaid} onChange={(value) => setPaymentForm((current) => ({ ...current, amountPaid: value }))} /></Field>
      <Field label="Payment Type" required><select required value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentType: event.target.value }))} className={inputClass}><option value="">Select payment type</option>{paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
      <Field label="Pay Date" required><input required type="date" value={paymentForm.payDate} onChange={(event) => setPaymentForm((current) => ({ ...current, payDate: event.target.value }))} className={inputClass} /></Field>
      <Field label="SSS Branch" required><input required value={paymentForm.sssBranch} onChange={(event) => setPaymentForm((current) => ({ ...current, sssBranch: event.target.value }))} className={inputClass} placeholder="Branch where payment was made" /></Field>
      <Field label="Transaction Reference" required><input required value={paymentForm.transactionReference} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionReference: event.target.value }))} className={inputClass} /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Payment"}</button></div>
    </form>
  </Modal>;
}

export function ContributionTableDialog({ onClose, year }: { onClose: () => void; year: number }) {
  const [selectedYear, setSelectedYear] = useState(
    SSS_AVAILABLE_YEARS.includes(year) ? year : SSS_AVAILABLE_YEARS[SSS_AVAILABLE_YEARS.length - 1],
  );
  const table = sssContributionTableForYear(selectedYear);
  const caption = `Business employers and employees — Effective January 1, ${selectedYear}`;
  return (
    <Modal title="SSS Contribution Table" subtitle={caption} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {SSS_AVAILABLE_YEARS.map((availableYear) => (
          <button
            key={availableYear}
            type="button"
            onClick={() => setSelectedYear(availableYear)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${selectedYear === availableYear ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {availableYear}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200"><table className="min-w-[1050px] w-full text-right text-xs text-slate-800"><thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2.5 text-left">Compensation Range</th><th className="px-3 py-2.5">MSC</th><th className="px-3 py-2.5">SS ER</th><th className="px-3 py-2.5">MPF ER</th><th className="px-3 py-2.5">EC ER</th><th className="px-3 py-2.5">ER Total</th><th className="px-3 py-2.5">SS EE</th><th className="px-3 py-2.5">MPF EE</th><th className="px-3 py-2.5">EE Total</th><th className="px-3 py-2.5">Combined</th></tr></thead><tbody className="divide-y divide-slate-100">{table.map((row) => <tr key={row.key} className={row.monthlySalaryCredit > 20_000 ? "bg-blue-50/50" : "bg-white"}><td className="px-3 py-2 text-left">{row.range}</td><td className="px-3 py-2">{formatMoney(row.monthlySalaryCredit)}</td><td className="px-3 py-2">{formatMoney(row.employerSs)}</td><td className="px-3 py-2">{formatMoney(row.employerMpf)}</td><td className="px-3 py-2">{formatMoney(row.ec)}</td><td className="px-3 py-2 font-semibold">{formatMoney(row.employerSs + row.employerMpf + row.ec)}</td><td className="px-3 py-2">{formatMoney(row.employeeSs)}</td><td className="px-3 py-2">{formatMoney(row.employeeMpf)}</td><td className="px-3 py-2 font-semibold">{formatMoney(row.employeeSs + row.employeeMpf)}</td><td className="px-3 py-2 font-bold text-slate-900">{formatMoney(row.total)}</td></tr>)}</tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onClose} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Done reviewing</button></div>
    </Modal>
  );
}
