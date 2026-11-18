"use client";

import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { money, period } from "@/lib/philHealthReportHelpers";
import ContributionReportEntriesTable from "./ContributionReportEntriesTable";

type ReportEntry = {
  id: number;
  employeeName: string;
  employeePhilHealthNumber?: string | null;
  amount?: string;
};
type Payment = {
  payorName: string;
  spa?: string | null;
  applicablePeriod?: string;
  amountPaid: string;
  accreditedCollectingAgent?: string | null;
  transactionConfirmationNumber?: string | null;
  transactionDate: string;
  eparNumber?: string | null;
  eparDate?: string | null;
};
type Report = {
  employerName: string;
  applicableMonth: number;
  applicableYear: number;
  entries: ReportEntry[];
  payment?: Payment | null;
};

function displayDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function ContributionReportDialog({ report, onClose }: { report: Report; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const payment = report.payment;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const rows = report.entries.map((entry) => {
    const amountCents = Math.max(0, Math.round(Number(entry.amount ?? 0) * 100));
    const psCents = Math.floor(amountCents / 2);
    return { ...entry, amountCents, psCents, esCents: amountCents - psCents };
  });
  const psTotalCents = rows.reduce((total, row) => total + row.psCents, 0);
  const esTotalCents = rows.reduce((total, row) => total + row.esCents, 0);
  const totalCents = psTotalCents + esTotalCents;
  const paymentFields = [
    ["Payor Name", payment?.payorName || report.employerName],
    ["SPA No.", payment?.spa],
    ["Applicable Period", payment?.applicablePeriod || period(report)],
    ["Actual Amount Paid", payment ? money(payment.amountPaid) : null],
    ["Accredited Collecting Agent", payment?.accreditedCollectingAgent],
    ["Transaction Confirmation No.", payment?.transactionConfirmationNumber],
    ["Transaction Date", displayDate(payment?.transactionDate)],
    ["ePar No.", payment?.eparNumber],
    ["ePar Date", displayDate(payment?.eparDate)],
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        } else if (event.key === "Tab") {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="philhealth-contribution-dialog-title"
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="philhealth-contribution-dialog-title" className="text-lg font-bold text-slate-900">PhilHealth Contribution Report</h2>
            <p className="text-sm text-slate-600">{period(report)} · {report.employerName}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close PhilHealth contribution details"
            className="shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="shrink-0 px-3 pt-3 sm:px-5 sm:pt-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-100 p-3 text-sm lg:grid-cols-3">
            {paymentFields.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs font-medium text-slate-600">{label}</dt>
                <dd className="break-words font-semibold text-slate-900">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-2 sm:px-5 sm:pb-5">
          <ContributionReportEntriesTable rows={rows} psTotalCents={psTotalCents} esTotalCents={esTotalCents} totalCents={totalCents} />
        </div>
      </section>
    </div>
  );
}
