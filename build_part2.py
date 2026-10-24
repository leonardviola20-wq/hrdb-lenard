part2 = '''
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">P</span>
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
              <button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-800">{saving ? "Saving..." : "Save Payment"}</button>
            </div>
          </footer>
        </form>
      </div>
    )}
'''
open("d:/VSCode/hrdb-lenard/dialog_part2.txt","w").write(part2)
print("part2 written")

