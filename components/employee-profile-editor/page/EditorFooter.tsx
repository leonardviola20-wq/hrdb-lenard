"use client";

import Link from "next/link";
import type { PagibigReturnContext } from "../hooks/useEmployeeEditorForm";

type EditorFooterProps = {
  cancelHref: string;
  pagibigReturnContext: PagibigReturnContext | null;
  showCardHint: boolean;
  saving: boolean;
  loadingEmployee: boolean;
  employeeId: number | null;
  onSave: () => void;
};

/** Sticky-style action bar: contextual hints, Cancel link, and the main save button. */
export function EditorFooter({ cancelHref, pagibigReturnContext, showCardHint, saving, loadingEmployee, employeeId, onSave }: EditorFooterProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {pagibigReturnContext && <p className="mr-auto text-xs text-gray-500">Returning to the Pag-IBIG workflow after saving.</p>}
      {showCardHint && <p className="mr-auto text-xs text-gray-500">Press a card update (pencil) button to edit its details.</p>}
      <Link
        href={cancelHref}
        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        Cancel
      </Link>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || loadingEmployee}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (employeeId === null ? "Creating..." : "Saving changes...") : employeeId === null ? "Create employee" : "Save changes"}
      </button>
    </div>
  );
}
