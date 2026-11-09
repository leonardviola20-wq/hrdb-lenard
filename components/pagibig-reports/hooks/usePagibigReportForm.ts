"use client";

import { useReducer } from "react";
import type { Member } from '@/components/pagibig-reports/shared/types';
import type { PagibigPreviewFilter } from "@/lib/pagibigReportPreview";

// Report-form related state consolidated into a reducer (Tier 4 pilot).
// Exposes the same setter signatures as the previous useState calls so call
// sites do not need to change.

export type PagibigReportFormState = {
  reportFormOpen: boolean;
  previewMembers: Member[];
  previewLoading: boolean;
  previewError: string;
  previewYear: string;
  previewFilter: PagibigPreviewFilter;
  reportEmployeePickerOpen: boolean;
  reportEmployeeId: string;
  reportMonth: string;
  reportYear: string;
  reportPin: string;
  manualReport: boolean;
  reportKind: "CONTRIBUTION" | "LOAN";
  reportDraftId: number | null;
  updatingReportId: number | null;
  generating: boolean;
  returnToReportPreview: boolean;
};

type Action<K extends keyof PagibigReportFormState = keyof PagibigReportFormState> =
  | { type: "SET"; field: K; value: PagibigReportFormState[K] | ((prev: PagibigReportFormState[K]) => PagibigReportFormState[K]) }
  | { type: "RESET_PREVIEW" };

const initialState: PagibigReportFormState = {
  reportFormOpen: false,
  previewMembers: [],
  previewLoading: false,
  previewError: "",
  previewYear: "",
  previewFilter: "ALL",
  reportEmployeePickerOpen: false,
  reportEmployeeId: "",
  reportMonth: String(new Date().getMonth() + 1),
  reportYear: String(new Date().getFullYear()),
  reportPin: "",
  manualReport: false,
  reportKind: "CONTRIBUTION",
  reportDraftId: null,
  updatingReportId: null,
  generating: false,
  returnToReportPreview: false,
};

function reducer(state: PagibigReportFormState, action: Action): PagibigReportFormState {
  switch (action.type) {
    case "SET": {
      const current = state[action.field];
      const value = typeof action.value === "function" ? (action.value as (prev: unknown) => unknown)(current) : action.value;
      return { ...state, [action.field]: value };
    }
    case "RESET_PREVIEW":
      return { ...state, previewMembers: [], previewError: "", previewYear: "" };
    default:
      return state;
  }
}

export function usePagibigReportForm(initial?: Partial<PagibigReportFormState>) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial });
  const set = <K extends keyof PagibigReportFormState>(field: K) => (value: PagibigReportFormState[K] | ((prev: PagibigReportFormState[K]) => PagibigReportFormState[K])) =>
    dispatch({ type: "SET", field, value } as Action<K> as Action<keyof PagibigReportFormState>);

  return {
    state,
    dispatch,
    // drop-in setters matching previous useState API
    setReportFormOpen: set("reportFormOpen"),
    setPreviewMembers: set("previewMembers"),
    setPreviewLoading: set("previewLoading"),
    setPreviewError: set("previewError"),
    setPreviewYear: set("previewYear"),
    setPreviewFilter: set("previewFilter"),
    setReportEmployeePickerOpen: set("reportEmployeePickerOpen"),
    setReportEmployeeId: set("reportEmployeeId"),
    setReportMonth: set("reportMonth"),
    setReportYear: set("reportYear"),
    setReportPin: set("reportPin"),
    setManualReport: set("manualReport"),
    setReportKind: set("reportKind"),
    setReportDraftId: set("reportDraftId"),
    setUpdatingReportId: set("updatingReportId"),
    setGenerating: set("generating"),
    setReturnToReportPreview: set("returnToReportPreview"),
    resetPreview: () => dispatch({ type: "RESET_PREVIEW" }),
  };
}