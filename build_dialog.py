p="d:/VSCode/hrdb-lenard/components/PhilHealthReportsPage.tsx"
s=open(p).read()
start=s.find("{paymentReport && paymentForm")
end=s.find("{deleteReportTarget &&")
old=s[start:end]

part1 = '''{paymentReport && paymentForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) { setPaymentReport(null); setPaymentForm(null); } }}>
        <form onSubmit={savePayment} className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{paymentReport.payment ? "PhilHealth Payment Details" : "Record PhilHealth Payment"}</h2>
              <p className="text-sm text-slate-600">{period(paymentReport)} · Amount Due {money(paymentReport.amountDue)}</p>
            </div>
            <button type="button" onClick={() => { setPaymentReport(null); setPaymentForm(null); }} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="grid gap-6">
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Employer & Period</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Employer Name</label>
                    <input readOnly type="text" value={paymentForm.payorName} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                  <div>
                    <label className={labelClass}>PhilHealth Number</label>
                    <input readOnly type="text" value={paymentForm.pen} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                  <div>
                    <label className={labelClass}>SPA</label>
                    <input type="text" value={paymentForm.spa} onChange={(event) => setPaymentForm((current) => current ? { ...current, spa: event.target.value } : current)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Applicable Period</label>
                    <input readOnly type="text" value={paymentForm.applicablePeriod} className={`${inputClass} bg-slate-100 text-slate-600`} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Payment Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">P</span>
                      <input readOnly type="text" value={paymentForm.amountPaid} className={`${inputClass} bg-slate-100 pl-8 text-slate-600`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Accredited Collecting Agent</label>
                    <input type="text" value={paymentForm.accreditedCollectingAgent} onChange={(event) => setPaymentForm((current) => current ? { ...current, accreditedCollectingAgent: event.target.value } : current)} className={inputClass} />
                  </div>
'''
# write part1 to temp
open("d:/VSCode/hrdb-lenard/dialog_part1.txt","w").write(part1)
print("part1 written")
