"use client";

import Link from "next/link";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import ProviderPaymentHistory from "@/components/reports-dashboard/ProviderPaymentHistory";

export type ReportKind = "CONTRIBUTION" | "LOAN";

type Action = { label: string; href: string };

export default function ProviderCard({ title, description, Icon, accent, actions, selectedEmployerId, historyKind, onHistoryKindChange }: {
  title: string;
  description: string;
  Icon: typeof ChartBarIcon;
  accent: string;
  actions: readonly Action[];
  selectedEmployerId: string;
  historyKind: ReportKind;
  onHistoryKindChange: (kind: ReportKind) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const content = (
            <>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-blue-700">
                <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="max-w-full break-words leading-tight">{action.label}</span>
            </>
          );

          if (!selectedEmployerId) {
            return (
              <button key={action.label} type="button" disabled title="Select an employer first" className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2 text-center text-xs font-semibold text-slate-400 disabled:opacity-60 sm:text-sm">
                {content}
              </button>
            );
          }

          const separator = action.href.includes("?") ? "&" : "?";
          const actionHref = `${action.href}${separator}employerId=${encodeURIComponent(selectedEmployerId)}`;

          return (
            <Link key={action.label} href={actionHref} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm">
              {content}
            </Link>
          );
        })}
      </div>

      <section aria-labelledby={`${title}-payment-history`} className="mt-5 border-t border-slate-200 pt-4">
        <HistoryHeader title={title} historyKind={historyKind} onHistoryKindChange={onHistoryKindChange} />
        {selectedEmployerId ? <HistoryBody title={title} employerId={selectedEmployerId} historyKind={historyKind} /> : (
          <p className="mt-3 text-xs text-slate-500">Select an employer to view payment history.</p>
        )}
      </section>
    </section>
  );
}

function HistoryHeader({ title, historyKind, onHistoryKindChange }: { title: string; historyKind: ReportKind; onHistoryKindChange: (kind: ReportKind) => void }) {
  if (title !== "SSS") return <h3 id={`${title}-payment-history`} className="text-sm font-bold text-slate-900">Payment History</h3>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id="sss-payment-history" className="text-sm font-bold text-slate-900">Payment History</h3>
      <div role="tablist" aria-label="Payment history report type" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(["CONTRIBUTION", "LOAN"] as const).map((kind) => (
          <button key={kind} id={`payment-history-tab-${kind.toLowerCase()}`} type="button" role="tab" aria-selected={historyKind === kind} onClick={() => onHistoryKindChange(kind)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${historyKind === kind ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {kind === "CONTRIBUTION" ? "Contribution" : "Loan"}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryBody({ title, employerId, historyKind }: { title: string; employerId: string; historyKind: ReportKind }) {
  if (title === "SSS") {
    return (
      <ProviderPaymentHistory
        key={`${employerId}-sss-${historyKind}`}
        endpoint={`/api/reports/sss?employerId=${encodeURIComponent(employerId)}&view=payments&kind=${historyKind}`}
        emptyLabel={`No ${historyKind === "CONTRIBUTION" ? "contribution" : "loan"} payments found.`}
        ariaLabel="SSS payment history"
        id="sss-payment-history-list"
      />
    );
  }
  if (title === "Pag-IBIG") {
    return (
      <ProviderPaymentHistory
        key={`${employerId}-pagibig`}
        endpoint={`/api/reports/pagibig?employerId=${encodeURIComponent(employerId)}&view=payments`}
        emptyLabel="No Pag-IBIG payments found."
        ariaLabel="Pag-IBIG payment history"
      />
    );
  }
  return (
    <ProviderPaymentHistory
      key={`${employerId}-philhealth`}
      endpoint={`/api/reports/philhealth/reports?employerId=${encodeURIComponent(employerId)}&view=payments`}
      emptyLabel="No PhilHealth payments found."
      ariaLabel="PhilHealth payment history"
    />
  );
}
