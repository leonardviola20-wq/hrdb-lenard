"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { formatDurationClock } from "@/lib/duration";

export type PrintReportEmployee = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  biometricNo: string | null;
  branch: string | null;
  position: string | null;
  status: string | null;
};

export type PrintReportRecord = {
  attendance: {
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    punches: { time: string }[];
  } | null;
};

type ReportRow = {
  date: string;
  timeIn: string;
  breakOut: string;
  breakIn: string;
  timeOut: string;
  otIn: string;
  otOut: string;
  minutes: number;
};

type Props = {
  employee: PrintReportEmployee;
  records: PrintReportRecord[];
  from: string;
  to: string;
  autoPrint?: boolean;
  onClose: () => void;
};

function toMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function dateList(from: string, to: string) {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (!Number.isNaN(cursor.getTime()) && cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function buildRows(records: PrintReportRecord[], from: string, to: string): ReportRow[] {
  const attendanceByDate = new Map<string, PrintReportRecord["attendance"]>();
  for (const record of records) {
    if (record.attendance) attendanceByDate.set(record.attendance.date.slice(0, 10), record.attendance);
  }

  return dateList(from, to).map((date) => {
    const attendance = attendanceByDate.get(date) ?? null;
    const punches = [...new Set((attendance?.punches ?? []).map((punch) => punch.time.slice(0, 5)))].sort();

    let timeIn = punches[0] ?? "";
    let timeOut = punches.length > 1 ? punches[punches.length - 1] : "";
    let breakOut = "";
    let breakIn = "";
    let otIn = "";
    let otOut = "";

    if (punches.length === 0 && attendance) {
      timeIn = attendance.timeIn?.slice(0, 5) ?? "";
      timeOut = attendance.timeOut?.slice(0, 5) ?? "";
    } else if (punches.length === 5) {
      // 5 punches: in, breaks, out plus a trailing re-scan. Keep the last punch as
      // Time Out and leave OT blank so OT can never appear before Time Out.
      breakOut = punches[1];
      breakIn = punches[2];
    } else if (punches.length >= 6) {
      // Overtime day: in, break out, break in, Time Out, OT In, OT Out (strict chronological order).
      breakOut = punches[1];
      breakIn = punches[2];
      timeOut = punches[3];
      otIn = punches[4];
      otOut = punches[5];
    } else if (punches.length >= 2) {
      // 2-4 punches: in, optional breaks, out.
      const middle = punches.slice(1, punches.length - 1);
      breakOut = middle[0] ?? "";
      breakIn = middle[1] ?? "";
    }

    let minutes = 0;
    if (timeIn && timeOut) {
      minutes = toMinutes(timeOut) - toMinutes(timeIn);
      if (breakOut && breakIn) minutes -= toMinutes(breakIn) - toMinutes(breakOut);
      if (otIn && otOut) minutes += toMinutes(otOut) - toMinutes(otIn);
      if (minutes < 0) minutes = 0;
    }

    return { date, timeIn, breakOut, breakIn, timeOut, otIn, otOut, minutes };
  });
}

const columns = ["Time In", "Break Out", "Break In", "Time Out", "OT In", "OT Out"] as const;

// Break-adjusted minutes for a single attendance day, using the exact same
// calculation as the printable report so list totals always match the report.
export function attendanceMinutes(attendance: PrintReportRecord["attendance"]): number | null {
  if (!attendance) return null;
  const row = buildRows([{ attendance }], attendance.date.slice(0, 10), attendance.date.slice(0, 10))[0];
  return row ? row.minutes : null;
}

export default function AttendancePrintReport({ employee, records, from, to, autoPrint, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 100);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  if (typeof document === "undefined") return null;

  const rows = buildRows(records, from, to);

  return createPortal(
    <div
      id="attendance-print-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Attendance report"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-6 print:static print:overflow-visible print:bg-white print:p-0"
    >
      <div className="attendance-sheet mx-auto w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl sm:p-8 print:m-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="mb-5 flex justify-end gap-2 print:hidden">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
        </div>

        <ReportSheet employee={employee} rows={rows} />
      </div>
    </div>,
    document.body
  );
}

function ReportSheet({ employee, rows }: { employee: PrintReportEmployee; rows: ReportRow[] }) {
  const totalMinutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  const displayName = `${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName.charAt(0)}.` : ""}`;
  const idNumber = employee.biometricNo ? employee.biometricNo.padStart(9, "0") : "Not set";

  return (
    <div id="attendance-report" className="text-slate-900 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      <h1 className="border-b-[3px] border-slate-900 pb-2 text-xl font-bold tracking-tight">Attendance Report</h1>

      <p className="mt-4 flex items-center gap-2 text-sm">
        <span className="font-semibold">Branch:</span>
        <span className="min-w-[190px] border-b border-slate-500 pb-0.5">{employee.branch || "Not set"}</span>
      </p>

      <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2"><span className="font-semibold">Name:</span><span className="min-w-0 flex-1 truncate border-b border-slate-500 pb-0.5">{displayName}</span></p>
        <p className="flex items-center gap-2"><span className="font-semibold">Position:</span><span className="min-w-0 flex-1 truncate border-b border-slate-500 pb-0.5">{employee.position || "Not set"}</span></p>
        <p className="flex items-center gap-2"><span className="font-semibold">ID Number:</span><span className="min-w-0 flex-1 border-b border-slate-500 pb-0.5 font-mono">{idNumber}</span></p>
        <p className="flex items-center gap-2"><span className="font-semibold">Status:</span><span className="min-w-0 flex-1 truncate border-b border-slate-500 pb-0.5">{employee.status || "Not set"}</span></p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-700 text-[11px] uppercase tracking-wide text-white">
              <th scope="col" className="px-1.5 py-1.5 font-semibold">LogDate</th>
              {columns.map((column) => <th key={column} scope="col" className="px-1.5 py-1.5 font-semibold">{column}</th>)}
              <th scope="col" className="px-1.5 py-1.5 text-right font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="border-b border-slate-200 odd:bg-slate-50">
                <td className="whitespace-nowrap px-1.5 py-1">{row.date}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.timeIn}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.breakOut}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.breakIn}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.timeOut}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.otIn}</td>
                <td className="whitespace-nowrap px-1.5 py-1">{row.otOut}</td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right font-medium">{formatDurationClock(row.minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-b border-slate-600 pb-1">
        <div className="h-8" aria-hidden="true" />
        <p className="text-base font-bold">Total Duration = {Math.floor(totalMinutes / 60)} hours {totalMinutes % 60} minutes</p>
      </div>
    </div>
  );
}

export function AttendancePrintAllReport({ items, from, to, onClose }: {
  items: { employee: PrintReportEmployee; records: PrintReportRecord[] }[];
  from: string;
  to: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      id="attendance-print-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Attendance report print preview"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-6 print:static print:overflow-visible print:bg-white print:p-0"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 pb-6 print:space-y-0 print:pb-0">
        <div className="flex justify-end gap-2 print:hidden">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
            <PrinterIcon className="h-4 w-4" /> Print all
          </button>
        </div>
        {items.map((item, index) => (
          <div key={`${item.employee.lastName}-${item.employee.firstName}-${index}`} className="break-after-page rounded-lg bg-white p-6 shadow-xl last:break-after-auto print:m-0 print:rounded-none print:p-0 print:shadow-none">
            <p className="mb-3 border-b border-dashed border-slate-200 pb-1 text-right text-xs font-semibold text-slate-400 print:hidden">Employee {index + 1} of {items.length}</p>
            <ReportSheet employee={item.employee} rows={buildRows(item.records, from, to)} />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

