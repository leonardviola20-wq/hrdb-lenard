"use client";

import { EyeIcon, PlusIcon, PrinterIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  formatLoanDateMdy, formatLoanStartDate, formatMoney, loanStartDateClass, monthNames,
} from "./format";
import { Field, LoanDetail } from "./SmallComponents";
import { inputClass } from "./constants";
import { Modal } from "./Modal";
import { DeleteConfirmDialog } from "./ReportsTables";
import type {
  ActiveLoanReport, Employer, LoanEditStatusState, LoanFormState, PaymentKind, SssLoan,
} from "./types";
import {
  getSssLoanTypeLabel, getSssLoanTypeListLabel, getSssLoanTypeShortLabel, isSssLoanType, sssLoanTypes,
} from "@/lib/sssLoanTypes";
import { isSssLoanStatus } from "@/lib/sssLoanStatus";
import { getSssLoanFirstAmortizationDate, parseSssLoanDateOnly } from "@/lib/sssLoanBalance";

export function LoanReportDialog({
  activeLoanReport, filteredLoans, activeLoanReportFilter, setActiveLoanReportFilter, currentMonth, currentYear, onClose,
}: {
  activeLoanReport: ActiveLoanReport;
  filteredLoans: SssLoan[];
  activeLoanReportFilter: "ALL" | "ACTIVE" | "UPCOMING" | "INACTIVE";
  setActiveLoanReportFilter: (value: "ALL" | "ACTIVE" | "UPCOMING" | "INACTIVE") => void;
  currentMonth: number;
  currentYear: number;
  onClose: () => void;
}) {
  return <Modal
    title="SSS Loan Report"
    subtitle={`Loan status as of ${monthNames[currentMonth - 1]} ${currentYear}`}
    meta={<div className="flex items-center gap-2"><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span>Filter</span><select aria-label="Loan report filter" value={activeLoanReportFilter} onChange={(event) => setActiveLoanReportFilter(event.target.value as typeof activeLoanReportFilter)} className="h-9 min-w-28 rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="UPCOMING">Upcoming</option><option value="INACTIVE">Inactive</option></select></label><button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#172554] px-3 text-xs font-semibold text-white hover:bg-blue-900 print:hidden"><PrinterIcon className="h-4 w-4" /> Print</button></div>}
    onClose={onClose}
    wide
    fullWidth
    printOnly
    footer={<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7 print:hidden"><p className="text-xs font-medium text-slate-500">Read-only report · This report has not been saved.</p><button type="button" onClick={onClose} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Back to SSS Loans</button></div>}
  >
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employer</p><p className="mt-1 font-semibold text-slate-900">{activeLoanReport.employerName}</p></div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan Accounts</p><p className="mt-1 font-semibold text-slate-900">{filteredLoans.length}</p></div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Combined Monthly Amortization</p><p className="mt-1 text-lg font-bold tabular-nums text-blue-950">{formatMoney(filteredLoans.reduce((total, loan) => total + Math.round(Number(loan.monthlyAmortization) * 100), 0) / 100)}</p></div>
    </div>
    {filteredLoans.length === 0
      ? <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-600">No {activeLoanReportFilter === "ALL" ? "" : `${activeLoanReportFilter.toLocaleLowerCase()} `}loan accounts match this filter.</p>
      : <div className="sss-loan-report-table overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-4 py-3 text-center">#</th><th className="px-4 py-3">Member</th><th className="px-4 py-3">Loan Type</th><th className="px-4 py-3">Loan Date</th><th className="px-4 py-3">Start Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Monthly</th><th className="px-4 py-3 text-right">Semi-Monthly</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{filteredLoans.map((loan, index) => <tr key={loan.id} className="text-slate-700">
          <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
          <td className="px-4 py-3"><div className="flex flex-col gap-0.5"><span className="font-semibold text-slate-900">{loan.employeeName}</span><span className="font-mono text-xs text-slate-600">{loan.employeeSssNumber || "—"}</span></div></td>
          <td className="px-4 py-3">{getSssLoanTypeShortLabel(loan.loanType)}</td>
          <td className="px-4 py-3">{formatLoanDateMdy(loan.loanDate)}</td>
          <td className="px-4 py-3">{formatLoanStartDate(loan)}</td>
          <td className="px-4 py-3">{loan.status}</td>
          <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatMoney(loan.monthlyAmortization)}</td>
          <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatMoney(Math.round(Number(loan.monthlyAmortization) * 100 / 2) / 100)}</td>
        </tr>)}</tbody>
      </table></div>}
  </Modal>;
}

export function LoanListDialog({
  loans, loanListSearch, setLoanListSearch, loanAccountFilter, setLoanAccountFilter, loanListStatus, setLoanListStatus,
  loanListError, loadingLoans, canManageLoans, kind, loadingActiveLoanReport, loadingLoanEmployees,
  openActiveLoanReport, openSssLoanForm, onLoanMenuAction, onClose, loanMenuOpenId, loanMenuRef,
}: {
  loans: SssLoan[];
  loanListSearch: string;
  setLoanListSearch: (value: string) => void;
  loanAccountFilter: string;
  setLoanAccountFilter: (value: string) => void;
  loanListStatus: "ACTIVE" | "INACTIVE";
  setLoanListStatus: (value: "ACTIVE" | "INACTIVE") => void;
  loanListError: string;
  loadingLoans: boolean;
  canManageLoans: boolean;
  kind: PaymentKind;
  loadingActiveLoanReport: boolean;
  loadingLoanEmployees: boolean;
  openActiveLoanReport: () => void;
  openSssLoanForm: () => void;
  onLoanMenuAction: (loan: SssLoan, action: "menu" | "view" | "update" | "delete") => void;
  onClose: () => void;
  loanMenuOpenId: number | null;
  loanMenuRef: React.RefObject<HTMLDivElement | null>;
}) {
  return <Modal title="SSS Loans" subtitle="Manage employee loan accounts and status." onClose={onClose} wide fullWidth>
    <div className="mb-4 flex flex-wrap items-end gap-3">
      {kind === "LOAN" && <button type="button" onClick={openActiveLoanReport} disabled={loadingActiveLoanReport} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><EyeIcon className="h-4 w-4" /> {loadingActiveLoanReport ? "Loading Report..." : "Report"}</button>}
      <button type="button" onClick={openSssLoanForm} disabled={loadingLoanEmployees} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"><PlusIcon className="h-4 w-4" /> {loadingLoanEmployees ? "Loading Employees..." : "Add"}</button>
      <label className="relative min-w-[190px] flex-1">
        <span className="sr-only">Search employee name or SS Number</span>
        <input value={loanListSearch} onChange={(event) => setLoanListSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search employee or SS Number" />
      </label>
      <label className="relative min-w-[150px] flex-shrink-0"><span className="sr-only">Loan Account Number</span><input value={loanAccountFilter} onChange={(event) => setLoanAccountFilter(event.target.value)} className={`${inputClass} min-w-[150px]`} placeholder="Loan Account Number" /></label>
      <label className="relative min-w-[130px] flex-shrink-0"><span className="sr-only">Status</span><select value={loanListStatus} onChange={(event) => setLoanListStatus(event.target.value as "ACTIVE" | "INACTIVE")} className={`${inputClass} min-w-[130px]`}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
    </div>
    {loanListError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanListError}</div>}
    {loadingLoans ? <p className="py-12 text-center text-sm text-slate-500">Loading SSS loans...</p>
      : loans.length === 0 ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No {loanListStatus.toLocaleLowerCase()} SSS loans match these filters.</p>
        : <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1320px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-[16%] px-4 py-3">Employee</th><th className="w-[12%] px-4 py-3">SS Number</th><th className="w-[15%] px-4 py-3">Loan Account Number</th><th className="w-[10%] px-4 py-3">Loan Date</th><th className="w-[12%] px-4 py-3">Start Date</th><th className="w-[12%] px-4 py-3">Loan Type</th><th className="w-[14%] px-4 py-3 text-right">Monthly Amortization</th><th className="w-[6%] px-4 py-3">Status</th><th className="w-[3%] px-4 py-3 text-center">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{loans.map((loan) => <tr key={loan.id} className="text-slate-700 hover:bg-slate-50">
            <td className="px-4 py-3 font-semibold text-slate-900">{loan.employeeName}</td>
            <td className="px-4 py-3 font-mono">{loan.employeeSssNumber || "—"}</td>
            <td className="px-4 py-3 font-mono">{loan.loanAccountNumber}</td>
            <td className="px-4 py-3">{formatLoanDateMdy(loan.loanDate)}</td>
            <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${loanStartDateClass(loan)}`}>{formatLoanStartDate(loan)}</span></td>
            <td className="px-4 py-3">{getSssLoanTypeListLabel(loan.loanType)}</td>
            <td className="px-4 py-3 text-right">{formatMoney(loan.monthlyAmortization)}</td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${loan.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{loan.status}</span></td>
            <td className="px-4 py-3"><div className="relative flex justify-center">
              {canManageLoans ? (
                <div ref={loanMenuOpenId === loan.id ? loanMenuRef : null} className="relative">
                  <button type="button" onClick={() => onLoanMenuAction(loan, "menu")} aria-label={`Actions for ${loan.employeeName} loan`} title="Loan actions" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200">⋯</button>
                  {loanMenuOpenId === loan.id && <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                    <button type="button" onClick={() => onLoanMenuAction(loan, "view")} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">View</button>
                    <button type="button" onClick={() => onLoanMenuAction(loan, "update")} className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Update</button>
                    <button type="button" onClick={() => onLoanMenuAction(loan, "delete")} className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"><TrashIcon className="h-4 w-4" /> Delete</button>
                  </div>}
                </div>
              ) : (
                <div className="flex justify-center gap-1">
                  <button type="button" onClick={() => onLoanMenuAction(loan, "view")} aria-label={`View ${loan.employeeName} loan`} title="View loan details" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"><EyeIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onLoanMenuAction(loan, "update")} aria-label={`Update ${loan.employeeName} loan`} title="Update loan" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200">✎</button>
                </div>
              )}
            </div></td>
          </tr>)}</tbody>
        </table></div>}
  </Modal>;
}

export function LoanFormModal({
  employers, loanForm, setLoanForm, loanEmployees, loadingLoanEmployees, loanFormError, loanFormSaving,
  loanEditStatus, setLoanEditStatus, mode, onSubmit, onClose, selectedLoanEmployee,
}: {
  employers: Employer[];
  loanForm: LoanFormState;
  setLoanForm: (updater: (current: LoanFormState) => LoanFormState) => void;
  loanEmployees: { id: number; firstName: string; middleName: string | null; lastName: string; employerName?: string | null; biometricNo?: string | null }[];
  loadingLoanEmployees: boolean;
  loanFormError: string;
  loanFormSaving: boolean;
  loanEditStatus: LoanEditStatusState;
  setLoanEditStatus: (updater: (current: LoanEditStatusState) => LoanEditStatusState) => void;
  mode: "create" | "edit" | "view";
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  selectedLoanEmployee: { biometricNo?: string | null } | null;
}) {
  const title = mode === "create" ? "Add SSS Loan" : mode === "edit" ? "Update SSS Loan" : "SSS Loan Details";
  const subtitle = mode === "create"
    ? "Salary and calamity amortization start in the second month after Loan Date; emergency loans start after the six-month moratorium."
    : loanForm.loanAccountNumber;
  const loanDate = parseSssLoanDateOnly(loanForm.loanDate);
  const isEditing = mode !== "view";
  return <Modal title={title} subtitle={subtitle} onClose={onClose}>
    {(mode === "edit" || mode === "create") && loanFormError && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loanFormError}</div>}
    {mode === "view" ? <dl className="grid gap-4 sm:grid-cols-2">
      <LoanDetail label="Loan Account Number" value={loanForm.loanAccountNumber} />
      <LoanDetail label="Transaction Number" value={loanForm.transactionNumber || "—"} />
      <LoanDetail label="Loan Type" value={getSssLoanTypeLabel(loanForm.loanType)} />
      <LoanDetail label="Loan Date" value={loanForm.loanDate || "—"} />
      <LoanDetail label="Approved Loan Amount" value={loanForm.loanAmount ? formatMoney(loanForm.loanAmount) : "Unknown"} />
      <LoanDetail label="Monthly Amortization" value={formatMoney(loanForm.monthlyAmortization)} />
      <LoanDetail label="Status" value={loanEditStatus.status} />
    </dl> : <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === "create" && <Field label="Employer" required><select required value={loanForm.employerId} onChange={(event) => setLoanForm((current) => ({ ...current, employerId: event.target.value, employeeId: "" }))} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}</select></Field>}
        {mode === "create" && <Field label="Select Employee" required><select required value={loanForm.employeeId} onChange={(event) => setLoanForm((current) => ({ ...current, employeeId: event.target.value }))} disabled={!loanForm.employerId || loadingLoanEmployees} className={inputClass}><option value="">{loadingLoanEmployees ? "Loading employees..." : loanForm.employerId ? "Select employee from all employers" : "Select employer first"}</option>{loanEmployees.map((employee) => <option key={employee.id} value={String(employee.id)}>{`${employee.lastName}, ${employee.firstName}`}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Employees from all employers are available. The loan will be recorded under the selected loan Employer. A Biometric Number is required to save.</span>{selectedLoanEmployee && !selectedLoanEmployee.biometricNo?.trim() && <span className="mt-1 block text-xs text-amber-700">Add a Biometric Number to this employee profile before saving the loan.</span>}</Field>}
        <Field label="Loan Account Number" required><input required maxLength={80} value={loanForm.loanAccountNumber} onChange={(event) => setLoanForm((current) => ({ ...current, loanAccountNumber: event.target.value }))} className={inputClass} /></Field>
        <Field label="Transaction Number"><input maxLength={80} value={loanForm.transactionNumber} onChange={(event) => setLoanForm((current) => ({ ...current, transactionNumber: event.target.value }))} className={inputClass} /></Field>
        <Field label="Loan Type" required><select required value={loanForm.loanType} onChange={(event) => {
          const value = event.target.value;
          if (isSssLoanType(value)) setLoanForm((current) => ({ ...current, loanType: value }));
        }} className={inputClass}>{sssLoanTypes.map((loanType) => <option key={loanType.code} value={loanType.code}>{getSssLoanTypeLabel(loanType.code)}</option>)}</select></Field>
        <Field label="Loan Date" required><input required type="date" min="0001-01-01" max="9999-12-31" value={loanForm.loanDate} onChange={(event) => setLoanForm((current) => ({ ...current, loanDate: event.target.value }))} className={inputClass} /></Field>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 sm:col-span-2">{loanDate ? `Payment starts in ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(getSssLoanFirstAmortizationDate(loanDate, loanForm.loanType))}.` : "Enter a valid Loan Date using a four-digit year to see the first payment month."}</p>
        <Field label="Approved Loan Amount"><input type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.loanAmount} onChange={(event) => setLoanForm((current) => ({ ...current, loanAmount: event.target.value }))} className={inputClass} placeholder="Optional if unknown" /></Field>
        <Field label="Monthly Amortization" required><input required type="number" min="0.01" max="999999999.99" step="0.01" value={loanForm.monthlyAmortization} onChange={(event) => setLoanForm((current) => ({ ...current, monthlyAmortization: event.target.value }))} className={inputClass} /></Field>
        {mode === "edit" && <Field label="Status" required><select required value={loanEditStatus.status} onChange={(event) => {
          const status = event.target.value;
          if (isSssLoanStatus(status)) setLoanEditStatus((current) => ({ ...current, status, reason: "" }));
        }} className={inputClass}><option value="ACTIVE">Active</option><option value="ON_HOLD">On-Hold</option><option value="PAID">Paid</option><option value="NOT_CONNECTED">Not connected</option></select></Field>}
        {mode === "edit" && loanEditStatus.status === "PAID" && <Field label="Paid Reason" required><select required value={loanEditStatus.reason} onChange={(event) => setLoanEditStatus((current) => ({ ...current, reason: event.target.value }))} className={inputClass}><option value="">Select reason</option><option value="APPLIED_FOR_NEW_LOAN">Applied for new loan</option><option value="FULLY_PAID">Fully paid</option></select></Field>}
        {mode === "edit" && loanEditStatus.status === "NOT_CONNECTED" && <p className="self-end rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Reason: Resigned</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} disabled={loanFormSaving} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        {isEditing && <button type="submit" disabled={loanFormSaving || (mode === "edit" && loanEditStatus.status === "PAID" && !loanEditStatus.reason)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loanFormSaving ? "Saving..." : "Save Changes"}</button>}
      </div>
    </form>}
  </Modal>;
}

export function LoanDeleteDialog({
  target, saving, error, onCancel, onConfirm,
}: {
  target: SssLoan | null;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  return <Modal title="Delete SSS Loan?" subtitle="This action cannot be undone." onClose={onCancel}>
    <DeleteConfirmDialog
      message={<>Delete the loan account <strong>{target.loanAccountNumber}</strong> for <strong>{target.employeeName}</strong>? Existing SSS report rows will retain their saved account-number snapshots.</>}
      error={error}
      saving={saving}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Delete Loan"
    />
  </Modal>;
}


