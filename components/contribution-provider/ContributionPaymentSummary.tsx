"use client";

import { useEffect, useState } from "react";
import ScrollableListTable from "@/components/ScrollableListTable";

type Provider = "sss" | "pagibig" | "philhealth";
type Payment = { applicableMonth: number; applicableYear: number; payDate: string; amountPaid: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const providerLabels: Record<Provider, string> = {
  sss: "SSS",
  pagibig: "PagIBIG",
  philhealth: "PhilHealth",
};

const paymentHeadings: Record<Provider, string> = {
  sss: "SSS Payments",
  pagibig: "PagIBIG Payment",
  philhealth: "PhilHealth Payment",
};

function getPaymentUrl(provider: Provider, employerId: string) {
  const query = `employerId=${encodeURIComponent(employerId)}&view=payments&limit=12`;
  if (provider === "sss") return `/api/reports/sss?${query}&kind=CONTRIBUTION`;
  if (provider === "pagibig") return `/api/reports/pagibig?${query}`;
  return `/api/reports/philhealth/reports?${query}`;
}

function normalizePayment(
  applicableMonth: unknown,
  applicableYear: unknown,
  payDate: unknown,
  amountPaid: unknown,
): Payment {
  if (!Number.isInteger(applicableMonth) || Number(applicableMonth) < 1 || Number(applicableMonth) > 12
    || !Number.isInteger(applicableYear) || typeof payDate !== "string" || !payDate
    || (typeof amountPaid !== "string" && typeof amountPaid !== "number")
    || !Number.isFinite(Number(amountPaid))) {
    throw new Error("Contribution payment response is invalid.");
  }
  return {
    applicableMonth: Number(applicableMonth),
    applicableYear: Number(applicableYear),
    payDate,
    amountPaid: String(amountPaid),
  };
}

function normalizePayments(value: unknown): Payment[] {
  if (!isRecord(value)) throw new Error("Contribution payment response is invalid.");

  if (Array.isArray(value.payments)) {
    return value.payments.map((payment) => {
      if (!isRecord(payment)) throw new Error("Contribution payment response is invalid.");
      return normalizePayment(payment.applicableMonth, payment.applicableYear, payment.payDate, payment.amountPaid);
    });
  }

  if (Array.isArray(value.reports)) {
    return value.reports.flatMap((report) => {
      if (!isRecord(report)) throw new Error("Contribution payment response is invalid.");
      if (report.payment === null) return [];
      if (!isRecord(report.payment)) throw new Error("Contribution payment response is invalid.");
      return [normalizePayment(
        report.applicableMonth,
        report.applicableYear,
        report.payment.transactionDate,
        report.payment.amountPaid ?? report.amountPaid,
      )];
    });
  }

  throw new Error("Contribution payment response is invalid.");
}

function formatPaymentDate(value: string) {
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ContributionPaymentSummary({
  employerId,
  provider,
}: {
  employerId?: string;
  provider: Provider;
}) {
  const [result, setResult] = useState<{ key: string; payments?: Payment[]; error?: string }>({ key: "" });
  const requestKey = employerId ? `${provider}:${employerId}` : "";

  useEffect(() => {
    if (!employerId) return;

    const controller = new AbortController();
    fetch(getPaymentUrl(provider, employerId), { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = isRecord(data) && typeof data.error === "string" ? data.error : "";
          throw new Error(message || `Unable to load ${providerLabels[provider]} payments.`);
        }
        return normalizePayments(data);
      })
      .then((loadedPayments) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, payments: loadedPayments });
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            error: loadError instanceof Error ? loadError.message : `Unable to load ${providerLabels[provider]} payments.`,
          });
        }
      });

    return () => controller.abort();
  }, [employerId, provider, requestKey]);

  const loading = Boolean(employerId) && result.key !== requestKey;
  const payments = result.key === requestKey ? result.payments ?? [] : [];
  const error = result.key === requestKey ? result.error : "";

  return (
    <section aria-labelledby="contribution-payments-heading" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <h2 id="contribution-payments-heading" className="text-lg font-semibold text-slate-900">
            {paymentHeadings[provider]}
          </h2>
        </div>
      </header>
      {!employerId ? (
        <p className="p-6 text-center text-sm text-slate-600">Select an employer to view previous payments.</p>
      ) : loading ? (
        <p role="status" className="p-6 text-center text-sm text-slate-600">Loading previous payments...</p>
      ) : error ? (
        <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>
      ) : payments.length === 0 ? (
        <p role="status" className="p-6 text-center text-sm text-slate-600">No paid contribution reports found.</p>
      ) : (
        <ScrollableListTable
          ariaLabel={`${paymentHeadings[provider]} payment history`}
          className="max-h-[65dvh]"
          contentClassName="w-full"
          header={
            <div role="row" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-white text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div role="columnheader" className="px-4 py-3">Period</div>
              <div role="columnheader" className="hidden px-4 py-3 sm:block">Payment Date</div>
              <div role="columnheader" className="px-4 py-3 text-right">Amount Paid</div>
            </div>
          }
          rowsClassName="divide-y divide-slate-100"
        >
          {payments.map((payment, index) => (
            <div key={`${payment.applicableYear}-${payment.applicableMonth}-${payment.payDate}-${index}`} role="row" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div role="cell" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {new Date(payment.applicableYear, payment.applicableMonth - 1).toLocaleString("en", { month: "long", year: "numeric" })}
              </div>
              <div role="cell" className="hidden whitespace-nowrap px-4 py-3 text-slate-700 sm:block">{formatPaymentDate(payment.payDate)}</div>
              <div role="cell" className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                {Number(payment.amountPaid).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
              </div>
            </div>
          ))}
        </ScrollableListTable>
      )}
    </section>
  );
}
