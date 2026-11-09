"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { HistoryBackLink } from "@/components/HistoryBackLink";
import { useAppHeaderActions } from "@/components/Sidebar";
import type {
  PhilHealthContributionHistoryEntry,
  PhilHealthContributionHistoryMonth,
} from "@/lib/philHealthContributionHistory";

type Employee = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  philHealthNumber: string | null;
};

type History = {
  entryCount: number;
  totalAmount: string;
  months: PhilHealthContributionHistoryMonth[];
};

type HistoryResponse = {
  employeeId: number;
  employee: Employee;
  history: History;
  error?: string;
};

type HistoryResult = {
  employeeId: string;
  employee: Employee;
  history: History;
};

type HistoryFailure = { employeeId: string; message: string };
type HistoryView = "table" | "list";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthHeaders = monthNames.map((name) => name.slice(0, 3));
const amountFormat = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0.00";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? amountFormat.format(parsed) : "0.00";
}

function formatPeriod(year: number, month: number) {
  return `${monthNames[month - 1] ?? String(month)} ${year}`;
}

function formatPaymentDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function getEntryCount(months: PhilHealthContributionHistoryMonth[]) {
  return months.reduce((count, month) => count + month.entries.length, 0);
}

function getTotalCents(months: PhilHealthContributionHistoryMonth[]) {
  return months.reduce((total, month) => total + Math.round(Number(month.totalAmount) * 100), 0);
}

function getMonthEntries(month: PhilHealthContributionHistoryMonth | undefined): PhilHealthContributionHistoryEntry[] {
  return month?.entries ?? [];
}

export default function EmployeePhilHealthContributionsPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const setAppHeaderActions = useAppHeaderActions();
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [failure, setFailure] = useState<HistoryFailure | null>(null);
  const [view, setView] = useState<HistoryView>("table");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    setAppHeaderActions({
      actions: null,
      backHref: `/employees/${employeeId}?tab=Government`,
      hideBack: true,
    });
    return () => setAppHeaderActions(null);
  }, [employeeId, setAppHeaderActions]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employees/${employeeId}/philhealth-contributions`, { cache: "no-store" })
      .then(async (response) => {
        const data: HistoryResponse = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load PhilHealth contributions");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setResult({ employeeId, employee: data.employee, history: data.history });
        setFailure(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setFailure({
          employeeId,
          message: loadError instanceof Error
            ? loadError.message
            : "Unable to load PhilHealth contributions",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const currentResult = result?.employeeId === employeeId ? result : null;
  const currentFailure = failure?.employeeId === employeeId ? failure : null;
  const loading = !currentResult && !currentFailure;
  const history = currentResult?.history ?? null;
  const employee = currentResult?.employee ?? null;
  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ")
    : "Employee";
  const yearOptions = useMemo(
    () => [...new Set((history?.months ?? []).map((month) => month.year))].sort((a, b) => b - a),
    [history],
  );
  const activeYear = selectedYear !== null && yearOptions.includes(selectedYear)
    ? selectedYear
    : yearOptions[0] ?? null;
  const selectedYearMonths = useMemo(
    () => history && activeYear !== null
      ? Array.from({ length: 12 }, (_, index) =>
        history.months.find((month) => month.year === activeYear && month.month === index + 1)
        ?? { year: activeYear, month: index + 1, totalAmount: "0.00", entries: [] },
      )
      : [],
    [activeYear, history],
  );
  const selectedYearEntryCount = getEntryCount(selectedYearMonths);
  const selectedYearTotalCents = getTotalCents(selectedYearMonths);

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col">
        {loading ? (
          <p role="status" className="text-sm text-gray-600">Loading PhilHealth contributions...</p>
        ) : currentFailure ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{currentFailure.message}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{fullName}</p>
                  <p className="font-mono tabular-nums">{employee?.philHealthNumber || "Not set"}</p>
                </div>
              </div>
              <div aria-label="Overall contribution totals" className="ml-auto flex flex-wrap items-end gap-x-6 gap-y-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Contrib. Count</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">{history?.entryCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">₱{formatAmount(history?.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <HistoryBackLink
                fallbackHref={`/employees/${employeeId}?tab=Government`}
                aria-label="Back to employee profile"
                title="Back to employee profile"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
              </HistoryBackLink>
              <div role="group" aria-label="PhilHealth contribution view" className="inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white p-0.5">
                <button
                  type="button"
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                  aria-label="Table view"
                  title="Table view"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${view === "table" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <Squares2X2Icon aria-hidden="true" className="h-4 w-4" />Table
                </button>
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  aria-label="List view"
                  title="List view"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${view === "list" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <ListBulletIcon aria-hidden="true" className="h-4 w-4" />List
                </button>
              </div>
            </div>

            {history?.entryCount === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">No saved PhilHealth contribution entries for this employee.</p>
            ) : view === "table" && history ? (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full min-w-[68rem] border-collapse text-right text-sm text-gray-900">
                    <caption className="sr-only">PhilHealth contributions by year and month</caption>
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <th scope="col" className="px-3 py-2.5 text-left">Year</th>
                        {monthHeaders.map((label) => <th key={label} scope="col" className="px-3 py-2.5">{label}</th>)}
                        <th scope="col" className="px-3 py-2.5">Year Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearOptions.map((year) => {
                        const yearMonths = monthNames.map((_, index) =>
                          history.months.find((month) => month.year === year && month.month === index + 1),
                        );
                        const yearTotalCents = getTotalCents(yearMonths.filter(
                          (month): month is PhilHealthContributionHistoryMonth => month !== undefined,
                        ));
                        return (
                          <tr key={year} className="border-b border-gray-100">
                            <th scope="row" className="px-3 py-2.5 text-left font-semibold text-gray-900">{year}</th>
                            {yearMonths.map((month, index) => {
                              const value = month?.totalAmount ?? "0.00";
                              return (
                                <td key={index} className={`px-3 py-2.5 tabular-nums ${value === "0.00" ? "text-gray-400" : "font-semibold text-gray-900"}`}>
                                  {formatAmount(value)}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 font-bold tabular-nums">{formatAmount(yearTotalCents / 100)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td colSpan={14} className="px-3 py-3 text-left text-sm font-semibold text-gray-900">
                          Number of Contributions: {history.entryCount}
                          <span className="float-right font-bold tabular-nums">Total Contribution: ₱{formatAmount(history.totalAmount)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : history && activeYear !== null ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label htmlFor="philhealth-contribution-year" className="text-sm font-semibold text-gray-700">Year</label>
                  <select
                    id="philhealth-contribution-year"
                    aria-label="Contribution year"
                    value={activeYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"
                  >
                    {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full min-w-[60rem] table-fixed border-collapse text-left text-sm text-gray-900">
                    <caption className="sr-only">Saved PhilHealth contribution entries for {activeYear}</caption>
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[21%]" />
                      <col className="w-[15%]" />
                      <col className="w-[17%]" />
                      <col className="w-[15%]" />
                      <col className="w-[17%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <th scope="col" className="px-3 py-2.5">Period</th>
                        <th scope="col" className="px-3 py-2.5">Employer</th>
                        <th scope="col" className="px-3 py-2.5 text-right">Payment Date</th>
                        <th scope="col" className="px-3 py-2.5">ePAR No.</th>
                        <th scope="col" className="px-3 py-2.5 text-right">ePAR Date</th>
                        <th scope="col" className="px-3 py-2.5 pr-4 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedYearMonths.map((month) => {
                        const entries = getMonthEntries(month);
                        return entries.length ? entries.map((entry, index) => (
                          <tr key={entry.id} className="border-b border-gray-100">
                            <th scope="row" className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-gray-900">
                              {index === 0 ? formatPeriod(month.year, month.month) : <span aria-hidden="true" className="text-gray-300">{formatPeriod(month.year, month.month)}</span>}
                            </th>
                            <td className="px-3 py-2.5">{entry.employerName}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatPaymentDate(entry.payDate)}</td>
                            <td className="break-all px-3 py-2.5">{entry.eparNumber || "—"}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatPaymentDate(entry.eparDate)}</td>
                            <td className="px-3 py-2.5 pr-4 text-right font-semibold tabular-nums">{formatAmount(entry.amount)}</td>
                          </tr>
                        )) : (
                          <tr key={`${month.year}-${month.month}-empty`} className="border-b border-gray-100 text-gray-400">
                            <th scope="row" className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500">{formatPeriod(month.year, month.month)}</th>
                            <td className="px-3 py-2.5">—</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">—</td>
                            <td className="px-3 py-2.5">—</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">—</td>
                            <td className="px-3 py-2.5 pr-4 text-right tabular-nums">0.00</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-gray-900">
                          Number of Contributions: {selectedYearEntryCount}
                        </td>
                        <td colSpan={3} className="px-3 py-3 pr-4 text-right text-sm font-bold tabular-nums text-gray-900">
                          Amount Totals: ₱{formatAmount(selectedYearTotalCents / 100)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
