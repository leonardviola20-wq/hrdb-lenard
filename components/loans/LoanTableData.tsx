"use client";

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { LoanRow } from "@/app/actions/loans";
import ScrollableListTable from "@/components/ScrollableListTable";
import { loanStatusLabels, loanStatusStyles, peso } from "./shared/format";
import LoanActionsMenu from "./LoanActionsMenu";

type Props = {
  provider: LoanRow["provider"];
  loans: LoanRow[];
  filtered: LoanRow[];
  belowToolbarContent?: ReactNode;
  onEdit: (loan: LoanRow) => void;
  onDelete: (loan: LoanRow) => void;
};

export default function LoanTableData({
  provider,
  loans,
  filtered,
  belowToolbarContent,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className={`min-w-0 ${provider === "SSS" ? "flex min-h-0 flex-1 flex-col" : "lg:flex lg:min-h-[calc(100dvh-344px)] lg:flex-col"}`}>
      {belowToolbarContent ?? (
        <div className={`min-w-0 ${provider === "SSS" ? "flex min-h-0 flex-1 flex-col" : "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"}`}>
          {loans.length === 0 ? (
            <p role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-700">
              No loans recorded yet.
            </p>
          ) : (
            <ScrollableListTable
              ariaLabel={`${provider} loans`}
              className={`rounded-xl border border-slate-200 bg-white shadow-sm ${provider === "SSS" ? "min-h-0 flex-1" : "lg:min-h-0 lg:flex-1"}`}
              contentClassName={`text-left text-sm ${provider === "SSS" ? "min-w-[1020px]" : "min-w-[1200px]"}`}
              header={
                <div role="row" className={`grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700 ${provider === "SSS" ? "grid-cols-[23fr_17fr_18fr_15fr_15fr_12fr]" : "grid-cols-[minmax(220px,2fr)_0.8fr_1.2fr_1.3fr_0.8fr_1fr_1fr_1fr_1.3fr_0.8fr]"}`}>
                  <div role="columnheader" className="px-4 py-3">Employee</div>
                  {provider !== "SSS" && <div role="columnheader" className="px-4 py-3">Provider</div>}
                  <div role="columnheader" className="px-4 py-3">Loan Type</div>
                  <div role="columnheader" className="px-4 py-3">Account No.</div>
                  <div role="columnheader" className="px-4 py-3">Date</div>
                  {provider !== "SSS" && <div role="columnheader" className="px-4 py-3 text-right">Amount</div>}
                  <div role="columnheader" className="px-4 py-3 text-right">Monthly</div>
                  {provider !== "SSS" && <div role="columnheader" className="px-4 py-3 text-right">Outstanding</div>}
                  {provider !== "SSS" && <div role="columnheader" className="px-4 py-3">Status</div>}
                  <div role="columnheader" className="px-4 py-3 text-right">Action</div>
                </div>
              }
              rowsClassName="divide-y divide-slate-100"
            >
              {filtered.map((loan) => (
                <div key={loan.id} role="row" className={`grid text-slate-900 ${provider === "SSS" ? "grid-cols-[23fr_17fr_18fr_15fr_15fr_12fr]" : "grid-cols-[minmax(220px,2fr)_0.8fr_1.2fr_1.3fr_0.8fr_1fr_1fr_1fr_1.3fr_0.8fr]"}`}>
                  <div role="cell" className="px-4 py-3 font-medium text-slate-900">
                    {provider === "SSS" ? (
                      <>
                        <span className="block truncate">{loan.employeeNameMiddleInitial}</span>
                        <span className="mt-0.5 block truncate font-mono text-xs font-normal text-slate-800">{loan.employeeSssNumber || "—"}</span>
                      </>
                    ) : loan.employeeName}
                  </div>
                  {provider !== "SSS" && <div role="cell" className="px-4 py-3">{loan.provider === "SSS" ? "SSS" : "Pag-IBIG"}</div>}
                  <div role="cell" className="px-4 py-3">
                    {provider === "SSS" ? (
                      <>
                        <span className="block">{loan.loanType}</span>
                        <span className={`mt-0.5 block text-xs font-semibold ${loan.status === "ACTIVE" ? "text-blue-700" : "text-slate-700"}`}>
                          {loanStatusLabels[loan.status]}{loan.statusReason ? ` — ${loan.statusReason}` : ""}
                        </span>
                      </>
                    ) : loan.loanType}
                  </div>
                  <div role="cell" className="px-4 py-3 font-mono text-xs">{loan.loanAccountNumber}</div>
                  <div role="cell" className="px-4 py-3">{loan.loanDate ?? "—"}</div>
                  {provider !== "SSS" && <div role="cell" className="px-4 py-3 text-right tabular-nums text-slate-900">{loan.totalAmount === "" ? "—" : peso(loan.totalAmount)}</div>}
                  <div role="cell" className="px-4 py-3 text-right tabular-nums text-slate-900">{peso(loan.monthlyAmortization)}</div>
                  {provider !== "SSS" && <div role="cell" className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{loan.outstandingBalance === "" ? "—" : peso(loan.outstandingBalance)}</div>}
                  {provider !== "SSS" && <div role="cell" className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${loanStatusStyles[loan.status]}`}>
                      {loanStatusLabels[loan.status]}{loan.statusReason ? ` — ${loan.statusReason}` : ""}
                    </span>
                  </div>}
                  <div role="cell" className="px-4 py-3 text-right">
                    {provider === "SSS" ? (
                      <LoanActionsMenu loan={loan} onEdit={onEdit} onDelete={onDelete} />
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(loan)}
                          aria-label={`Edit loan for ${loan.employeeName}`}
                          title="Edit loan"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <PencilSquareIcon aria-hidden="true" className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(loan)}
                          aria-label={`Delete loan for ${loan.employeeName}`}
                          title="Delete loan"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <TrashIcon aria-hidden="true" className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </ScrollableListTable>
          )}
        </div>
      )}
    </div>
  );
}
