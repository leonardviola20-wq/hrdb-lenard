"use client";

import { useEffect, useRef } from "react";
import { PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ContributionEntry, ContributionProvider, ContributionReport } from "./types";
import ScrollableListTable from "@/components/ScrollableListTable";

type Provider = Exclude<ContributionProvider, "philhealth">;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function money(value: string | null | undefined) {
  const amount = Number(value);
  return value !== null && value !== undefined && Number.isFinite(amount)
    ? amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
    : "—";
}

function displayDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function splitEmployerAddress(value: string | null | undefined) {
  const address = value?.trim();
  if (!address) return ["—"];

  const midpoint = Math.floor(address.length / 2);
  const nearestSeparator = (separator: string) => [
    address.lastIndexOf(separator, midpoint),
    address.indexOf(separator, midpoint),
  ]
    .filter((index) => index > 0 && index < address.length - 1)
    .sort((left, right) => Math.abs(left - midpoint) - Math.abs(right - midpoint))[0] ?? -1;

  const commaIndex = nearestSeparator(",");
  const spaceIndex = commaIndex < 0 ? nearestSeparator(" ") : -1;
  const separatorIndex = commaIndex >= 0 ? commaIndex : spaceIndex;
  if (separatorIndex < 0) return [address];

  const splitIndex = separatorIndex + (commaIndex >= 0 ? 1 : 0);
  const lines = [address.slice(0, splitIndex).trim(), address.slice(splitIndex).trim()];
  return lines[0] && lines[1] ? lines : [address];
}

function sssContribution(entry: ContributionEntry) {
  const amount = Number(entry.employeeSs ?? 0)
    + Number(entry.employeeMpf ?? 0)
    + Number(entry.employerSs ?? 0)
    + Number(entry.employerMpf ?? 0);
  return money(amount.toFixed(2));
}

export default function ContributionProviderReportDialog({
  provider,
  report,
  onClose,
}: {
  provider: Provider;
  report: ContributionReport;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const isSss = provider === "sss";
  const title = isSss ? "SSS Contribution Report" : "PagIBIG Contribution Report";
  const identifierLabel = isSss ? "PRN Number" : "PIN";
  const identifier = isSss ? report.prn : report.pin;
  const memberNumberLabel = isSss ? "SSS Number" : "MID Number";
  const paid = Boolean(report.payDate);
  const pagibigFields = [
    ["Applicable Period", `${months[report.applicableMonth - 1] ?? "—"} ${report.applicableYear}`],
    [identifierLabel, identifier || "—"],
    ["Amount Due", money(report.amountDue)],
    ["Payment Status", paid ? "Paid" : "Unpaid"],
    ["Amount Paid", money(report.amountPaid)],
    ["Payment Date", displayDate(report.payDate)],
    ["Payment Type", report.paymentType || "—"],
    ["Transaction Reference", report.transactionReference || "—"],
  ] as const;
  const reportDetails = [
    ["PRN:", report.prn || "—"],
    ["Applicable Period:", `${months[report.applicableMonth - 1] ?? "—"} ${report.applicableYear}`],
    ["Amount Due", money(report.amountDue)],
  ] as const;
  const paymentDetails = [
    ["Trans Ref:", report.transactionReference || "—"],
    ["Paid Branch:", report.sssBranch || "—"],
    ["Pay Date:", displayDate(report.payDate)],
    ["Pay Type:", report.paymentType || "—"],
  ] as const;
  const employerAddressLines = splitEmployerAddress(report.employerAddress);

  return (
    <div
      id={isSss ? "sss-contribution-report-print-overlay" : undefined}
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
        aria-labelledby="contribution-report-dialog-title"
        className={`flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${isSss ? "sss-contribution-report-print-dialog" : ""}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="contribution-report-dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>
            {isSss ? (
              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                <p className="font-medium text-slate-800">{report.employerName}</p>
                <p className="font-mono">{report.employerSssNumber || "—"}</p>
                <p className="max-w-[42rem] break-words">
                  {employerAddressLines.map((line, index) => <span key={index} className="block">{line}</span>)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">{months[report.applicableMonth - 1] || "—"} {report.applicableYear} · {report.employerName}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            {isSss && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <PrinterIcon aria-hidden="true" className="h-4 w-4" />
                Print
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close contribution report details"
              className="shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <XMarkIcon aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className={`shrink-0 px-3 pt-3 sm:px-5 sm:pt-4 ${isSss ? "sss-contribution-report-details grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]" : "space-y-3"}`}>
          {isSss ? (
            <>
              <section aria-labelledby="sss-report-details-heading">
                <h3 id="sss-report-details-heading" className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Report Details</h3>
                <dl className="space-y-2 rounded-lg bg-slate-100 p-3 text-sm">
                  {reportDetails.map(([label, value]) => {
                    const isAmount = label === "Amount Due";
                    return (
                      <div key={label} className={`min-w-0 ${isAmount ? "border-t border-slate-200 pt-2" : "grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-baseline gap-x-3"}`}>
                        <dt className="text-xs font-medium text-slate-600">{label}</dt>
                        <dd className={`break-words text-slate-900 ${isAmount ? "mt-1 text-2xl font-bold tabular-nums" : "font-semibold"}`}>{value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
              <section aria-labelledby="sss-payment-details-heading">
                <h3 id="sss-payment-details-heading" className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Details</h3>
                <div className="sss-contribution-payment-card rounded-lg bg-slate-100 p-3 text-sm">
                  <dl className="grid grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 sm:grid-cols-[max-content_minmax(0,1fr)_max-content_minmax(0,1fr)]">
                    {paymentDetails.flatMap(([label, value]) => [
                      <dt key={`${label}-label`} className="text-xs font-medium text-slate-600">{label}</dt>,
                      <dd key={`${label}-value`} className="break-words font-semibold text-slate-900">{value}</dd>,
                    ])}
                  </dl>
                  <dl className="sss-contribution-payment-totals mt-2 grid grid-cols-2 gap-4 border-t border-slate-200 pt-2">
                    <div>
                      <dt className="text-xs font-medium text-slate-600">Amount Paid</dt>
                      <dd className="mt-1 break-words text-2xl font-bold tabular-nums text-slate-900">{money(report.amountPaid)}</dd>
                    </div>
                    <div className="sss-contribution-employee-total text-right">
                      <dt className="text-xs font-medium text-slate-600">Total Employees:</dt>
                      <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{report.entries.length}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            </>
          ) : (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-100 p-3 text-sm lg:grid-cols-4">
              {pagibigFields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-medium text-slate-600">{label}</dt>
                  <dd className="break-words font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className={`min-h-0 flex-1 p-3 sm:p-5 ${isSss ? "sss-contribution-report-print-content flex flex-col" : "flex flex-col overflow-hidden"}`}>
          <ScrollableListTable
            ariaLabel={`${provider} contribution report entries`}
            className={`${isSss ? "sss-contribution-report-table min-h-0 flex-1 pb-4 pr-4" : "max-h-[55dvh]"} rounded-lg border border-slate-200`}
            contentClassName={`${isSss ? "sss-contribution-provider-table min-w-[760px]" : "min-w-[640px]"} text-left text-sm`}
            header={
              <div role="row" className={`grid ${isSss ? "grid-cols-5" : "grid-cols-4"} text-xs font-bold uppercase tracking-wide text-slate-700`}>
                {isSss && <div role="columnheader" aria-hidden="true" className="sss-contribution-print-row-number hidden px-3 py-3 text-center print:block">#</div>}
                <div role="columnheader" className="bg-slate-100 px-3 py-3">Employee</div>
                {isSss ? (
                  <>
                    <div role="columnheader" className="bg-slate-100 px-3 py-3">SSS Number</div>
                    <div role="columnheader" className="bg-slate-100 px-3 py-3 text-center">SS</div>
                    <div role="columnheader" className="bg-slate-100 px-3 py-3 text-center">EC</div>
                  </>
                ) : (
                  <>
                    <div role="columnheader" className="bg-slate-100 px-3 py-3">Employee Code</div>
                    <div role="columnheader" className="bg-slate-100 px-3 py-3">{memberNumberLabel}</div>
                  </>
                )}
                <div role="columnheader" className="bg-slate-100 px-3 py-3 text-right">Contribution</div>
              </div>
            }
            rowsClassName="divide-y divide-slate-100"
            footer={
              <div role="row" className={`grid ${isSss ? "grid-cols-5" : "grid-cols-4"} font-bold text-slate-950`}>
                <div role="cell" className={`${isSss ? "col-span-4 print:col-span-5" : "col-span-3"} border-t-2 border-slate-300 bg-slate-50 px-3 py-3 text-left`}>Total Amount Due</div>
                <div role="cell" className="border-t-2 border-slate-300 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(report.amountDue)}</div>
              </div>
            }
          >
            {report.entries.map((entry, index) => (
              <div key={entry.id} role="row" className={`grid ${isSss ? "grid-cols-5" : "grid-cols-4"} text-slate-900`}>
                {isSss && <div role="cell" aria-hidden="true" className="sss-contribution-print-row-number hidden px-3 py-3 text-center tabular-nums print:block">{index + 1}</div>}
                <div role="cell" className="px-3 py-3 font-medium">{entry.employeeName}</div>
                {isSss ? (
                  <>
                    <div role="cell" className="px-3 py-3 tabular-nums">{entry.employeeSssNumber || "—"}</div>
                    <div role="cell" className="px-3 py-3 text-right tabular-nums">{sssContribution(entry)}</div>
                    <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(entry.ec)}</div>
                  </>
                ) : (
                  <>
                    <div role="cell" className="px-3 py-3">{entry.employeeCode || "—"}</div>
                    <div role="cell" className="px-3 py-3 tabular-nums">{entry.midNumber || "—"}</div>
                  </>
                )}
                <div role="cell" className="px-3 py-3 text-right tabular-nums">{money(entry.totalAmount)}</div>
              </div>
            ))}
            {!report.entries.length && (
              <div role="row" className={`grid ${isSss ? "grid-cols-5" : "grid-cols-4"}`}>
                <div role="cell" className={`${isSss ? "col-span-5" : "col-span-4"} px-3 py-8 text-center text-slate-600`}>No employee contributions are recorded.</div>
              </div>
            )}
          </ScrollableListTable>
        </div>
      </section>
    </div>
  );
}
