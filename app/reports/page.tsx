"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BanknotesIcon, ChartBarIcon, DocumentChartBarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

type EmployerOption = { id: number; name: string };
type ReportKind = "CONTRIBUTION" | "LOAN";
type RecentPayment = { id: number; applicableMonth: number; applicableYear: number; amountDue: string };

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const formatAmountDue = (value: string) => `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const reportCards = [
  {
    title: "SSS",
    description: "Contribution and loan tracking",
    Icon: DocumentChartBarIcon,
    accent: "from-blue-600 to-blue-700",
    actions: [
      { label: "Contribution", href: "/reports/sss?kind=CONTRIBUTION" },
      { label: "Loan", href: "/reports/sss?kind=LOAN" },
    ],
  },
  {
    title: "Pag-IBIG",
    description: "Coming soon",
    Icon: BanknotesIcon,
    accent: "from-violet-500 to-violet-600",
    actions: [
      { label: "Contribution", href: null },
      { label: "Loan", href: null },
    ],
  },
  {
    title: "PhilHealth",
    description: "Coming soon",
    Icon: ShieldCheckIcon,
    accent: "from-emerald-500 to-emerald-600",
    actions: [
      { label: "Contribution", href: null },
    ],
  },
] as const;

export default function ReportsDashboardPage() {
  return <Suspense fallback={<main className="min-h-0 w-full flex-1 bg-gray-50 p-4 sm:p-6" />}><ReportsDashboardContent /></Suspense>;
}

function ReportsDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employers, setEmployers] = useState<EmployerOption[]>([]);
  const [loadingEmployers, setLoadingEmployers] = useState(true);
  const [employerError, setEmployerError] = useState("");
  const [historyKind, setHistoryKind] = useState<ReportKind>("CONTRIBUTION");
  const requestedEmployerId = searchParams.get("employerId") ?? "";
  const selectedEmployerId = employers.some((employer) => String(employer.id) === requestedEmployerId) ? requestedEmployerId : "";

  const selectEmployer = (employerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (employerId) params.set("employerId", employerId);
    else params.delete("employerId");
    const query = params.toString();
    router.replace(query ? `/reports?${query}` : "/reports", { scroll: false });
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports/sss/employers?summary=1", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employers");
        return data.employers as EmployerOption[];
      })
      .then((rows) => {
        if (!cancelled) setEmployers(rows);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setEmployerError(loadError instanceof Error ? loadError.message : "Unable to load employers");
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="w-full">
        <div className="mb-6 flex justify-start">
          <div className="w-full max-w-md">
            <label htmlFor="reports-employer" className="mb-1.5 block text-sm font-semibold text-slate-700">Employer</label>
            <select
              id="reports-employer"
              value={selectedEmployerId}
              onChange={(event) => selectEmployer(event.target.value)}
              disabled={loadingEmployers || employers.length === 0}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">{loadingEmployers ? "Loading employers..." : "Select employer"}</option>
              {employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">Choose an employer to enable report actions and view payment history.</p>
          </div>
        </div>

        {employerError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{employerError}</p>}
        {!loadingEmployers && employers.length === 0 && !employerError && <p role="status" className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">No employers are available.</p>}

        <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map(({ title, description, Icon, accent, actions }) => (
            <section key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

                  if (!action.href) {
                    return (
                      <button key={action.label} type="button" disabled title="Coming soon" className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2 text-center text-xs font-semibold text-slate-400 disabled:opacity-60 sm:text-sm">
                        {content}
                      </button>
                    );
                  }

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
                    <Link
                      key={action.label}
                      href={actionHref}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

              {title === "SSS" && (
                <section aria-labelledby="sss-payment-history" className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="sss-payment-history" className="text-sm font-bold text-slate-900">Payment History</h3>
                    <div role="tablist" aria-label="Payment history report type" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {(["CONTRIBUTION", "LOAN"] as const).map((kind) => (
                        <button key={kind} id={`payment-history-tab-${kind.toLowerCase()}`} type="button" role="tab" aria-selected={historyKind === kind} aria-controls="sss-payment-history-list" onClick={() => setHistoryKind(kind)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${historyKind === kind ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                          {kind === "CONTRIBUTION" ? "Contribution" : "Loan"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedEmployerId ? <RecentPayments key={`${selectedEmployerId}-${historyKind}`} employerId={selectedEmployerId} kind={historyKind} /> : (
                    <p className="mt-3 text-xs text-slate-500">Select an employer to view payment history.</p>
                  )}
                </section>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function RecentPayments({ employerId, kind }: { employerId: string; kind: ReportKind }) {
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/sss?employerId=${encodeURIComponent(employerId)}&view=payments&kind=${kind}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load payment history");
        return data.payments as RecentPayment[];
      })
      .then((rows) => {
        if (!cancelled) setPayments(rows);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load payment history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employerId, kind]);

  if (loading) return <p id="sss-payment-history-list" role="tabpanel" aria-labelledby={`payment-history-tab-${kind.toLowerCase()}`} className="mt-3 text-xs text-slate-500">Loading payment history...</p>;
  if (error) return <p id="sss-payment-history-list" role="tabpanel" aria-labelledby={`payment-history-tab-${kind.toLowerCase()}`} className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p>;
  if (payments.length === 0) return <p id="sss-payment-history-list" role="tabpanel" aria-labelledby={`payment-history-tab-${kind.toLowerCase()}`} className="mt-3 text-xs text-slate-500">No {kind === "CONTRIBUTION" ? "contribution" : "loan"} payments found.</p>;

  return (
    <div id="sss-payment-history-list" role="tabpanel" aria-labelledby={`payment-history-tab-${kind.toLowerCase()}`} className="mt-3">
      <table className="w-full table-fixed text-left text-xs sm:text-sm">
        <thead className="text-[10px] font-semibold uppercase text-slate-500 sm:text-xs">
          <tr><th className="w-2/3 py-2 pr-2">Period Covered</th><th className="py-2 text-right">Amount Due</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="text-slate-700">
              <td className="whitespace-nowrap py-2 pr-2">{monthNames[payment.applicableMonth - 1]} {payment.applicableYear}</td>
              <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums">{formatAmountDue(payment.amountDue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
