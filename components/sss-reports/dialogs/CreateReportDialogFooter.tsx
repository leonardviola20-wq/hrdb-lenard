"use client";

import type { PaymentKind, Report } from "../shared/types";
import BackButton from "@/components/BackButton";

/** Subcomponent: footer buttons of the create/edit report modal. */
export function CreateReportDialogFooter(props: {
  kind: PaymentKind;
  editReport: Report | null;
  preview: boolean;
  saving: boolean;
  isTally: boolean;
  draftId: number | null;
  prnTrimmed: boolean;
  onOpenContributionTable: () => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onBackToEdit: () => void;
  onSaveReport: () => void;
  onStartPreview: () => void;
}) {
  const savingLabel = props.editReport ? "Updating..." : "Saving...";
  const confirmLabel = props.editReport ? "Update Report" : "Save Report";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
      <button type="button" onClick={props.onOpenContributionTable} className="text-xs font-semibold text-blue-700 hover:underline">Contribution table · Effective Jan 2025</button>
      <div className="ml-auto flex flex-wrap justify-end gap-2">
        <button type="button" onClick={props.onClose} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
        {!props.editReport && <button type="button" disabled={props.saving || !props.prnTrimmed} onClick={props.onSaveDraft} className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">{props.draftId ? "Update Draft" : "Save Draft"}</button>}
        {props.preview ? (<>
          <BackButton onClick={props.onBackToEdit} label="Back to edit" />
          <button type="button" disabled={!props.isTally || props.saving} onClick={props.onSaveReport} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{props.saving ? savingLabel : confirmLabel}</button>
        </>) : (
          <button type="button" disabled={!props.isTally} onClick={props.onStartPreview} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{props.editReport ? "Review Changes" : "Generate Report"}</button>
        )}
      </div>
    </div>
  );
}
