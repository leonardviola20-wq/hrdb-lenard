"use client";

import { useEffect, useState } from "react";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const formatAmountDue = (value: string) =>
  `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Row = { id: number; applicableMonth: number; applicableYear: number; amount: string };

export default function ProviderPaymentHistory({ endpoint, emptyLabel, ariaLabel, id }: {
  endpoint: string;
  emptyLabel: string;
  ariaLabel: string;
  id?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Unable to load ${ariaLabel}`);
        return (data.payments ?? data.reports) as Array<Record<string, unknown>>;
      })
      .then((items) => {
        if (cancelled) return;
        setRows(
          items.map((item) => {
            const payment = item.payment as { amountPaid?: string } | undefined;
            return {
              id: Number(item.id),
              applicableMonth: Number(item.applicableMonth),
              applicableYear: Number(item.applicableYear),
              amount: String(payment?.amountPaid ?? item.amountDue ?? "0"),
            };
          }),
        );
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : `Unable to load ${ariaLabel}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, ariaLabel]);

  if (loading) return <p role="status" id={id} className="mt-3 text-xs text-slate-500">Loading payment history...</p>;
  if (error) return <p role="alert" id={id} className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p>;
  if (rows.length === 0) return <p id={id} className="mt-3 text-xs text-slate-500">{emptyLabel}</p>;

  return (
    <div id={id} className="mt-3">
      <table className="w-full table-fixed text-left text-xs sm:text-sm">
        <thead className="text-[10px] font-semibold uppercase text-slate-500 sm:text-xs">
          <tr><th className="w-2/3 py-2 pr-2">Period Covered</th><th className="py-2 text-right">Amount Paid</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="text-slate-700">
              <td className="whitespace-nowrap py-2 pr-2">{monthNames[row.applicableMonth - 1]} {row.applicableYear}</td>
              <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums">{formatAmountDue(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
