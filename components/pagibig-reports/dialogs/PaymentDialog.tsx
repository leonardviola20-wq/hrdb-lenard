"use client";

import type { FormEvent } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { inputClass, labelClass, monthNames, paymentTypes } from '@/components/pagibig-reports/shared/constants';
import { formatMoney } from '@/components/pagibig-reports/shared/format';
import { MoneyInput } from '@/components/pagibig-reports/shared/MoneyInput';
import type { PaymentForm, Report } from '@/components/pagibig-reports/shared/types';

type Props = {
  report: Report | null;
  reports: Report[];
  paymentForm: PaymentForm;
  setPaymentForm: (updater: (current: PaymentForm) => PaymentForm) => void;
  savingPayment: boolean;
  paymentError: string;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  openPayment: (report: Report) => void;
};

export function PaymentDialog({ report, reports, paymentForm, setPaymentForm, savingPayment, paymentError, onClose, onSave, openPayment }: Props) {
  if (!report) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <form onSubmit={onSave} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment Details</h2>
            <p className="text-xs text-slate-600">{monthNames[report.applicableMonth - 1]} {report.applicableYear} · Amount Due {formatMoney(report.amountDue)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {report.manual ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelClass}>Report Type</span>
              <select value={report.id} onChange={(event) => { const selected = reports.find((item) => item.id === Number(event.target.value)); if (selected) openPayment(selected); }} className={inputClass}>
                {reports.filter((item) => item.manual && item.employerId === report.employerId && item.applicableMonth === report.applicableMonth && item.applicableYear === report.applicableYear).map((item) => <option key={item.id} value={item.id}>{item.kind === "CONTRIBUTION" ? "Contribution" : "Loan"}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Invoice No.</span>
              <input readOnly value={report.pin} className={inputClass} />
            </label>
            <label>
              <span className={labelClass}>Pay Date</span>
              <input required type="date" value={paymentForm.payDate} onChange={(event) => setPaymentForm((current) => (current ? { ...current, payDate: event.target.value } : current))} className={inputClass} />
            </label>
            <label>
              <span className={labelClass}>Bank</span>
              <select value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => (current ? { ...current, paymentType: event.target.value } : current))} className={inputClass}>
                {paymentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <MoneyInput label="Amount Paid" value={paymentForm.amountPaid} onChange={(value) => setPaymentForm((current) => (current ? { ...current, amountPaid: value } : current))} />
            <MoneyInput label="Adjustments" value={paymentForm.adjustments} onChange={(value) => setPaymentForm((current) => (current ? { ...current, adjustments: value } : current))} />
            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold">
              Total: {formatMoney(Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0))}
            </div>
            {paymentError && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentError}</p>}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <MoneyInput label="Amount Paid" value={paymentForm.amountPaid} onChange={(value) => setPaymentForm((current) => ({ ...current, amountPaid: value }))} />
            <label>
              <span className={labelClass}>Payment Type</span>
              <select value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentType: event.target.value }))} className={inputClass}>
                {paymentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Pay Date</span>
              <input required type="date" value={paymentForm.payDate} onChange={(event) => setPaymentForm((current) => ({ ...current, payDate: event.target.value }))} className={inputClass} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Transaction Reference</span>
              <input required maxLength={120} value={paymentForm.transactionReference} onChange={(event) => setPaymentForm((current) => ({ ...current, transactionReference: event.target.value }))} className={inputClass} />
            </label>
            {paymentError && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentError}</p>}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
          <button disabled={savingPayment} className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">
            {savingPayment ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

