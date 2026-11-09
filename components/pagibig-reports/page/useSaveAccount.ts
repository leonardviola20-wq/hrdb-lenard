"use client";

import type { FormEvent } from "react";
import { sortPagibigPreviewMembers } from "@/lib/pagibigReportPreview";
import type { usePagibigAccountForm } from '@/components/pagibig-reports/hooks/usePagibigAccountForm';
import type { usePagibigReportForm } from '@/components/pagibig-reports/hooks/usePagibigReportForm';
import type { Account, Member } from '@/components/pagibig-reports/shared/types';

type AccountFormControls = ReturnType<typeof usePagibigAccountForm>;
type ReportFormControls = ReturnType<typeof usePagibigReportForm>;

/**
 * Submits the account form: POSTs the account, then syncs the saved account
 * into the members list and the report preview. Handles the
 * "return to report preview" flow and the loan-editor rollback on failure.
 */
export function useSaveAccount({
  account,
  form,
  members,
  selectedEmployerId,
  setMembers,
  setError,
  setNotice,
  requestRefresh,
  resetMemberFilters,
}: {
  account: AccountFormControls;
  form: ReportFormControls;
  members: Member[];
  selectedEmployerId: string;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  requestRefresh: () => void;
  resetMemberFilters: (status: "ALL" | "ACTIVE") => void;
}) {
  const { state: accountState, setAccountForm, setAccountFormOpen, setLoanEditorBackup, setSavingAccount, setAccountError } = account;
  const { accountForm, editingMember, returnToReportPreview, loanEditorBackup } = accountState;
  const { state: formState, setPreviewMembers, setReportFormOpen } = form;
  const { previewMembers } = formState;

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountForm.employeeId) {
      setAccountError("Select an employee.");
      return;
    }
    setSavingAccount(true);
    setAccountError("");
    try {
      const response = await fetch("/api/reports/pagibig/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountForm,
          employerId: selectedEmployerId,
          isNewAccount: !editingMember,
          excludedFromReport: editingMember ? accountForm.excludedFromReport : false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save Pag-IBIG account");
      const previousMember = editingMember
        ?? members.find((member) => member.id === Number(accountForm.employeeId))
        ?? previewMembers.find((member) => member.id === Number(accountForm.employeeId));
      if (previousMember) {
        const updatedMember = { ...previousMember, pagIbigNumber: data.account.employee.pagIbigNumber, pagIbigAccount: data.account as Account };
        setMembers((current) => current.map((member) => member.id === updatedMember.id ? updatedMember : member));
        setPreviewMembers((current) => current.map((member) => member.id === updatedMember.id ? updatedMember : member));
      } else {
        const newMember: Member = {
          id: data.account.employee.id,
          employeeCode: data.account.employee.employeeCode,
          firstName: data.account.employee.firstName,
          middleName: data.account.employee.middleName,
          lastName: data.account.employee.lastName,
          status: data.account.employee.status,
          pagIbigNumber: data.account.employee.pagIbigNumber,
          pagIbigAccount: data.account as Account,
        };
        setMembers((current) => sortPagibigPreviewMembers([...current, newMember]));
        setPreviewMembers((current) => sortPagibigPreviewMembers([...current, newMember]));
      }
      setAccountFormOpen(false);
      setLoanEditorBackup(null);
      if (returnToReportPreview) {
        setReportFormOpen(true);
      } else {
        resetMemberFilters("ACTIVE");
        setError("");
        setNotice("");
        requestRefresh();
      }
    } catch (saveError) {
      // Restore the old loan type's data if a type switch was in progress
      if (loanEditorBackup) {
        setAccountForm((current) => ({
          ...current,
          loanDetails: { ...current.loanDetails, [loanEditorBackup.sourceType]: loanEditorBackup.detail },
        }));
        setLoanEditorBackup(null);
      }
      setAccountError(saveError instanceof Error ? saveError.message : "Unable to save Pag-IBIG account");
    } finally {
      setSavingAccount(false);
    }
  };

  return saveAccount;
}
