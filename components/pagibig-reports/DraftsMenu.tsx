"use client";

import { monthNames } from "./constants";
import type { ReportDraft } from "./types";

type Props = {
  open: boolean;
  drafts: ReportDraft[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onResume: (draft: ReportDraft) => void;
  onDelete: (draft: ReportDraft) => void;
};

export function DraftsMenu({ open, drafts, menuRef, onToggle, onResume, onDelete }: Props) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        Drafts <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-xs text-white">{drafts.length}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-amber-200 bg-white p-2 shadow-xl">
          {drafts.length ? drafts.map((draft) => (
            <div key={draft.id} className="flex items-start gap-2 border-b border-slate-100 p-2 last:border-0">
              <button type="button" onClick={() => onResume(draft)} className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold text-slate-900">{monthNames[draft.applicableMonth - 1]} {draft.applicableYear}</span>
                <span className="mt-1 block text-xs text-slate-700">Updated {new Date(draft.updatedAt).toLocaleString()}</span>
              </button>
              <button type="button" onClick={() => onDelete(draft)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Delete</button>
            </div>
          )) : <p className="px-2 py-3 text-sm text-slate-700">No saved drafts.</p>}
        </div>
      )}
    </div>
  );
}
