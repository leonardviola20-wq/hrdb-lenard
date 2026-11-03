"use client";

import { useState } from "react";
import type { AccountForm, LoanDetail, Member } from "@/components/pagibig-reports/types";
import type { PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { emptyAccountForm, emptyLoanDetail, loanLabels } from "@/components/pagibig-reports/format";
import { PAGIBIG_LOAN_TYPES } from "@/lib/pagibigLoanTypes";

export function usePagibigAccountForm() {
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [returnToReportPreview, setReturnToReportPreview] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [loanEditorType, setLoanEditorType] = useState<PagibigLoanType | "" | null>(null);
  const [loanEditorDetail, setLoanEditorDetail] = useState<LoanDetail>(emptyLoanDetail);
  const [loanEditorReason, setLoanEditorReason] = useState("");
  const [loanEditorSourceType, setLoanEditorSourceType] = useState<PagibigLoanType | null>(null);
  const [loanEditorBackup, setLoanEditorBackup] = useState<{
    sourceType: PagibigLoanType;
    detail: LoanDetail;
  } | null>(null);
  const [loanStatusFilter, setLoanStatusFilter] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  const openLoanEditor = (type: PagibigLoanType | "" | null) => {
    setLoanEditorType(type);
    setLoanEditorSourceType(
      type && accountForm.loanDetails[type].applicationNo.trim() ? type : null,
    );
    const detail = type ? { ...accountForm.loanDetails[type] } : emptyLoanDetail();
    const inactive = detail.status.startsWith("INACTIVE_");
    setLoanEditorDetail(inactive ? { ...detail, status: "INACTIVE" } : detail);
    setLoanEditorReason(inactive ? detail.status.slice("INACTIVE_".length) : "");
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
    const trimmedApplicationNo = detail.applicationNo.trim();
    const duplicate = PAGIBIG_LOAN_TYPES.some(
      (loanType) =>
        loanType !== type &&
        accountForm.loanDetails[loanType].applicationNo.trim() &&
        accountForm.loanDetails[loanType].applicationNo.trim() === trimmedApplicationNo,
    );

    if (duplicate) {
      setAccountError("This application number is already used by another loan.");
      return;
    }

    if (
      !trimmedApplicationNo ||
      !detail.loanTermDate ||
      !Number.isInteger(Number(detail.termYears)) ||
      Number(detail.termYears) < 1 ||
      Number(detail.termYears) > 50 ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !["ACTIVE", "INACTIVE"].includes(detail.status) ||
      (detail.status === "INACTIVE" &&
        !["RESIGNED", "PAID", "NEW_LOAN", "HOLD"].includes(loanEditorReason))
    ) {
      setAccountError(
        "Complete the loan application number, term date, term, amount, status, and inactive reason.",
      );
      return;
    }

    setAccountForm((current) => ({
      ...current,
      loanDetails: {
        ...current.loanDetails,
        [type]: {
          ...detail,
          applicationNo: trimmedApplicationNo,
          status: detail.status === "INACTIVE" ? `INACTIVE_${loanEditorReason}` : "ACTIVE",
        },
      },
    }));
    setLoanEditorType(null);
    setLoanEditorDetail(emptyLoanDetail());
    setLoanEditorReason("");
    setLoanEditorSourceType(null);
    setLoanEditorBackup(null);
    setAccountError("");
  };

  const deleteLoanDetail = (type: PagibigLoanType) => {
    if (!window.confirm(`Delete the ${loanLabels[type]} loan? It will be removed when you save the account.`)) {
      return;
    }

    if (loanEditorType === type) {
      setLoanEditorType(null);
      setLoanEditorDetail(emptyLoanDetail());
      setLoanEditorSourceType(null);
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

  return {
    accountFormOpen,
    setAccountFormOpen,
    returnToReportPreview,
    setReturnToReportPreview,
    editingMember,
    setEditingMember,
    accountForm,
    setAccountForm,
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
    savingAccount,
    setSavingAccount,
    accountError,
    setAccountError,
    openLoanEditor,
    saveLoanDetail,
    deleteLoanDetail,
  };
}
