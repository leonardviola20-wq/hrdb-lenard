"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, CheckCircleIcon, ChevronDownIcon, ChevronLeftIcon, ChevronUpDownIcon, ChevronUpIcon, EyeIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import AttendancePrintReport, { AttendancePrintAllReport, attendanceMinutes } from "@/components/AttendancePrintReport";

type Punch = { time: string; deviceNumber: string; branch: string };
type AttendanceEmployee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  biometricNo: string | null;
  photoUrl: string | null;
  branch: string | null;
  position: string | null;
  status: string | null;
  employer: { name: string; company: string | null } | null;
  attendance: { date: string; timeIn: string | null; timeOut: string | null; punches: Punch[] } | null;
};
type AttendanceListRow = AttendanceEmployee & { totalMinutes: number | null; hasPunches: boolean };
type AttendanceSortColumn = "name" | "biometricNo" | "branch" | "position" | "employer" | "totalMinutes";
type AttendanceSort = { column: AttendanceSortColumn; direction: "asc" | "desc" };

function sortAttendanceRows(rows: AttendanceListRow[], sort: AttendanceSort) {
  const direction = sort.direction === "asc" ? 1 : -1;
  const compareText = (left: string | null | undefined, right: string | null | undefined) => {
    const a = left?.trim() || "";
    const b = right?.trim() || "";
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) * direction;
  };

  return [...rows].sort((a, b) => {
    let result = 0;
    if (sort.column === "name") {
      result = compareText(`${a.firstName} ${a.middleName || ""} ${a.lastName}`, `${b.firstName} ${b.middleName || ""} ${b.lastName}`);
    } else if (sort.column === "biometricNo") {
      result = compareText(a.biometricNo, b.biometricNo);
    } else if (sort.column === "branch") {
      result = compareText(a.branch, b.branch);
    } else if (sort.column === "position") {
      result = compareText(a.position, b.position);
    } else if (sort.column === "employer") {
      result = compareText(a.employer?.name, b.employer?.name);
    } else if (a.totalMinutes === null || b.totalMinutes === null) {
      result = a.totalMinutes === b.totalMinutes ? 0 : a.totalMinutes === null ? 1 : -1;
    } else {
      result = (a.totalMinutes - b.totalMinutes) * direction;
    }

    if (result !== 0) return result;
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, undefined, { sensitivity: "base" });
  });
}

const inputClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

// Shared column tracks so the list header and its rows can never drift apart.
const GRID_COLS = "sm:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_110px_32px_40px]";
const GRID_ROW = `grid grid-cols-1 gap-x-4 px-3 sm:px-4 ${GRID_COLS}`;

function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localMonthStart(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

const RANGE_STORAGE_KEY = "hrdb-attendance-range";

type SavedRange = { from: string; to: string; active: boolean };

function isDateText(value: unknown): value is string {
  return typeof value === "string" && value.length === 10 && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

// The date range survives sign-out/restart so returning users see their last report.
function readSavedRange(): SavedRange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RANGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedRange>;
    if (!isDateText(parsed.from) || !isDateText(parsed.to) || parsed.from > parsed.to) return null;
    return { from: parsed.from, to: parsed.to, active: Boolean(parsed.active) };
  } catch {
    return null;
  }
}

function saveSavedRange(from: string, to: string, active: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify({ from, to, active }));
  } catch {
    // Storage may be unavailable (private mode); the page still works without it.
  }
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}


export default function AttendancePage() {
  const [date, setDate] = useState(() => localDateValue());
  const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);
  const [reportTarget, setReportTarget] = useState<{ employee: AttendanceListRow; scope: "range" | "day"; autoPrint: boolean } | null>(null);
  const [printAllOpen, setPrintAllOpen] = useState(false);
  const [reportFrom, setReportFrom] = useState(localMonthStart);
  const [reportTo, setReportTo] = useState(localDateValue);
  const [rangeRecords, setRangeRecords] = useState<AttendanceEmployee[] | null>(null);
  const [rangeLabel, setRangeLabel] = useState("");
  const [rangeLoading, setRangeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [dailyPage, setDailyPage] = useState(1);
  const [rangePage, setRangePage] = useState(1);
  const [attendanceSort, setAttendanceSort] = useState<AttendanceSort>({ column: "name", direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalImported, setTotalImported] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("Upload complete");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load attendance report");
      if (!signal?.aborted) {
        setEmployees(data.employees as AttendanceEmployee[]);
        setTotalImported(typeof data.totalImported === "number" ? data.totalImported : 0);
      }
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

  // Restore the last saved date range so returning users don't have to set it again.
  // Saved values are applied after hydration (async boundary) so the SSR markup stays
  // deterministic — reading localStorage in useState caused an attribute mismatch.
  useEffect(() => {
    const saved = readSavedRange();
    if (!saved) return;
    let active = true;
    (async () => {
      try {
        await Promise.resolve();
        if (!active) return;
        setReportFrom(saved.from);
        setReportTo(saved.to);
        if (!saved.active) return;
        const params = new URLSearchParams({ from: saved.from, to: saved.to });
        const response = await fetch(`/api/attendance?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to restore attendance report");
        if (!active) return;
        setRangeRecords(data.records as AttendanceEmployee[]);
        setRangeLabel(`${saved.from} to ${saved.to}`);
        setDate(saved.to);
      } catch {
        // Ignore restore failures; the user can generate the report again.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dailyRows: AttendanceListRow[] = employees.map((employee) => ({
    ...employee,
    totalMinutes: attendanceMinutes(employee.attendance),
    hasPunches: Boolean(employee.attendance?.punches.length),
  }));
  const rangeRowsByEmployee = new Map<number, AttendanceListRow>();
  for (const employee of rangeRecords ?? []) {
    const minutes = attendanceMinutes(employee.attendance);
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
  const sortedDailyRows = sortAttendanceRows(filteredEmployees, attendanceSort);
  const sortedRangeRows = filteredRangeRecords ? sortAttendanceRows(filteredRangeRecords, attendanceSort) : null;
  const dailyPageCount = Math.max(1, Math.ceil(sortedDailyRows.length / pageSize));
  const rangePageCount = Math.max(1, Math.ceil((sortedRangeRows?.length ?? 0) / pageSize));
  const visibleDailyRows = sortedDailyRows.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);
  const visibleRangeRows = sortedRangeRows?.slice((rangePage - 1) * pageSize, rangePage * pageSize) ?? null;

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

  const generateRangeReport = async () => {
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
      saveSavedRange(reportFrom, reportTo, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate attendance report");
    } finally {
      setRangeLoading(false);
    }
  };

  const refreshReport = async () => {
    setRefreshing(true);
    setMessage("");
    try {
      if (rangeRecords) {
        setRangeRecords(await fetchRangeRecords(reportFrom, reportTo));
      } else {
        await loadReport();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh the attendance report");
    } finally {
      setRefreshing(false);
    }
  };

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setMessage("");
    setNotice("");
    let imported = 0;
    let duplicates = 0;
    let unmatched = 0;
    let skipped = 0;
    const failures: string[] = [];
    try {
      // Upload sequentially so each file gets its own transaction and counts stay accurate.
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        try {
          const response = await fetch("/api/attendance", { method: "POST", body: formData });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Unable to upload attendance records");
          imported += data.importedRows || 0;
          duplicates += data.duplicateRows || 0;
          unmatched += data.unmatchedRows || 0;
          skipped += data.skippedRows || 0;
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
        }
      }

      await loadReport();
      if (rangeRecords) {
        try {
          setRangeRecords(await fetchRangeRecords(reportFrom, reportTo));
        } catch (refreshError) {
          setMessage(refreshError instanceof Error ? refreshError.message : "Unable to refresh the attendance report");
        }
      }

      if (failures.length === files.length) {
        setMessage(`Upload failed. ${failures.join(" · ")}`);
        return;
      }

      setNoticeTitle("Upload complete");
      const summary = files.length === 1
        ? `${files[0].name}: ${imported} punches imported, ${duplicates} duplicates skipped, ${unmatched} unmatched biometric numbers, and ${skipped} invalid rows skipped.`
        : `${files.length} files processed: ${imported} punches imported, ${duplicates} duplicates skipped, ${unmatched} unmatched biometric numbers, and ${skipped} invalid rows skipped.`;
      setNotice(failures.length > 0 ? `${summary} Failed: ${failures.join(" · ")}` : summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload attendance records");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const backupRecords = async () => {
    setMessage("");
    try {
      const response = await fetch("/api/attendance?format=csv");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to back up attendance records");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-backup-${localDateValue()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to back up attendance records");
    }
  };

  const deleteAllRecords = async () => {
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch("/api/attendance", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete attendance records");
      setConfirmDeleteOpen(false);
      await loadReport();
      if (rangeRecords) {
        try {
          setRangeRecords(await fetchRangeRecords(reportFrom, reportTo));
        } catch (refreshError) {
          setMessage(refreshError instanceof Error ? refreshError.message : "Unable to refresh the attendance report");
        }
      }
      setNoticeTitle("Records deleted");
      setNotice(data.message || "All uploaded attendance records have been deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete attendance records");
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const renderEmployeeRow = (employee: AttendanceListRow, rowKey: string, scope: "range" | "day") => {
    const name = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
    const employer = employee.employer?.name || "Not set";
    const values = [name || "Not set", employee.biometricNo || "Not set", employee.branch || "Not set", employee.position || "Not set", employer];
    const duration = employee.totalMinutes === null
      ? "—"
      : `${String(Math.floor(employee.totalMinutes / 60)).padStart(3, "0")}:${String(employee.totalMinutes % 60).padStart(2, "0")}`;
    return <article key={rowKey} className={`${GRID_ROW} gap-y-2 border-b border-slate-100 py-2 last:border-b-0`}>
      {values.map((value, index) => <div key={`${rowKey}-${index}`} className={`${index === 0 ? "" : "hidden sm:block"} min-w-0 break-words text-sm font-medium text-slate-900`}>{value}</div>)}
      <div key={`${rowKey}-duration`} className="hidden whitespace-nowrap text-right text-sm font-bold text-slate-900 sm:block">{duration}</div>
      <div key={`${rowKey}-report-gap`} aria-hidden="true" className="hidden xl:block" />
      <div key={`${rowKey}-actions`} className="flex items-center gap-1">
        <button type="button" onClick={() => setReportTarget({ employee, scope, autoPrint: false })} aria-label={`View attendance report for ${name}`} title="View report" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <EyeIcon className="h-4 w-4" />
        </button>
      </div>
    </article>;
  };

  const renderEmployeeList = (rows: AttendanceListRow[], keyPrefix: string, emptyMessage: string) => <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className={`${GRID_ROW} bg-slate-100 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600`}>
      {([ ["name", "Name", ""], ["biometricNo", "Biometric Number", "hidden sm:block"], ["branch", "Branch", "hidden sm:block"], ["position", "Position", "hidden sm:block"], ["employer", "Employer", "hidden sm:block"], ["totalMinutes", "Total Duration", "hidden whitespace-nowrap text-right sm:block"] ] as [AttendanceSortColumn, string, string][]).map(([column, label, className]) => <div key={column} role="columnheader" aria-sort={attendanceSort.column === column ? (attendanceSort.direction === "asc" ? "ascending" : "descending") : "none"} className={className}>
        <button type="button" onClick={() => { setAttendanceSort((current) => ({ column, direction: current.column === column && current.direction === "asc" ? "desc" : "asc" })); setDailyPage(1); setRangePage(1); }} className={`inline-flex max-w-full items-center gap-1 rounded-sm text-left hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${column === "totalMinutes" ? "ml-auto" : ""}`}>
          <span>{label}</span>
          <span aria-hidden="true" className="shrink-0">
            {attendanceSort.column === column
              ? attendanceSort.direction === "asc" ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />
              : <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-50" />}
          </span>
        </button>
      </div>)}
      <div aria-hidden="true" className="hidden xl:block" />
      <div className="hidden sm:block">Report</div>
    </div>
    {rows.length === 0 && <p className="m-4 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{emptyMessage}</p>}
    {rows.map((employee, index) => renderEmployeeRow(employee, `${keyPrefix}-${employee.id}-${index}`, keyPrefix === "range" ? "range" : "day"))}
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:px-4">
      <span>Showing {keyPrefix === "range" ? Math.min((rangePage - 1) * pageSize + 1, filteredRangeRecords?.length ?? 0) : Math.min((dailyPage - 1) * pageSize + 1, filteredEmployees.length)}–{keyPrefix === "range" ? Math.min(rangePage * pageSize, filteredRangeRecords?.length ?? 0) : Math.min(dailyPage * pageSize, filteredEmployees.length)} of {keyPrefix === "range" ? filteredRangeRecords?.length ?? 0 : filteredEmployees.length}</span>
      {((keyPrefix === "range" ? rangePageCount : dailyPageCount) > 1) && <nav aria-label={`${keyPrefix} attendance pages`} className="flex items-center gap-1">
        <button type="button" disabled={(keyPrefix === "range" ? rangePage : dailyPage) <= 1} onClick={() => keyPrefix === "range" ? setRangePage((page) => Math.max(1, page - 1)) : setDailyPage((page) => Math.max(1, page - 1))} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <span className="px-2">Page {keyPrefix === "range" ? rangePage : dailyPage} of {keyPrefix === "range" ? rangePageCount : dailyPageCount}</span>
        <button type="button" disabled={(keyPrefix === "range" ? rangePage : dailyPage) >= (keyPrefix === "range" ? rangePageCount : dailyPageCount)} onClick={() => keyPrefix === "range" ? setRangePage((page) => page + 1) : setDailyPage((page) => page + 1)} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </nav>}
    </div>
  </div>;

  return (
    <main className="flex min-h-[calc(100dvh-8rem)] w-full min-w-0 flex-col overflow-x-hidden bg-slate-50 p-4 sm:p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col space-y-4">
        <div id="reports" className="flex w-full scroll-mt-24 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard" onClick={(event) => { if (window.matchMedia("(max-width: 767px)").matches) { event.preventDefault(); window.dispatchEvent(new Event("hrdb-open-sidebar")); } }} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </Link>
          <input ref={fileInputRef} type="file" multiple accept=".dat,.txt,.xls,.xlsx,application/vnd.ms-excel" onChange={uploadFile} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50">
            <ArrowUpTrayIcon className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
          </button>
          {totalImported !== null && (
            <span className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
              {totalImported.toLocaleString()} records uploaded
            </span>
          )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {totalImported !== null && totalImported > 0 && (
              <>
                <button type="button" onClick={() => void backupRecords()} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">
                  <ArrowDownTrayIcon className="h-4 w-4" /> Backup
                </button>
                <button type="button" onClick={() => setConfirmDeleteOpen(true)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="whitespace-nowrap text-base font-bold text-slate-500">Date Range:</span>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
              From:
              <input type="date" value={reportFrom} max={reportTo} onChange={(event) => setReportFrom(event.target.value)} className={`${inputClass} h-10`} />
            </label>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
              To:
              <input type="date" value={reportTo} min={reportFrom} onChange={(event) => setReportTo(event.target.value)} className={`${inputClass} h-10`} />
            </label>
            <button type="button" onClick={() => void generateRangeReport()} disabled={rangeLoading} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#172554] px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50">
              {rangeLoading ? "Loading..." : "Go"}
            </button>
            <button type="button" onClick={() => void refreshReport()} disabled={refreshing || rangeLoading} aria-label="Refresh report" title="Refresh report" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <select aria-label="Filter by branch" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="h-10 min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option value="">All branches</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
            <button type="button" onClick={() => setPrintAllOpen(true)} disabled={printAllItems.length === 0} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              <PrinterIcon className="h-4 w-4" /> Print
            </button>
          </div>
        </div>
        {notice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotice("")}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="upload-notice-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-xl">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                <h2 id="upload-notice-title" className="text-lg font-semibold text-slate-900">{noticeTitle}</h2>
              </div>
              <p className="mt-3 text-sm text-slate-700">{notice}</p>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setNotice("")} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">OK</button>
              </div>
            </div>
          </div>
        )}
        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDeleteOpen(false)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="delete-records-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-xl">
              <h2 id="delete-records-title" className="text-lg font-semibold text-slate-900">Delete all uploaded records?</h2>
              <p className="mt-2 text-sm text-slate-600">
                This will permanently remove every uploaded attendance record ({totalImported?.toLocaleString() ?? 0} punches), attendance day, and import history. This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDeleteOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={() => void deleteAllRecords()} disabled={deleting} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
        {message && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}

        {rangeRecords && <section className="flex flex-1 flex-col space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="font-semibold text-slate-700">Branch:</span><span>{branchFilter || "All branches"}</span></span>
              <span className="inline-flex items-center gap-2"><span className="font-semibold text-slate-700">Total Records:</span><span>{filteredRangeRecords?.length ?? 0} employees</span></span>
              <span className="inline-flex items-center gap-2"><span className="font-semibold text-slate-700">Period Covered:</span><span>{rangeLabel}</span></span>
            </div>
          </div>
          {renderEmployeeList(visibleRangeRows ?? [], "range", "No attendance records match this date range and filter.")}
        </section>}

        {!rangeRecords && (
          <section className="flex flex-1 flex-col space-y-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="font-semibold text-slate-700">Branch:</span><span>{branchFilter || "All branches"}</span></span>
              <span className="inline-flex items-center gap-2"><span className="font-semibold text-slate-700">Total Records:</span><span>{filteredEmployees.length} employees</span></span>
            </div>
            {loading ? <p role="status" className="mt-5 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Loading report...</p>
              : renderEmployeeList(visibleDailyRows, "day", employees.length ? "No employees match these filters." : "No active employees found.")}
          </section>
        )}

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
