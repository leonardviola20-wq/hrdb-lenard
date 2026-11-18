"use client";

import type { ContributionProvider, ContributionReport } from "./types";
import ScrollableListTable from "@/components/ScrollableListTable";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function money(value: string | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : "—";
}

function date(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function ContributionReportsTable({
  provider, reports, onViewReport, compactMobile = false,
}: {
  provider: ContributionProvider;
  reports: ContributionReport[];
  onViewReport: (report: ContributionReport) => void;
  compactMobile?: boolean;
}) {
  const hiddenOnMobile = compactMobile ? "hidden sm:table-cell" : "";
  const identifierHeading = provider === "sss" ? "PRN Number" : provider === "pagibig" ? "PIN" : "SPA Number";
  const rowCells = (report: ContributionReport) => {
    const period = `${months[report.applicableMonth - 1]} ${report.applicableYear}`;
    const paid = provider === "philhealth" ? Boolean(report.payment) : Boolean(report.payDate);
    const viewButton = (
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`View ${period} contribution report`}
        onClick={() => onViewReport(report)}
        className="rounded-md px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        View
      </button>
    );

    return [
      compactMobile ? (
        <>
          <span className="hidden sm:inline">{period}</span>
          <button
            type="button"
            onClick={() => onViewReport(report)}
            aria-label={`View ${period} contribution report`}
            aria-haspopup="dialog"
            className="rounded font-medium text-blue-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:hidden"
          >
            {period}
          </button>
        </>
      ) : period,
      provider === "sss" ? report.prn || "—" : provider === "pagibig" ? report.pin || "—" : report.payment?.spa || "—",
      report.entries.length,
      money(report.amountDue),
      paid ? "Paid" : "Unpaid",
      date(provider === "philhealth" ? report.payment?.transactionDate : report.payDate),
      viewButton,
    ];
  };

  if (compactMobile) {
    const headers = [
      "Applicable period",
      identifierHeading,
      "Employees",
      <>
        <span className="sm:hidden">Total</span>
        <span className="hidden sm:inline">Amount due</span>
      </>,
      "Status",
      "Pay date",
      "View",
    ];
    const headerCellClasses = [
      "px-2 py-3 sm:px-1",
      "hidden px-2 py-3 sm:block sm:px-1",
      "hidden px-2 py-3 text-right sm:block sm:px-1",
      "px-2 py-3 text-right sm:px-1",
      "hidden px-2 py-3 sm:block sm:px-1",
      "hidden px-2 py-3 sm:block sm:px-1",
      "hidden px-2 py-3 sm:block sm:px-1",
    ];
    const rowCellClasses = [
      "whitespace-nowrap px-2 py-3 font-medium sm:px-1",
      "hidden break-words px-2 py-3 font-mono sm:block sm:px-1 sm:text-xs",
      "hidden px-2 py-3 text-right tabular-nums sm:block sm:px-1",
      "whitespace-nowrap px-2 py-3 text-right tabular-nums sm:px-1",
      "hidden px-2 py-3 sm:block sm:px-1",
      "hidden whitespace-nowrap px-2 py-3 sm:block sm:px-1",
      "hidden px-2 py-3 text-right sm:block sm:px-1",
    ];

    return (
      <ScrollableListTable
        ariaLabel={`${provider} contribution reports`}
        className="max-h-[28rem] w-full text-left text-sm"
        contentClassName="w-full min-w-full sm:min-w-[720px] lg:min-w-0"
        header={
          <div role="row" className="grid grid-cols-2 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 sm:grid-cols-7">
            {headers.map((header, index) => (
              <div key={index} role="columnheader" className={headerCellClasses[index]}>{header}</div>
            ))}
          </div>
        }
        rowsClassName="divide-y divide-slate-100 max-h-[calc(28rem-3.5rem)] sm:max-h-[calc(28rem-5rem)] lg:max-h-[calc(28rem-3.5rem)]"
      >
        {reports.map((report) => (
          <div key={report.id} role="row" className="grid grid-cols-2 text-slate-700 sm:grid-cols-7">
            {rowCells(report).map((cell, index) => (
              <div key={index} role="cell" className={rowCellClasses[index]}>{cell}</div>
            ))}
          </div>
        ))}
      </ScrollableListTable>
    );
  }

  const tableCellClasses = [
    "whitespace-nowrap px-4 py-3 font-medium",
    `${hiddenOnMobile} px-4 py-3`,
    `${hiddenOnMobile} px-4 py-3 text-right tabular-nums`,
    "whitespace-nowrap px-4 py-3 text-right tabular-nums",
    `${hiddenOnMobile} px-4 py-3`,
    `${hiddenOnMobile} whitespace-nowrap px-4 py-3`,
    `${hiddenOnMobile} px-4 py-3 text-right`,
  ];

  return (
    <ScrollableListTable
      ariaLabel={`${provider} contribution reports`}
      className={`w-full text-left text-sm ${provider === "philhealth" ? "max-h-[60dvh]" : ""}`}
      contentClassName="min-w-[720px]"
      header={
        <div role="row" className="grid grid-cols-7 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          {[
            "Applicable period",
            identifierHeading,
            "Employees",
            "Amount due",
            "Status",
            "Pay date",
            "View",
          ].map((header, index) => (
            <div key={header} role="columnheader" className={`${tableCellClasses[index]} bg-slate-50`}>{header}</div>
          ))}
        </div>
      }
      rowsClassName="divide-y divide-slate-100"
    >
      {reports.map((report) => (
        <div key={report.id} role="row" className="grid grid-cols-7 text-slate-700">
          {rowCells(report).map((cell, index) => (
            <div key={index} role="cell" className={tableCellClasses[index]}>{cell}</div>
          ))}
        </div>
      ))}
    </ScrollableListTable>
  );
}
