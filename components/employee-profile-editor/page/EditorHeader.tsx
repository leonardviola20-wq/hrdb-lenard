"use client";

import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { activeStatuses, type EditorForm } from "../types";
import BackButton from "@/components/BackButton";

type EditorHeaderProps = {
  form: EditorForm;
  fullName: string;
  employeeId: number | null;
  backHref: string;
  backLabel: string;
  onPhotoSelected: (file: File) => void;
};

/** Photo upload plus the employee identity / status summary under the page title. */
export function EditorHeader({ form, fullName, employeeId, backHref, backLabel, onPhotoSelected }: EditorHeaderProps) {
  return (
    <header className="page-header-surface mt-1 flex flex-wrap items-center gap-4">
      <div className="group relative shrink-0">
        {form.photoUrl ? (
          <img src={form.photoUrl} alt={`${fullName} preview`} className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">No photo</div>
        )}
        {!form.photoUrl && (
          <label
            htmlFor="employee-editor-photo-upload"
            aria-label="Upload photo (JPG, PNG, or GIF up to 2 MB)"
            title="JPG, PNG, or GIF up to 2 MB."
            className="absolute inset-x-0 -bottom-3 mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 opacity-0 shadow-sm transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100"
          >
            <ArrowUpTrayIcon aria-hidden="true" className="h-4 w-4" />
            <input
              id="employee-editor-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onPhotoSelected(file);
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <BackButton fallbackHref={backHref} label={backLabel} />
          <h1 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">
            {employeeId === null ? "Add New Employee" : `Editing: ${fullName}`}
          </h1>
        </div>
        <p className="mt-1 text-sm font-medium text-gray-700">
          {form.position || "Position not set"} <span className="px-1 text-gray-400">•</span> {form.branch || "Branch not set"}
        </p>
        <p className="mt-1 text-sm text-gray-600">{form.biometricNo || "Biometric number not set"}</p>
        <p className={`mt-1 text-sm font-semibold ${activeStatuses.has(form.status) ? "text-green-700" : "text-gray-700"}`}>
          {form.status || "Status not set"}
        </p>
      </div>
    </header>
  );
}
