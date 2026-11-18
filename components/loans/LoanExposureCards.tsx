import { peso } from "@/components/loans/shared/format";

export type LoanExposure = {
  sssOutstanding: number;
  pagibigOutstanding: number;
  monthlyProjection: number;
  sssMonthly: number;
  pagibigMonthly: number;
  activeLoanCount: number;
};

const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

/**
 * Combined single-card overview (Government Loan Exposure + Monthly Payroll
 * Projection) used by the dedicated SSS / HDMF provider pages, where it sits
 * on the left of the provider's loan list.
 */
export function ProviderExposureCard({
  providerLabel,
  outstanding,
  monthly,
  activeCount,
}: {
  providerLabel: string;
  outstanding: number;
  monthly: number;
  activeCount: number;
}) {
  return (
    <section aria-label={`${providerLabel} loan overview`} className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Government Loan Exposure</h2>
        <p className="mt-1 text-xs text-slate-500">Outstanding {providerLabel} loan balances ({activeCount} active).</p>
        <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{peso(outstanding)}</p>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <h2 className="text-sm font-bold text-slate-900">Monthly Payroll Projection</h2>
        <p className="mt-1 text-xs text-slate-500">Cash to set aside for upcoming {providerLabel} deductions.</p>
        <p className="mt-3 text-3xl font-bold tabular-nums text-blue-700">{peso(monthly)}</p>
      </div>
    </section>
  );
}

export default function LoanExposureCards({ exposure }: { exposure: LoanExposure }) {
  const total = exposure.sssOutstanding + exposure.pagibigOutstanding;
  const rows = [
    { label: "SSS outstanding", value: peso(exposure.sssOutstanding) },
    { label: "Pag-IBIG outstanding", value: peso(exposure.pagibigOutstanding) },
  ];

  return (
    <section aria-labelledby="loan-exposure-heading" className="mb-6 grid gap-4 lg:grid-cols-2">
      <section className={cardClass}>
        <h2 id="loan-exposure-heading" className="text-sm font-bold text-slate-900">Government Loan Exposure</h2>
        <p className="mt-1 text-xs text-slate-500">Current outstanding balances across all staff loans ({exposure.activeLoanCount} active).</p>
        <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">{peso(total)}</p>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-600">{row.label}</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-bold text-slate-900">Monthly Payroll Projection</h2>
        <p className="mt-1 text-xs text-slate-500">Cash to set aside for upcoming monthly loan deductions.</p>
        <p className="mt-4 text-3xl font-bold tabular-nums text-blue-700">{peso(exposure.monthlyProjection)}</p>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">SSS amortizations</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{peso(exposure.sssMonthly)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">Pag-IBIG amortizations</dt>
            <dd className="font-semibold tabular-nums text-slate-900">{peso(exposure.pagibigMonthly)}</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
