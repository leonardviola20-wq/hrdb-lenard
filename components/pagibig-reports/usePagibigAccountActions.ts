"use client";

import { useCallback } from "react";
import { PAGIBIG_LOAN_TYPES, type PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { emptyAccountForm, emptyLoanDetail, loanLabels } from "./format";
import type { LoanDetail, Member } from "./types";
import type { usePagibigAccountForm } from "./usePagibigAccountForm";

// Account-modal actions extracted from PagIbigReportsPage: open/close the
// Add/Edit account dialog, manage the inline loan editor, and save accounts.

type AccountFormControls = ReturnType<typeof usePagibigAccountForm>;

export function usePagibigAccountActions({
  account,
  accountYear,
  reportYear,
  setReportFormOpen,
}: {
  account: AccountFormControls;
  accountYear: string;
  reportYear: string;
  setReportFormOpen: (open: boolean) => void;
}) {
  const {
    state,
    setAccountFormOpen, setReturnToReportPreview, setEditingMember, setAccountForm,
    setLoanEditorType, setLoanEditorDetail, setLoanEditorReason, setLoanEditorSourceType, setLoanEditorBackup,
    setLoanStatusFilter, setAccountError, resetLoanEditor,
  } = account;
  const { accountForm, loanEditorType, loanEditorDetail, loanEditorReason, loanEditorBackup, returnToReportPreview } = state;

  const openAddAccount = useCallback((employeeId = "", loadRoster: (employeeId: string) => void) => {
    setReturnToReportPreview(false);
    setEditingMember(null);
    setAccountForm({ ...emptyAccountForm(), employeeId, year: accountYear });
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanStatusFilter("ACTIVE");
    setAccountError("");
    setAccountFormOpen(true);
    loadRoster(employeeId);
  }, [accountYear, setAccountError, setAccountForm, setAccountFormOpen, setLoanEditorDetail, setLoanEditorType, setLoanStatusFilter, setReturnToReportPreview, setEditingMember]);

  const openEditAccount = (member: Member, fromReportPreview = false) => {
    setReturnToReportPreview(fromReportPreview);
    if (fromReportPreview) setReportFormOpen(false);
    const memberAccount = member.pagIbigAccount;
    setEditingMember(memberAccount ? member : null);
    setAccountError("");
    setAccountForm({
      employeeId: String(member.id),
      year: String(memberAccount?.year ?? (fromReportPreview ? reportYear : accountYear)),
      midNumber: member.pagIbigNumber ?? "",
      employeeSavings: memberAccount?.employeeSavings ?? "200",
      employerSavings: memberAccount?.employerSavings ?? "200",
      excludedFromReport: memberAccount?.excludedFromReport ?? false,
      mp2AccountNumber: memberAccount?.mp2AccountNumber ?? "",
      mp2Amount: memberAccount?.mp2Amount ?? "0",
      loanDetails: Object.fromEntries(PAGIBIG_LOAN_TYPES.map((type) => {
        const detail = memberAccount?.loanDetails[type];
        return [type, detail ? { ...detail, termYears: String(detail.termYears) } : emptyLoanDetail()];
      })) as Record<PagibigLoanType, LoanDetail>,
    });
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanStatusFilter("ACTIVE");
    setAccountFormOpen(true);
  };

  const closeAccountForm = () => {
    if (loanEditorBackup) {
      setAccountForm((current) => ({ ...current, loanDetails: { ...current.loanDetails, [loanEditorBackup.sourceType]: loanEditorBackup.detail } }));
    }
    setAccountFormOpen(false);
    resetLoanEditor();
    setLoanEditorBackup(null);
    if (returnToReportPreview) setReportFormOpen(true);
    setReturnToReportPreview(false);
  };

  const openLoanEditor = (type: PagibigLoanType | "" | null) => {
    setLoanEditorType(type);
    setLoanEditorSourceType(type ? (accountForm.loanDetails[type].applicationNo.trim() ? type : null) : null);
    const detail = type ? { ...accountForm.loanDetails[type] } : emptyLoanDetail();
    setLoanEditorDetail(detail.status && detail.status.startsWith("INACTIVE_") ? { ...detail, status: "INACTIVE" } : detail);
    setLoanEditorReason(detail.status && detail.status.startsWith("INACTIVE_") ? detail.status.slice("INACTIVE_".length) : "");
    setAccountError("");
  };

  const saveLoanDetail = () => {
    if (!loanEditorType) {
      setAccountError("Choose a loan type.");
      return;
    }
    const type = loanEditorType;
    const detail = loanEditorDetail;
    const amount = Number(detail.amount);
    const trimmedAppNo = detail.applicationNo.trim();
    const duplicate = PAGIBIG_LOAN_TYPES.some((other) => other !== loanEditorType && accountForm.loanDetails[other].applicationNo.trim() === trimmedAppNo && trimmedAppNo);
    if (duplicate) { setAccountError("This application number is already used by another loan."); return; }
    if (!trimmedAppNo || !detail.loanTermDate || !Number.isInteger(Number(detail.termYears))
      || Number(detail.termYears) < 1 || Number(detail.termYears) > 50 || !Number.isFinite(amount) || amount < 0
      || !["ACTIVE", "INACTIVE"].includes(detail.status)
      || (detail.status === "INACTIVE" && !["RESIGNED", "PAID", "NEW_LOAN", "HOLD"].includes(loanEditorReason))) {
      setAccountError("Complete the loan application number, term date, term, amount, status, and inactive reason.");
      return;
    }
    setAccountForm((current) => ({
      ...current,
      loanDetails: { ...current.loanDetails, [type]: { ...detail, applicationNo: trimmedAppNo, status: detail.status === "INACTIVE" ? "INACTIVE_" + loanEditorReason : "ACTIVE" } },
    }));
    resetLoanEditor();
    setLoanEditorBackup(null);
    setAccountError("");
  };

  const deleteLoanDetail = (type: PagibigLoanType) => {
    if (!window.confirm(`Delete the ${loanLabels[type]} loan? It will be removed when you save the account.`)) return;
    if (loanEditorType === type) {
      resetLoanEditor();
      setLoanEditorBackup(null);
    } else if (loanEditorBackup?.sourceType === type) {
      setLoanEditorBackup(null);
    }
    setAccountForm((current) => ({
      ...current,
      loanDetails: { ...current.loanDetails, [type]: emptyLoanDetail() },
    }));
    setAccountError("");
  };

  const onSelectEmployeeForAccount = (employeeId: string, allEmployees: Member[]) => {
    const picked = allEmployees.find((employee) => String(employee.id) === employeeId);
    setAccountForm((current) => ({
      ...current,
      employeeId,
      midNumber: picked?.pagIbigNumber ?? current.midNumber,
      year: accountYear,
      excludedFromReport: false, // temporary: default selected employee account to Active
    }));
    setAccountError("");
  };

  return {
    openAddAccount,
    openEditAccount,
    closeAccountForm,
    openLoanEditor,
    saveLoanDetail,
    deleteLoanDetail,
    onSelectEmployeeForAccount,
  };
}
