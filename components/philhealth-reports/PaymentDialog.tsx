"use client";

import type { FormEventHandler } from "react";
import { BanknotesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { PaymentForm, Report } from "@/components/philhealth-reports/types";
import { money, period } from "@/components/philhealth-reports/format";
import { inputClass, labelClass } from "@/components/philhealth-reports/constants";

type PaymentDialogProps = {
  open: boolean;
  paymentReport: Report | null;
  paymentForm: PaymentForm | null;
  setPaymentForm: (form: PaymentForm | ((prev: PaymentForm | null) => PaymentForm | null)) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function PaymentDialog({
  open,
  paymentReport,
  paymentForm,
  setPaymentForm,
  saving,
  onClose,
  onSubmit,
}: PaymentDialogProps) {
  if (!open || !paymentReport || !paymentForm) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={onSubmit} className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-6">
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Payment Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Amount Paid</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₱</span>
                    <input readOnly type="text" value={paymentForm.amountPaid} className={`${inputClass} bg-slate-100 pl-8 text-slate-600`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Accredited Collecting Agent</label>
                  <input type="text" value={paymentForm.accreditedCollectingAgent} onChange={(event) => setPaymentForm((current) => current ? { ...current, accreditedCollectingAgent: event.target.value } : current)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Transaction Confirmation No.</label>
                  <input type="text" value={paymentForm.transactionConfirmationNumber} onChange={(event) => setPaymentForm((current) => current ? { ...current, transactionConfirmationNumber: event.target.value } : current)} className={inputClass} />
                </div>
                <div>
                  <label className="flex items-center gap-1">
                    <span className={labelClass}>Transaction Date</span>
                    <span className="text-xs text-rose-500" aria-hidden="true">*</span>
                  </label>
                  <input required type="date" value={paymentForm.transactionDate} onChange={(event) => setPaymentForm((current) => current ? { ...current, transactionDate: event.target.value } : current)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ePAR No.</label>
                  <input type="text" value={paymentForm.eparNumber} onChange={(event) => setPaymentForm((current) => current ? { ...current, eparNumber: event.target.value } : current)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ePAR Date</label>
                  <input type="date" value={paymentForm.eparDate} onChange={(event) => setPaymentForm((current) => current ? { ...current, eparDate: event.target.value } : current)} className={inputClass} />
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Adjustments</h3>
                  <label className={labelClass}>Penalties and adjustments</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₱</span>
                    <input type="number" min="0" max="999999999.99" step="0.01" value={paymentForm.adjustments} onChange={(event) => setPaymentForm((current) => current ? { ...current, adjustments: event.target.value } : current)} className={`${inputClass} pl-8`} placeholder="0.00" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Totals</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Amount Paid</span>
                    <span className="tabular-nums">{money(paymentForm.amountPaid)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Penalties and adjustments</span>
                    <span className="tabular-nums">{money(paymentForm.adjustments || 0)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">{money(Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0))}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <span className="text-xs text-slate-500">* Required field</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-800">{saving ? "Saving..." : "Save Payment"}</button>
            </div>
          </footer>
        </form>
      </div>
  );
}