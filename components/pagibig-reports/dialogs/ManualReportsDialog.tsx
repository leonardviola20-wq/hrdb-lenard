import { XMarkIcon } from "@heroicons/react/24/outline";
import { monthNames } from '@/components/pagibig-reports/shared/constants';
import { formatMoney } from '@/components/pagibig-reports/shared/format';
import type { Report } from '@/components/pagibig-reports/shared/types';

export function ManualReportsDialog({
  reports,
  canEditPayments,
  onClose,
  onViewDetails,
  onOpenPayment,
}: {
  reports: Report[];
  canEditPayments: boolean;
  onClose: () => void;
  onViewDetails: (report: Report) => void;
  onOpenPayment: (report: Report) => void;
}) {
  const [first] = reports;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manual Reports - {first ? `${monthNames[first.applicableMonth - 1]} ${first.applicableYear}` : ""}</h2>
            <p className="text-xs text-slate-600">{first?.employerName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
        </header>
        <div className="max-h-[70vh] space-y-4 overflow-auto p-5">
          {reports.map((report) => {
            const paid = report.amountPaid !== null && report.payDate !== null;
            return (
              <div key={report.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{report.kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Manual Report</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{paid ? "Paid" : "Unpaid"}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p className="font-semibold text-slate-500">Invoice No.</p>
                  <p className="font-bold text-slate-900">{report.pin}</p>
                  <p className="font-semibold text-slate-500">Amount Due</p>
                  <p className="font-bold text-slate-900">{formatMoney(report.amountDue)}</p>
                  <p className="font-semibold text-slate-500">Members</p>
                  <p className="font-bold text-slate-900">{report.entries.length}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onViewDetails(report)} className="h-9 rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50">View Details</button>
                  {(!paid || canEditPayments) && <button type="button" onClick={() => onOpenPayment(report)} className="h-9 rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800">{paid ? "Update Payment" : "Record Payment"}</button>}
                </div>
              </div>
            );
          })}
        </div>
        <footer className="flex justify-end border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </footer>
      </section>
    </div>
  );
}
