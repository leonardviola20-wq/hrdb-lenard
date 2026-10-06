"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpTrayIcon, ChevronLeftIcon, DocumentTextIcon, EyeIcon, PrinterIcon } from "@heroicons/react/24/outline";
import AttendancePrintReport, { AttendancePrintAllReport } from "@/components/AttendancePrintReport";

type Punch = { time: string; deviceNumber: string; branch: string };
type AttendanceEmployee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  biometricNo: string | null;
  branch: string | null;
  position: string | null;
  status: string | null;
  employer: { name: string; company: string | null } | null;
  attendance: { date: string; timeIn: string | null; timeOut: string | null; punches: Punch[] } | null;
};
type AttendanceListRow = AttendanceEmployee & { totalMinutes: number | null; hasPunches: boolean };

const inputClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localMonthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}

function durationMinutes(timeIn: string | null | undefined, timeOut: string | null | undefined) {
  if (!timeIn || !timeOut) return null;
  const [inHour, inMinute] = timeIn.split(":").map(Number);
  const [outHour, outMinute] = timeOut.split(":").map(Number);
  const start = inHour * 60 + inMinute;
  let end = outHour * 60 + outMinute;
  if (end < start) end += 24 * 60;
  return end - start;
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AttendancePage() {
  const [date, setDate] = useState(() => localDateValue());
  const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ employee: AttendanceListRow; scope: "range" | "day"; autoPrint: boolean } | null>(null);
  const [printAllOpen, setPrintAllOpen] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => localMonthStart());
  const [reportTo, setReportTo] = useState(() => localDateValue());
  const [rangeRecords, setRangeRecords] = useState<AttendanceEmployee[] | null>(null);
  const [rangeLabel, setRangeLabel] = useState("");
  const [rangeLoading, setRangeLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [dailyPage, setDailyPage] = useState(1);
  const [rangePage, setRangePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load attendance report");
      if (!signal?.aborted) setEmployees(data.employees as AttendanceEmployee[]);
    } catch (error) {
      if (!signal?.aborted) setMessage(error instanceof Error ? error.message : "Unable to load attendance report");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const controller = new AbortController();
    void loadReport(controller.signal);
    return () => controller.abort();
  }, [loadReport]);

  const dailyRows: AttendanceListRow[] = employees.map((employee) => ({
    ...employee,
    totalMinutes: durationMinutes(employee.attendance?.timeIn, employee.attendance?.timeOut),
    hasPunches: Boolean(employee.attendance?.punches.length),
  }));
  const rangeRowsByEmployee = new Map<number, AttendanceListRow>();
  for (const employee of rangeRecords ?? []) {
    const minutes = durationMinutes(employee.attendance?.timeIn, employee.attendance?.timeOut);
    const existing = rangeRowsByEmployee.get(employee.id);
    if (existing) {
      existing.totalMinutes = existing.totalMinutes === null && minutes === null ? null : (existing.totalMinutes ?? 0) + (minutes ?? 0);
      existing.hasPunches ||= Boolean(employee.attendance?.punches.length);
    } else {
      rangeRowsByEmployee.set(employee.id, { ...employee, totalMinutes: minutes, hasPunches: Boolean(employee.attendance?.punches.length) });
    }
  }
  const rangeRows = [...rangeRowsByEmployee.values()].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  const branches = [...new Set([...dailyRows, ...rangeRows].map((employee) => employee.branch).filter((branch): branch is string => Boolean(branch)))].sort();
  const filterRows = (rows: AttendanceListRow[]) => rows.filter((employee) => !branchFilter || employee.branch === branchFilter);
  const filteredEmployees = filterRows(dailyRows);
  const filteredRangeRecords = rangeRecords ? filterRows(rangeRows) : null;
  const pageSize = 11;
  const dailyPageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const rangePageCount = Math.max(1, Math.ceil((filteredRangeRecords?.length ?? 0) / pageSize));
  const visibleDailyRows = filteredEmployees.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);
  const visibleRangeRows = filteredRangeRecords?.slice((rangePage - 1) * pageSize, rangePage * pageSize) ?? null;

  const printAllItems = (() => {
    if (rangeRecords) {
      const seen = new Set<number>();
      const items: { employee: AttendanceListRow; records: AttendanceEmployee[] }[] = [];
      for (const row of filteredRangeRecords ?? []) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        items.push({ employee: row, records: rangeRecords.filter((record) => record.id === row.id) });
      }
      return items;
    }
    return filteredEmployees.map((employee) => ({ employee, records: [employee] }));
  })();

  useEffect(() => {
    setDailyPage(1);
    setRangePage(1);
  }, [branchFilter, date, rangeRecords]);

  const fetchRangeRecords = async (from: string, to: string) => {
    const params = new URLSearchParams({ from, to });
    const response = await fetch(`/api/attendance?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to generate attendance report");
    return data.records as AttendanceEmployee[];
  };

  const generateRangeReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reportFrom > reportTo) {
      setMessage("The from date must be on or before the to date.");
      return;
    }
    setRangeLoading(true);
    setMessage("");
    try {
      const records = await fetchRangeRecords(reportFrom, reportTo);
      setRangeRecords(records);
      setRangeLabel(`${reportFrom} to ${reportTo}`);
      setDate(reportTo);
      setReportDialogOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate attendance report");
    } finally {
      setRangeLoading(false);
    }
  };

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setNotice("");
    const formData = new FormData();
    formData.set("file", file);
    try {
      const response = await fetch("/api/attendance", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to upload attendance records");
      setNotice(`${file.name}: ${data.importedRows} punches imported, ${data.duplicateRows} duplicates skipped, ${data.unmatchedRows} unmatched biometric numbers, and ${data.skippedRows} invalid rows skipped.`);
      await loadReport();
      if (rangeRecords) {
        try {
          setRangeRecords(await fetchRangeRecords(reportFrom, reportTo));
        } catch (refreshError) {
          setMessage(refreshError instanceof Error ? refreshError.message : "Unable to refresh the attendance report");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload attendance records");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const renderEmployeeRow = (employee: AttendanceListRow, rowKey: string, scope: "range" | "day") => {
    const name = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
    const employer = employee.employer
      ? [employee.employer.name, employee.employer.company].filter(Boolean).join(" · ")
      : "Not set";
    const values = [name || "Not set", employee.biometricNo || "Not set", employee.branch || "Not set", employee.position || "Not set", employer, formatDuration(employee.totalMinutes)];
    return <article key={rowKey} className="grid grid-cols-1 gap-x-4 gap-y-3 border-b border-slate-100 px-3 py-3 last:border-b-0 sm:grid-cols-3 sm:px-4 xl:grid-cols-[minmax(180px,1.35fr)_minmax(145px,1fr)_minmax(110px,0.8fr)_minmax(125px,0.9fr)_minmax(170px,1.3fr)_minmax(100px,0.7fr)_minmax(96px,auto)]">
      {values.map((value, index) => <div key={`${rowKey}-${index}`} className={`${index === 0 ? "" : "hidden sm:block"} min-w-0 break-words text-sm font-medium text-slate-900`}>{value}</div>)}
      <div key={`${rowKey}-actions`} className="flex items-center gap-1">
        <button type="button" onClick={() => setReportTarget({ employee, scope, autoPrint: false })} aria-label={`View attendance report for ${name}`} title="View report" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <EyeIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setReportTarget({ employee, scope, autoPrint: true })} aria-label={`Print attendance report for ${name}`} title="Print report" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <PrinterIcon className="h-4 w-4" />
        </button>
      </div>
    </article>;
  };

  const renderEmployeeList = (rows: AttendanceListRow[], keyPrefix: string) => <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="grid grid-cols-1 gap-x-4 bg-slate-100 px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:grid-cols-3 sm:px-4 xl:grid-cols-[minmax(180px,1.35fr)_minmax(145px,1fr)_minmax(110px,0.8fr)_minmax(125px,0.9fr)_minmax(170px,1.3fr)_minmax(100px,0.7fr)_minmax(96px,auto)]">
      <div>Name</div><div className="hidden sm:block">Biometric Number</div><div className="hidden sm:block">Branch</div><div className="hidden sm:block">Position</div><div className="hidden sm:block">Employer</div><div className="hidden sm:block">Total Hours</div>
      <div className="hidden sm:block">Report</div>
    </div>
    {rows.map((employee, index) => renderEmployeeRow(employee, `${keyPrefix}-${employee.id}-${index}`, keyPrefix === "range" ? "range" : "day"))}
    {rows.length > 0 && <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:px-4">
      <span>Showing {keyPrefix === "range" ? Math.min((rangePage - 1) * pageSize + 1, filteredRangeRecords?.length ?? 0) : Math.min((dailyPage - 1) * pageSize + 1, filteredEmployees.length)}–{keyPrefix === "range" ? Math.min(rangePage * pageSize, filteredRangeRecords?.length ?? 0) : Math.min(dailyPage * pageSize, filteredEmployees.length)} of {keyPrefix === "range" ? filteredRangeRecords?.length ?? 0 : filteredEmployees.length}</span>
      {((keyPrefix === "range" ? rangePageCount : dailyPageCount) > 1) && <nav aria-label={`${keyPrefix} attendance pages`} className="flex items-center gap-1">
        <button type="button" disabled={(keyPrefix === "range" ? rangePage : dailyPage) <= 1} onClick={() => keyPrefix === "range" ? setRangePage((page) => Math.max(1, page - 1)) : setDailyPage((page) => Math.max(1, page - 1))} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <span className="px-2">Page {keyPrefix === "range" ? rangePage : dailyPage} of {keyPrefix === "range" ? rangePageCount : dailyPageCount}</span>
        <button type="button" disabled={(keyPrefix === "range" ? rangePage : dailyPage) >= (keyPrefix === "range" ? rangePageCount : dailyPageCount)} onClick={() => keyPrefix === "range" ? setRangePage((page) => page + 1) : setDailyPage((page) => page + 1)} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </nav>}
    </div>}
  </div>;

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] w-full min-w-0 flex-col overflow-x-hidden bg-slate-50 p-4 sm:p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col space-y-4">
        <div className="flex w-fit flex-wrap items-center gap-2">
          <Link href="/dashboard" onClick={(event) => { if (window.matchMedia("(max-width: 767px)").matches) { event.preventDefault(); window.dispatchEvent(new Event("hrdb-open-sidebar")); } }} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </Link>
          <input ref={fileInputRef} type="file" accept=".dat,.txt,.xls,.xlsx,application/vnd.ms-excel" onChange={uploadFile} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50">
            <ArrowUpTrayIcon className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
          </button>
          <select aria-label="Filter by branch" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="h-10 min-w-[145px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="">All branches</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <button type="button" onClick={() => setReportDialogOpen(true)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <DocumentTextIcon className="h-4 w-4" /> Generate report
          </button>
          <button type="button" onClick={() => setPrintAllOpen(true)} disabled={printAllItems.length === 0} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <PrinterIcon className="h-4 w-4" /> Print all
          </button>
        </div>
        {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {message && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}

        {rangeRecords && <section className="space-y-3 border-y border-slate-200 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-semibold text-slate-900">Attendance report</h2><p className="mt-1 text-xs text-slate-500">{rangeLabel} · {filteredRangeRecords?.length ?? 0} employees · Daily hours are summed across the selected dates.</p></div>
            <button type="button" onClick={() => setReportDialogOpen(true)} className="text-sm font-semibold text-blue-700 hover:underline">Change dates</button>
          </div>
          {filteredRangeRecords?.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No attendance records match this date range and filter.</p>
            : renderEmployeeList(visibleRangeRows ?? [], "range")}
        </section>}

        <section className="flex flex-1 flex-col space-y-3">
          <p className="text-xs font-medium text-slate-500">From: <span className="font-semibold text-slate-700">{formatDate(reportFrom)}</span> to: <span className="font-semibold text-slate-700">{formatDate(reportTo)}</span></p>
          {loading ? <p role="status" className="mt-5 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Loading report...</p>
            : filteredEmployees.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{employees.length ? "No employees match these filters." : "No active employees found."}</p>
              : renderEmployeeList(visibleDailyRows, "day")}
        </section>

        {reportDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setReportDialogOpen(false)}>
          <form role="dialog" aria-modal="true" aria-labelledby="attendance-report-title" onSubmit={generateRangeReport} onClick={(event) => event.stopPropagation()} className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div><h2 id="attendance-report-title" className="text-lg font-semibold text-slate-900">Attendance report</h2><p className="mt-1 text-sm text-slate-500">Choose the date range to include.</p></div>
            <label className="grid gap-1 text-xs font-medium text-slate-600"><span>From</span><input type="date" value={reportFrom} max={reportTo} onChange={(event) => setReportFrom(event.target.value)} required className={inputClass} /></label>
            <label className="grid gap-1 text-xs font-medium text-slate-600"><span>To</span><input type="date" value={reportTo} min={reportFrom} onChange={(event) => setReportTo(event.target.value)} required className={inputClass} /></label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setReportDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={rangeLoading} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">{rangeLoading ? "Loading..." : "Generate report"}</button>
            </div>
          </form>
        </div>}

        {reportTarget && (
          <AttendancePrintReport
            employee={reportTarget.employee}
            records={reportTarget.scope === "range" ? (rangeRecords ?? []).filter((record) => record.id === reportTarget.employee.id) : [reportTarget.employee]}
            from={reportTarget.scope === "range" ? reportFrom : date}
            to={reportTarget.scope === "range" ? reportTo : date}
            autoPrint={reportTarget.autoPrint}
            onClose={() => setReportTarget(null)}
          />
        )}
        {printAllOpen && (
          <AttendancePrintAllReport
            items={printAllItems}
            from={rangeRecords ? reportFrom : date}
            to={rangeRecords ? reportTo : date}
            onClose={() => setPrintAllOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
