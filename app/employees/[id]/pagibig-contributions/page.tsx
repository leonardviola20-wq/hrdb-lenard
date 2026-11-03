"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { HistoryBackLink } from "@/components/HistoryBackLink";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0.00";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
}

type HistoryEntry = {
  id: number;
  reportId: number;
  kind: string;
  manual: boolean;
  employerName: string;
  pin: string;
  payDate: string | null;
  paymentType: string | null;
  amountPaid: string | null;
  applicableYear: number;
  applicableMonth: number;
  employeeSavings: string;
  employerSavings: string;
  mp2Amount: string;
  calamityLoanAmount: string;
  mplLoanAmount: string;
  emergencyLoanAmount: string;
  safeLoanAmount: string;
  totalAmount: string;
};

type Employee = { firstName: string; middleName: string | null; lastName: string; pagIbigNumber: string | null };

type Response = { employeeId: string; employee: Employee; history: HistoryEntry[]; error?: string };

export default function PagibigContributionsPage() {
  const params = useParams();
  const employeeId = String(params?.id ?? "");
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"table" | "list">("table");
  const [kindFilter, setKindFilter] = useState<"ALL" | "CONTRIBUTION" | "LOAN">("ALL");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/employees/${employeeId}/pagibig-contributions`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Unable to load Pag-IBIG contributions");
        return json as Response;
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId]);

  const employee = data?.employee;
  const history = (data?.history ?? []).filter((h) => kindFilter === "ALL" || h.kind === kindFilter);

  const years = [...new Set(history.map((h) => h.applicableYear))].sort((a, b) => b - a);

  return (
    <div className="min-h-0 flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center gap-3">
          <HistoryBackLink fallbackHref={`/employees/${employeeId}?tab=Government`} aria-label="Back to employee profile" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </HistoryBackLink>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pag-IBIG Contributions</h1>
            <p className="text-sm text-gray-600">{employee ? `${employee.lastName}, ${employee.firstName}${employee.middleName ? " " + employee.middleName.charAt(0) + "." : ""}` : ""} · {employee?.pagIbigNumber || "-"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button type="button" onClick={() => setKindFilter("ALL")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${kindFilter === "ALL" ? "bg-violet-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}>All</button>
            <button type="button" onClick={() => setKindFilter("CONTRIBUTION")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${kindFilter === "CONTRIBUTION" ? "bg-violet-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}>Contribution</button>
            <button type="button" onClick={() => setKindFilter("LOAN")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${kindFilter === "LOAN" ? "bg-violet-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}>Loan</button>
          </div>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button type="button" onClick={() => setView("table")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${view === "table" ? "bg-violet-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}>Table</button>
            <button type="button" onClick={() => setView("list")} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${view === "list" ? "bg-violet-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}>List</button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && view === "table" && (
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Year</th>
                  {monthNames.map((m) => <th key={m} className="px-2 py-2 text-right">{m.slice(0,3)}</th>)}
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {years.map((year) => {
                  const yearEntries = history.filter((h) => h.applicableYear === year);
                  const monthVals = monthNames.map((_, i) => {
                    const m = i + 1;
                    const e = yearEntries.find((h) => h.applicableMonth === m);
                    if (!e) return "0.00";
                    const amt = kindFilter === "CONTRIBUTION" ? Number(e.employeeSavings) + Number(e.employerSavings) + Number(e.mp2Amount) : kindFilter === "LOAN" ? Number(e.calamityLoanAmount) + Number(e.mplLoanAmount) + Number(e.emergencyLoanAmount) + Number(e.safeLoanAmount) : Number(e.employeeSavings) + Number(e.employerSavings) + Number(e.mp2Amount) + Number(e.calamityLoanAmount) + Number(e.mplLoanAmount) + Number(e.emergencyLoanAmount) + Number(e.safeLoanAmount);
                    return formatAmount(amt);
                  });
                  const yearTotal = yearEntries.reduce((acc, e) => acc + (kindFilter === "CONTRIBUTION" ? Number(e.employeeSavings) + Number(e.employerSavings) + Number(e.mp2Amount) : kindFilter === "LOAN" ? Number(e.calamityLoanAmount) + Number(e.mplLoanAmount) + Number(e.emergencyLoanAmount) + Number(e.safeLoanAmount) : Number(e.employeeSavings) + Number(e.employerSavings) + Number(e.mp2Amount) + Number(e.calamityLoanAmount) + Number(e.mplLoanAmount) + Number(e.emergencyLoanAmount) + Number(e.safeLoanAmount)), 0);
                  return (
                    <tr key={year} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-bold text-gray-900">{year}</td>
                      {monthVals.map((v, i) => <td key={i} className={`px-2 py-2 text-right tabular-nums ${v === "0.00" ? "text-gray-400" : "font-semibold text-gray-900"}`}>{v}</td>)}
                      <td className="px-3 py-2 text-right font-bold tabular-nums text-gray-900">{formatAmount(yearTotal)}</td>
                    </tr>
                  );
                })}
                {years.length === 0 && <tr><td colSpan={14} className="px-3 py-6 text-center text-gray-600">No Pag-IBIG contributions found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && view === "list" && (
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-gray-600">No Pag-IBIG contributions found.</p>}
            {history.map((h) => (
              <div key={h.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{monthNames[h.applicableMonth - 1]} {h.applicableYear}</span>
                  <span className="text-xs text-gray-500">{h.kind}{h.manual ? " (Manual)" : ""}</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-gray-700">
                  <span>Savings: {formatAmount(Number(h.employeeSavings) + Number(h.employerSavings))}</span>
                  <span>MP2: {formatAmount(h.mp2Amount)}</span>
                  <span>Loans: {formatAmount(Number(h.calamityLoanAmount) + Number(h.mplLoanAmount) + Number(h.emergencyLoanAmount) + Number(h.safeLoanAmount))}</span>
                  <span>Total: {formatAmount(h.totalAmount)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{h.employerName} · {h.pin} · {h.payDate ? `Paid ${h.payDate}` : "Unpaid"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
