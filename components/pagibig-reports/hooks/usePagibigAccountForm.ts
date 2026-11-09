"use client";

import { useReducer } from "react";
import type { Member } from '@/components/pagibig-reports/shared/types';
import type { AccountForm, LoanDetail } from '@/components/pagibig-reports/shared/types';
import type { PagibigLoanType } from "@/lib/pagibigLoanTypes";
import { emptyAccountForm, emptyLoanDetail } from '@/components/pagibig-reports/shared/format';

export type PagibigAccountFormState = {
  accountFormOpen: boolean;
  returnToReportPreview: boolean;
  editingMember: Member | null;
  accountForm: AccountForm;
  loanEditorType: PagibigLoanType | "" | null;
  loanEditorDetail: LoanDetail;
  loanEditorReason: string;
  loanEditorSourceType: PagibigLoanType | null;
  loanEditorBackup: { sourceType: PagibigLoanType; detail: LoanDetail } | null;
  loanStatusFilter: "ACTIVE" | "INACTIVE";
  savingAccount: boolean;
  accountError: string;
};

type Action<K extends keyof PagibigAccountFormState = keyof PagibigAccountFormState> =
  | { type: "SET"; field: K; value: PagibigAccountFormState[K] | ((prev: PagibigAccountFormState[K]) => PagibigAccountFormState[K]) }
  | { type: "RESET_LOAN_EDITOR" };

const initialState: PagibigAccountFormState = {
  accountFormOpen: false,
  returnToReportPreview: false,
  editingMember: null,
  accountForm: emptyAccountForm(),
  loanEditorType: null,
  loanEditorDetail: emptyLoanDetail(),
  loanEditorReason: "",
  loanEditorSourceType: null,
  loanEditorBackup: null,
  loanStatusFilter: "ACTIVE",
  savingAccount: false,
  accountError: "",
};

function reducer(state: PagibigAccountFormState, action: Action): PagibigAccountFormState {
  switch (action.type) {
    case "SET": {
      const current = state[action.field];
      const value = typeof action.value === "function" ? (action.value as (prev: unknown) => unknown)(current) : action.value;
      return { ...state, [action.field]: value };
    }
    case "RESET_LOAN_EDITOR":
      return { ...state, loanEditorType: null, loanEditorDetail: emptyLoanDetail(), loanEditorReason: "", loanEditorSourceType: null, loanEditorBackup: null };
    default:
      return state;
  }
}

export function usePagibigAccountForm(initial?: Partial<PagibigAccountFormState>) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial });
  const set = <K extends keyof PagibigAccountFormState>(field: K) => (value: PagibigAccountFormState[K] | ((prev: PagibigAccountFormState[K]) => PagibigAccountFormState[K])) =>
    dispatch({ type: "SET", field, value } as Action<K> as Action<keyof PagibigAccountFormState>);

  return {
    state,
    dispatch,
    setAccountFormOpen: set("accountFormOpen"),
    setReturnToReportPreview: set("returnToReportPreview"),
    setEditingMember: set("editingMember"),
    setAccountForm: set("accountForm"),
    setLoanEditorType: set("loanEditorType"),
    setLoanEditorDetail: set("loanEditorDetail"),
    setLoanEditorReason: set("loanEditorReason"),
    setLoanEditorSourceType: set("loanEditorSourceType"),
    setLoanEditorBackup: set("loanEditorBackup"),
    setLoanStatusFilter: set("loanStatusFilter"),
    setSavingAccount: set("savingAccount"),
    setAccountError: set("accountError"),
    resetLoanEditor: () => dispatch({ type: "RESET_LOAN_EDITOR" }),
  };
}