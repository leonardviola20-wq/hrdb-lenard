"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import Link from "next/link";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { EmployeePicker } from "@/components/pagibig-reports/EmployeePicker";
import { MoneyInput } from "@/components/pagibig-reports/MoneyInput";
import { inputClass, labelClass } from "@/components/pagibig-reports/constants";
import {
  emptyLoanDetail,
  formatAmount,
  formatEmployeeName,
  loanLabels,
} from "@/components/pagibig-reports/format";
import type { AccountForm, LoanDetail, Member } from "@/components/pagibig-reports/types";
import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";

type AccountStatus = "ACTIVE" | "INACTIVE";

type AccountFormDialogProps = {
  open: boolean;
  editingMember: Member | null;
  accountForm: AccountForm;
  setAccountForm: Dispatch<SetStateAction<AccountForm>>;
  allEmployees: Member[];
  allEmployeesError: string;
  allEmployeesLoading: boolean;
  accountError: string;
  savingAccount: boolean;
  createEmployeeHref: string | null;
  loanEditorType: PagibigLoanType | "" | null;
  setLoanEditorType: Dispatch<SetStateAction<PagibigLoanType | "" | null>>;
  loanEditorDetail: LoanDetail;
  setLoanEditorDetail: Dispatch<SetStateAction<LoanDetail>>;
  loanEditorReason: string;
  setLoanEditorReason: Dispatch<SetStateAction<string>>;
  loanEditorSourceType: PagibigLoanType | null;
  setLoanEditorSourceType: Dispatch<SetStateAction<PagibigLoanType | null>>;
  loanEditorBackup: { sourceType: PagibigLoanType; detail: LoanDetail } | null;
  setLoanEditorBackup: Dispatch<
    SetStateAction<{ sourceType: PagibigLoanType; detail: LoanDetail } | null>
  >;
  loanStatusFilter: AccountStatus;
  setLoanStatusFilter: Dispatch<SetStateAction<AccountStatus>>;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onSelectEmployee: (employeeId: string) => void;
  onOpenLoanEditor: (type: PagibigLoanType | "" | null) => void;
  onSaveLoanDetail: () => void;
  onDeleteLoanDetail: (type: PagibigLoanType) => void;
};

function AccountStatusButtons({
  value,
  allowInactive,
  onChange,
}: {
  value: boolean;
  allowInactive: boolean;
  onChange: (excludedFromReport: boolean) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
      role="group"
      aria-label="Pag-IBIG account status"
    >
      {(["ACTIVE", "INACTIVE"] as const).map((status) => {
        const active = status === "ACTIVE" ? !value : value;

        return (
          <button
            key={status}
            type="button"
            disabled={!allowInactive && status === "INACTIVE"}
            aria-pressed={active}
            onClick={() => onChange(status === "INACTIVE")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              active
                ? status === "ACTIVE"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-white"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {status === "ACTIVE" ? "Active" : "Inactive"}
          </button>
        );
      })}
    </div>
  );
}

export function AccountFormDialog({
  open,
  editingMember,
  accountForm,
  setAccountForm,
  allEmployees,
  allEmployeesError,
  allEmployeesLoading,
  accountError,
  savingAccount,
  createEmployeeHref,
  loanEditorType,
  setLoanEditorType,
  loanEditorDetail,
  setLoanEditorDetail,
  loanEditorReason,
  setLoanEditorReason,
  loanEditorSourceType,
  setLoanEditorSourceType,
  loanEditorBackup,
  setLoanEditorBackup,
  loanStatusFilter,
  setLoanStatusFilter,
  onClose,
  onSubmit,
  onSelectEmployee,
  onOpenLoanEditor,
  onSaveLoanDetail,
  onDeleteLoanDetail,
}: AccountFormDialogProps) {
  if (!open) return null;

  const availableLoanTypes = PAGIBIG_LOAN_TYPES.filter((type) => {
    const detail = accountForm.loanDetails[type];
    return !detail.applicationNo.trim() || detail.status !== "ACTIVE";
  });
  const visibleAccountLoanTypes = PAGIBIG_LOAN_TYPES.filter((type) => {
    const detail = accountForm.loanDetails[type];
    return detail.applicationNo.trim() && loanStatusFilter === "ACTIVE"
      ? detail.status === "ACTIVE"
      : detail.status.startsWith("INACTIVE");
  });
  const accountLoanCounts = {
    ACTIVE: PAGIBIG_LOAN_TYPES.filter(
      (type) =>
        accountForm.loanDetails[type].applicationNo.trim() &&
        accountForm.loanDetails[type].status === "ACTIVE",
    ).length,
    INACTIVE: PAGIBIG_LOAN_TYPES.filter(
      (type) =>
        accountForm.loanDetails[type].applicationNo.trim() &&
        accountForm.loanDetails[type].status.startsWith("INACTIVE"),
    ).length,
  };

  const cancelLoanEditor = () => {
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    if (loanEditorBackup) {
      setAccountForm((current) => ({
        ...current,
        loanDetails: {
          ...current.loanDetails,
          [loanEditorBackup.sourceType]: loanEditorBackup.detail,
        },
      }));
      setLoanEditorBackup(null);
    }
    setLoanEditorSourceType(null);
  };

  const closeLoanEditorFromBackdrop = () => {
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanEditorReason("");
    if (loanEditorBackup) {
      setAccountForm((current) => ({
        ...current,
        loanDetails: {
          ...current.loanDetails,
          [loanEditorBackup.sourceType]: loanEditorBackup.detail,
        },
      }));
      setLoanEditorBackup(null);
    }
    setLoanEditorSourceType(null);
  };

  const switchLoanType = (nextType: PagibigLoanType) => {
    if (loanEditorSourceType) {
      if (nextType === loanEditorSourceType && loanEditorBackup) {
        setAccountForm((current) => ({
          ...current,
          loanDetails: {
            ...current.loanDetails,
            [loanEditorSourceType]: loanEditorBackup.detail,
          },
        }));
        setLoanEditorBackup(null);
        setLoanEditorDetail(loanEditorBackup.detail);
        setLoanEditorType(nextType);
        return;
      }

      if (!loanEditorBackup) {
        setLoanEditorBackup({
          sourceType: loanEditorSourceType,
          detail: { ...loanEditorDetail },
        });
        setAccountForm((current) => ({
          ...current,
          loanDetails: {
            ...current.loanDetails,
            [loanEditorSourceType]: emptyLoanDetail(),
          },
        }));
      }
    }

    setLoanEditorType(nextType);
  };

  const selectAvailableLoanType = (value: string) => {
    const nextType = PAGIBIG_LOAN_TYPES.find((type) => type === value);
    if (!nextType) return;

    setLoanEditorType(nextType);
    if (loanEditorSourceType === null) {
      setLoanEditorDetail(emptyLoanDetail());
      setLoanEditorReason("");
      return;
    }

    const detail = { ...accountForm.loanDetails[nextType] };
    setLoanEditorDetail(detail);
    if (detail.status.startsWith("INACTIVE_")) {
      setLoanEditorReason(detail.status.slice("INACTIVE_".length));
      setLoanEditorDetail((current) => ({ ...current, status: "INACTIVE" }));
    } else {
      setLoanEditorReason("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="pagibig-account-form-scroll max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-50 shadow-2xl"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {editingMember ? "Edit Pag-IBIG Account" : "Add Pag-IBIG Account"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Member details, savings, MP2, and loan accounts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-3 sm:p-4">
          {editingMember ? (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xl font-bold leading-7 text-slate-950">
                  {formatEmployeeName(editingMember)}
                </p>
                <input
                  required
                  maxLength={40}
                  value={accountForm.midNumber || ""}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      midNumber: event.target.value,
                    }))
                  }
                  className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                  placeholder="Enter Pag-IBIG MID number"
                />
              </div>
              <AccountStatusButtons
                value={accountForm.excludedFromReport}
                allowInactive
                onChange={(excludedFromReport) =>
                  setAccountForm((current) => ({ ...current, excludedFromReport }))
                }
              />
            </div>
          ) : (
            <>
              {allEmployeesLoading && (
                <p role="status" className="text-sm text-slate-600">
                  Loading employees...
                </p>
              )}
              {allEmployeesError && (
                <p role="alert" className="text-sm text-red-600">
                  {allEmployeesError}
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span id="pagibig-employee-picker-label" className={labelClass}>
                    Name
                  </span>
                  <EmployeePicker
                    options={allEmployees}
                    value={accountForm.employeeId}
                    onChange={onSelectEmployee}
                    disabled={allEmployeesLoading || Boolean(allEmployeesError)}
                    prominent
                  />
                </div>
                <label>
                  <span className={labelClass}>MID Number</span>
                  <input
                    required
                    maxLength={40}
                    value={accountForm.midNumber}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        midNumber: event.target.value,
                      }))
                    }
                    className={`${inputClass} text-base font-semibold`}
                    placeholder="Enter Pag-IBIG MID number"
                  />
                </label>
              </div>
              {createEmployeeHref && (
                <Link
                  href={createEmployeeHref}
                  className="inline-flex text-sm font-semibold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  Create new employee
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-semibold text-slate-700">Account Status</span>
                <AccountStatusButtons
                  value={accountForm.excludedFromReport}
                  allowInactive={false}
                  onChange={(excludedFromReport) =>
                    setAccountForm((current) => ({ ...current, excludedFromReport }))
                  }
                />
                <p className="text-xs text-slate-600">New accounts are saved as Active.</p>
              </div>
            </>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-sky-950">Member Savings</h3>
                <p className="mt-1 text-sm text-sky-800">
                  Monthly employee and employer contributions.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyInput
                  label="EE · Employee Share"
                  value={accountForm.employeeSavings}
                  onChange={(value) =>
                    setAccountForm((current) => ({ ...current, employeeSavings: value }))
                  }
                />
                <MoneyInput
                  label="ER · Employer Share"
                  value={accountForm.employerSavings}
                  onChange={(value) =>
                    setAccountForm((current) => ({ ...current, employerSavings: value }))
                  }
                />
              </div>
            </section>

            <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-sky-950">MP2 Savings</h3>
                <p className="mt-1 text-sm text-sky-800">Optional MP2 membership savings.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>Account No.</span>
                  <input
                    maxLength={80}
                    value={accountForm.mp2AccountNumber}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        mp2AccountNumber: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Enter MP2 account number"
                  />
                </label>
                <MoneyInput
                  label="Amount"
                  value={accountForm.mp2Amount}
                  onChange={(value) =>
                    setAccountForm((current) => ({ ...current, mp2Amount: value }))
                  }
                />
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-amber-950">Loans</h3>
                <p className="mt-1 text-sm text-amber-900">
                  Manage the employee&apos;s Pag-IBIG loan accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLoanEditor("")}
                disabled={availableLoanTypes.length === 0 || loanEditorType !== null}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                Add Loan
              </button>
            </div>
            <div
              className="mt-4 inline-flex rounded-lg border border-amber-200 bg-white p-1"
              role="group"
              aria-label="Filter loans by status"
            >
              {(["ACTIVE", "INACTIVE"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={loanStatusFilter === status}
                  onClick={() => setLoanStatusFilter(status)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    loanStatusFilter === status
                      ? "bg-amber-700 text-white shadow-sm"
                      : "text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                  <span
                    className={
                      loanStatusFilter === status ? "ml-1 text-amber-100" : "ml-1 text-amber-700"
                    }
                  >
                    ({accountLoanCounts[status]})
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-44 overflow-y-auto overscroll-contain rounded-lg border border-amber-200 bg-white">
              <div className="sticky top-0 z-10 grid grid-cols-[1.2fr_1.2fr_1fr_7rem_6rem] gap-4 border-b border-amber-100 bg-amber-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-amber-950">
                <span>Type of Loan</span>
                <span>Application No</span>
                <span className="text-center">Loan Term</span>
                <span className="text-right">Loan Amount</span>
                <span className="w-24 text-right">Action</span>
              </div>
              {visibleAccountLoanTypes.map((type) => {
                const detail = accountForm.loanDetails[type];
                const inactiveReason = detail.status
                  .replace("INACTIVE_", "")
                  .replace("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (character) => character.toUpperCase());

                return (
                  <div
                    key={type}
                    className="grid grid-cols-[1.2fr_1.2fr_1fr_7rem_6rem] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{loanLabels[type]}</p>
                      <p className="text-xs text-slate-500">
                        {detail.status === "ACTIVE" ? "Active" : `Inactive (${inactiveReason})`}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700">{detail.applicationNo || "-"}</p>
                    <p className="text-center text-xs font-bold text-slate-900">
                      {detail.termYears} Years
                    </p>
                    <p className="text-right text-sm font-semibold tabular-nums text-slate-900">
                      {formatAmount(detail.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenLoanEditor(type)}
                        aria-label={`Edit ${loanLabels[type]} loan`}
                        title={`Edit ${loanLabels[type]} loan`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLoanDetail(type)}
                        aria-label={`Delete ${loanLabels[type]} loan`}
                        title={`Delete ${loanLabels[type]} loan`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 transition hover:bg-rose-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {visibleAccountLoanTypes.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-600">
                  {accountLoanCounts.ACTIVE + accountLoanCounts.INACTIVE === 0
                    ? "No loan accounts added yet."
                    : `No ${loanStatusFilter.toLocaleLowerCase()} loans.`}
                </p>
              )}
            </div>

            {loanEditorType !== null && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) closeLoanEditorFromBackdrop();
                }}
              >
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-amber-300 bg-white p-4 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {loanEditorSourceType
                          ? `Edit ${loanLabels[(loanEditorType || loanEditorSourceType) as PagibigLoanType]} Loan`
                          : "Add Loan Account"}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">
                        Save the loan here, then save the Pag-IBIG account to persist your changes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelLoanEditor}
                      aria-label="Close loan editor"
                      className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <label>
                    <span className={labelClass}>Type of Loan</span>
                    {loanEditorSourceType ? (
                      <select
                        required
                        value={loanEditorType ?? ""}
                        onChange={(event) => {
                          const nextType = PAGIBIG_LOAN_TYPES.find(
                            (type) => type === event.target.value,
                          );
                          if (nextType) switchLoanType(nextType);
                        }}
                        className={inputClass}
                      >
                        {PAGIBIG_LOAN_TYPES.filter(
                          (type) =>
                            !accountForm.loanDetails[type].applicationNo.trim() ||
                            type === loanEditorType ||
                            type === loanEditorSourceType ||
                            (loanEditorBackup && type === loanEditorBackup.sourceType),
                        ).map((type) => (
                          <option key={type} value={type}>
                            {loanLabels[type]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        required
                        value={loanEditorType}
                        onChange={(event) => selectAvailableLoanType(event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select loan type</option>
                        {availableLoanTypes.map((type) => (
                          <option key={type} value={type}>
                            {loanLabels[type]}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>

                  {loanEditorType && (
                    <>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                          <span className={labelClass}>Application No.</span>
                          <input
                            required
                            maxLength={120}
                            value={loanEditorDetail.applicationNo}
                            onChange={(event) =>
                              setLoanEditorDetail((current) => ({
                                ...current,
                                applicationNo: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </label>
                        <label>
                          <span className={labelClass}>Loan Term Date</span>
                          <input
                            required
                            type="date"
                            value={loanEditorDetail.loanTermDate}
                            onChange={(event) =>
                              setLoanEditorDetail((current) => ({
                                ...current,
                                loanTermDate: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </label>
                        <label>
                          <span className={labelClass}>Term (Years)</span>
                          <input
                            required
                            type="number"
                            min="1"
                            max="50"
                            step="1"
                            value={loanEditorDetail.termYears}
                            onChange={(event) =>
                              setLoanEditorDetail((current) => ({
                                ...current,
                                termYears: event.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </label>
                        <MoneyInput
                          label="Loan Amount"
                          value={loanEditorDetail.amount}
                          onChange={(value) =>
                            setLoanEditorDetail((current) => ({ ...current, amount: value }))
                          }
                        />
                        <label>
                          <span className={labelClass}>Status</span>
                          <select
                            value={loanEditorDetail.status}
                            onChange={(event) => {
                              setLoanEditorDetail((current) => ({
                                ...current,
                                status: event.target.value,
                              }));
                              if (event.target.value === "ACTIVE") setLoanEditorReason("");
                            }}
                            className={inputClass}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </label>
                        {loanEditorDetail.status === "INACTIVE" && (
                          <label>
                            <span className={labelClass}>Inactive Reason</span>
                            <select
                              value={loanEditorReason}
                              onChange={(event) => setLoanEditorReason(event.target.value)}
                              className={inputClass}
                            >
                              <option value="">Select reason</option>
                              <option value="RESIGNED">Resigned</option>
                              <option value="PAID">Paid</option>
                              <option value="NEW_LOAN">Applied for New Loan</option>
                              <option value="HOLD">Hold</option>
                            </select>
                          </label>
                        )}
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelLoanEditor}
                          className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onSaveLoanDetail}
                          className="h-9 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"
                        >
                          Save Loan
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {accountError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {accountError}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 z-20 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={savingAccount || loanEditorType !== null}
            className="h-10 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingAccount ? "Saving..." : "Save Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
