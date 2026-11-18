"use client";

import { useState, type FormEventHandler } from "react";
import { createLoan, updateLoan, type LoanEmployee, type LoanRow } from "@/app/actions/loans";

type Props = {
  employees: LoanEmployee[];
  /** Employees linked to detached loans must stay selectable so edit mode can restore the original choice. */
  extraEmployeeNames?: Map<number, string>;
  provider: "SSS" | "PAGIBIG";
  editingLoan?: LoanRow;
  onSaved: () => void;
  onCancel: () => void;
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

const sssLoanTypes = ["Salary", "Calamity", "Emergency"];
const pagibigLoanTypes = ["MPL", "Calamity", "Emergency", "SAFE"];

export default function LoanDetailsForm({
  employees, provider, editingLoan, extraEmployeeNames, onSaved, onCancel,
}: Props) {
  const isPagibig = provider === "PAGIBIG";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError("");
    const shared = {
      employeeId: Number(data.get("employeeId")),
      provider,
      loanType: String(data.get("loanType")),
      loanAccountNumber: String(data.get("loanAccountNumber")),
      loanDate: String(data.get("loanDate") ?? ""),
      terms: String(data.get("terms") ?? ""),
      status: String(data.get("status") ?? "ACTIVE"),
      statusReason: String(data.get("statusReason") ?? ""),
      totalAmount: String(data.get("totalAmount")),
      monthlyAmortization: String(data.get("monthlyAmortization")),
    };
    try {
      if (editingLoan) {
        await updateLoan({ ...shared, id: editingLoan.id });
      } else {
        await createLoan(shared);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the loan.");
    } finally {
      setSaving(false);
    }
  };

  const loanTypeOptions = isPagibig ? pagibigLoanTypes : sssLoanTypes;
  const statusValue = editingLoan?.status ?? "ACTIVE";

  return (
    <form onSubmit={submit} className="grid gap-4" key={provider}>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="loan-employee" className={labelClass}>Employee <span className="text-red-600">*</span></label>
          <select id="loan-employee" name="employeeId" required defaultValue={editingLoan?.employeeId ? String(editingLoan.employeeId) : ""} className={inputClass}>
            <option value="" disabled>Select employee</option>
            {editingLoan?.employeeId && !employees.some((employee) => employee.id === editingLoan.employeeId) && (
              <option value={editingLoan.employeeId}>
                {extraEmployeeNames?.get(editingLoan.employeeId) ?? editingLoan.employeeName}
              </option>
            )}
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="loan-type" className={labelClass}>Loan Type <span className="text-red-600">*</span></label>
          <select id="loan-type" name="loanType" required defaultValue={editingLoan?.loanType ?? ""} className={inputClass}>
            <option value="" disabled>Select loan type</option>
            {loanTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loan-account" className={labelClass}>
            {isPagibig ? "Application No." : "Loan Account Number"} <span className="text-red-600">*</span>
          </label>
          <input id="loan-account" name="loanAccountNumber" required defaultValue={editingLoan?.loanAccountNumber ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="loan-date" className={labelClass}>Loan Date</label>
          <input id="loan-date" name="loanDate" type="date" defaultValue={editingLoan?.loanDate ?? ""} className={inputClass} />
        </div>
        {isPagibig && (
          <div>
            <label htmlFor="loan-terms" className={labelClass}>Terms (years)</label>
            <select id="loan-terms" name="terms" defaultValue={editingLoan?.terms ?? ""} className={inputClass}>
              <option value="">Not set</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="loan-status" className={labelClass}>Status</label>
          <select
            id="loan-status"
            name="status"
            defaultValue={statusValue}
            onChange={(event) => {
              const reasonField = document.getElementById("loan-status-reason") as HTMLSelectElement | null;
              if (reasonField) reasonField.disabled = event.target.value !== "INACTIVE";
            }}
            className={inputClass}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div>
          <label htmlFor="loan-status-reason" className={labelClass}>Reason</label>
          <select
            id="loan-status-reason"
            name="statusReason"
            defaultValue={editingLoan?.statusReason ?? ""}
            disabled={statusValue !== "INACTIVE"}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
          >
            <option value="">Select reason</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label htmlFor="loan-total" className={labelClass}>Loan Amount (₱)</label>
          <input id="loan-total" name="totalAmount" type="number" min="0.01" step="0.01" defaultValue={editingLoan?.totalAmount ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="loan-amortization" className={labelClass}>Monthly Amortization (₱) <span className="text-red-600">*</span></label>
          <input id="loan-amortization" name="monthlyAmortization" type="number" min="0.01" step="0.01" required defaultValue={editingLoan?.monthlyAmortization ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving || employees.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Saving..." : editingLoan ? "Save Changes" : "Add Loan"}
        </button>
      </div>
    </form>
  );
}
