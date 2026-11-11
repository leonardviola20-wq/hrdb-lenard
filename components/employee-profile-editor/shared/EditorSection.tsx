"use client";

import { CheckIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";

export const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
export const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

type EditorSectionProps = {
  title: string;
  icon: React.ElementType;
  cardKey: string;
  /** Which card is currently being edited (null = view mode). */
  editingCard: string | null;
  savingCard: string | null;
  /** False in create mode, where cards are always editable without a per-card toggle. */
  canEdit: boolean;
  onStartEdit: (cardKey: string) => void;
  onCancelEdit: () => void;
  onSaveCard: (cardKey: string) => void;
  className?: string;
  children: React.ReactNode;
};

/** Card container with the per-card edit / save / cancel buttons. */
export function EditorSection({
  title,
  icon: Icon,
  cardKey,
  editingCard,
  savingCard,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSaveCard,
  className = "",
  children,
}: EditorSectionProps) {
  const isEditing = editingCard === cardKey;
  const isSaving = savingCard === cardKey;
  return (
    <section className={`h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${isEditing ? "border-blue-300 ring-2 ring-blue-100" : ""} ${className}`}>
      <h2 className="flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">
        <Icon aria-hidden="true" className="h-5 w-5 text-blue-700" />
        {title}
        {canEdit && (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => onSaveCard(cardKey)}
                  disabled={isSaving}
                  aria-label={`Save ${title}`}
                  title="Save"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-wait disabled:opacity-60"
                >
                  <CheckIcon aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  aria-label={`Cancel editing ${title}`}
                  title="Cancel"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60"
                >
                  <XMarkIcon aria-hidden="true" className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onStartEdit(cardKey)}
                disabled={editingCard !== null || isSaving}
                aria-label={`Update ${title}`}
                title="Update"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PencilSquareIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </span>
        )}
      </h2>
      <div className="mt-4 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

type EditorFieldProps = { label: string; required?: boolean; className?: string; children: React.ReactNode };

/** Labeled field wrapper. */
export function EditorField({ label, required, className = "", children }: EditorFieldProps) {
  return (
    <label className={`grid min-w-0 gap-1.5 ${className}`}>
      <span className="text-xs tracking-wide text-gray-500">{label}{required && <span className="text-red-600"> *</span>}</span>
      {children}
    </label>
  );
}
