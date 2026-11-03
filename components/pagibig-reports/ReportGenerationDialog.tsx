"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { EmployeePicker } from "@/components/pagibig-reports/EmployeePicker";
import { ReportPreviewTable } from "@/components/pagibig-reports/ReportPreviewTable";
import { inputClass, labelClass } from "@/components/pagibig-reports/constants";
import type { Account, Member, Report, ReportDraft, ReportEmployer } from "@/components/pagibig-reports/types";
import type { PagibigPreviewFilter } from "@/lib/pagibigReportPreview";

type ReportGenerationDialogProps = {
  open: boolean;
  form: {
    manual: boolean;
    kind: "CONTRIBUTION" | "LOAN";
    pin: string;
    month: string;
    year: string;
    draftId: number | null;
    updatingReportId: number | null;
    pickerOpen: boolean;
    employeeId: string;
  };
  employer: ReportEmployer | null;
  selectedEmployerId: string;
  reports: Report[];
  reportDrafts: ReportDraft[];
  monthNames: string[];
  employees: {
    loading: boolean;
    error: string;
    options: Member[];
  };
  preview: {
    loading: boolean;
    error: string;
    year: string;
    filter: PagibigPreviewFilter;
    filteredMembers: Member[];
    entryCount: number;
    showSavingsColumns: boolean;
    showLoanColumns: boolean;
    columnCount: number;
    total: (field: keyof Account) => number;
    overall: number;
  };
  savingDraft: boolean;
  generating: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onSetKind: Dispatch<SetStateAction<"CONTRIBUTION" | "LOAN">>;
  onSetPin: Dispatch<SetStateAction<string>>;
  onSetMonth: Dispatch<SetStateAction<string>>;
  onSetEmployeePickerOpen: Dispatch<SetStateAction<boolean>>;
  onSetEmployeeId: Dispatch<SetStateAction<string>>;
  onYearChange: (year: string) => void;
  onAddAllEmployees: () => void;
  onToggleEmployeePicker: () => void;
  onAddEmployee: (employeeId: string) => void;
  onSaveDraft: () => void;
  onGenerateReport: () => void;
  onEditAccount: (member: Member, fromPreview: boolean) => void;
  onRemoveEmployee: (employeeId: number) => void;
};

export function ReportGenerationDialog({
  open,
  form,
  employer,
  selectedEmployerId,
  reports,
  reportDrafts,
  monthNames,
  employees,
  preview,
  savingDraft,
  generating,
  onClose,
  onCancel,
  onSubmit,
  onSetKind,
  onSetPin,
  onSetMonth,
  onSetEmployeePickerOpen,
  onSetEmployeeId,
  onYearChange,
  onAddAllEmployees,
  onToggleEmployeePicker,
  onAddEmployee,
  onSaveDraft,
  onGenerateReport,
  onEditAccount,
  onRemoveEmployee,
}: ReportGenerationDialogProps) {
  if (!open) return null;

  const reportExists = (report: Report) =>
    report.applicableMonth === Number(form.month) &&
    report.applicableYear === Number(form.year) &&
    (form.manual ? report.manual && report.kind === form.kind : !report.manual);
  const draftExists = reportDrafts.some(
    (draft) =>
      draft.id !== form.draftId &&
      draft.applicableMonth === Number(form.month) &&
      draft.applicableYear === Number(form.year) &&
      draft.kind === (form.manual ? form.kind : "CONTRIBUTION"),
  );
  const hasReport = reports.some(reportExists);
  const hasOtherReport = reports.some(
    (report) => report.id !== form.updatingReportId && reportExists(report),
  );
  const employerLabel =
    employer?.id === Number(selectedEmployerId)
      ? `${employer.name} · ${employer.pagibigNumber || "-"}`
      : " ";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 p-3 pt-6 sm:p-6 sm:pt-12">
      <form
        onSubmit={onSubmit}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              Generate Pag-IBIG {form.manual ? "Manual " : ""}Report
            </h2>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{employerLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-3 shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 p-5">
          {form.manual && (
            <label className="w-40">
              <span className={labelClass}>Report Type</span>
              <select
                value={form.kind}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "CONTRIBUTION" || value === "LOAN") onSetKind(value);
                }}
                className={inputClass}
              >
                <option value="CONTRIBUTION">Contribution</option>
                <option value="LOAN">Loan</option>
              </select>
            </label>
          )}
          <label className="w-40">
            <span className={labelClass}>
              {form.manual ? "Invoice No." : "Payment Identification Number (PIN)"}
            </span>
            <input
              required
              maxLength={120}
              value={form.pin}
              onChange={(event) => onSetPin(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="w-40">
            <span className={labelClass}>Applicable Month</span>
            <select
              value={form.month}
              onChange={(event) => onSetMonth(event.target.value)}
              className={inputClass}
            >
              {monthNames.map((month, index) => {
                const disabled = reports.some(
                  (report) =>
                    report.applicableMonth === index + 1 &&
                    report.applicableYear === Number(form.year) &&
                    (form.manual
                      ? report.manual && report.kind === form.kind
                      : !report.manual),
                );

                return (
                  <option key={month} value={index + 1} disabled={disabled}>
                    {month}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="w-28">
            <span className={labelClass}>Year</span>
            <input
              required
              type="number"
              min="2020"
              max="2200"
              value={form.year}
              onChange={(event) => onYearChange(event.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={onAddAllEmployees}
            disabled={employees.loading || preview.loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add All
          </button>
          <button
            type="button"
            onClick={onToggleEmployeePicker}
            disabled={employees.loading || Boolean(employees.error)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add Employee
          </button>
        </div>

        <div className="px-5 pb-5">
          {preview.error && (
            <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {preview.error}
            </p>
          )}
          {preview.loading && (
            <p role="status" className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
              Loading account data for {form.year}.
            </p>
          )}
          {employees.loading && (
            <p role="status" className="mb-3 text-sm text-slate-600">
              Loading employee roster...
            </p>
          )}
          {employees.error && (
            <p role="alert" className="mb-3 text-sm text-rose-700">
              {employees.error}
            </p>
          )}
          {form.pickerOpen && (
            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <span id="pagibig-report-employee-picker-label" className={labelClass}>
                  Select an employee to add to this report form
                </span>
                <EmployeePicker
                  options={employees.options}
                  value={form.employeeId}
                  onChange={(employeeId) => {
                    onSetEmployeeId(employeeId);
                    onAddEmployee(employeeId);
                  }}
                  disabled={employees.loading || preview.loading}
                  labelId="pagibig-report-employee-picker-label"
                  closeOnSelect={false}
                />
              </div>
              <button
                type="button"
                onClick={() => onSetEmployeePickerOpen(false)}
                disabled={preview.loading}
                className="mt-6 h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                Done
              </button>
            </div>
          )}

          <ReportPreviewTable
            filteredPreviewMembers={preview.filteredMembers}
            previewFilter={preview.filter}
            showSavingsColumns={preview.showSavingsColumns}
            showLoanColumns={preview.showLoanColumns}
            previewColumnCount={preview.columnCount}
            reportYear={form.year}
            previewTotal={preview.total}
            previewOverall={preview.overall}
            onEditAccount={onEditAccount}
            onRemoveEmployee={onRemoveEmployee}
          />
        </div>

        <div className="sticky bottom-0 z-20 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={savingDraft || preview.loading || hasReport || draftExists}
            onClick={onSaveDraft}
            className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
          >
            {savingDraft ? "Saving draft..." : form.draftId ? "Update Draft" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={
              generating ||
              preview.loading ||
              preview.year !== form.year ||
              preview.entryCount === 0 ||
              hasOtherReport
            }
            className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {generating
              ? "Saving..."
              : form.updatingReportId
                ? "Update Report"
                : "Save Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
