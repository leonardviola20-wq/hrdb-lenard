"use client";

import { Suspense, useMemo, useState } from "react";
import { BriefcaseIcon, IdentificationIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useEmployeeEditorForm } from "./hooks/useEmployeeEditorForm";
import { useCardEditing } from "./hooks/useCardEditing";
import type { EditorTab } from "./types";
import { readPhoto } from "./utils";
import { EditorHeader } from "./page/EditorHeader";
import { EditorFooter } from "./page/EditorFooter";
import { EditorTabBar } from "./tabs/EditorTabBar";
import { PersonalTab } from "./tabs/PersonalTab";
import { EmploymentTab } from "./tabs/EmploymentTab";
import { GovernmentTab } from "./tabs/GovernmentTab";

const editorTabs: { label: EditorTab; icon: React.ElementType }[] = [
  { label: "Personal Information", icon: UserCircleIcon },
  { label: "Employment", icon: BriefcaseIcon },
  { label: "Government", icon: IdentificationIcon },
];

type ProfileEditorProps = {
  /** Existing employee id (update) or null (create). */
  employeeId: number | null;
};

function EmployeeProfileEditor({ employeeId }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("Personal Information");

  const editor = useEmployeeEditorForm(employeeId);
  const { form, error, setError, submit, loadingEmployee, saving } = editor;

  const cardEditing = useCardEditing(employeeId, editor.setForm, editor.submit, setError);
  const controller = useMemo(
    () => ({
      ...editor,
      ...cardEditing,
      saveCard: (cardKey: string) => void cardEditing.saveCard(cardKey),
      canEditCards: employeeId !== null,
    }),
    // editor/cardEditing identities change together with their dependencies.
    [editor, cardEditing, employeeId],
  );

  const fullName = useMemo(
    () => [form.firstName, form.lastName].filter(Boolean).join(" ") || "New Employee",
    [form.firstName, form.lastName],
  );

  const activeTabIndex = editorTabs.findIndex((tab) => tab.label === activeTab);
  const backHref = employeeId === null ? "/employees" : `/employees/${employeeId}`;

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex w-full flex-1 flex-col">
        <EditorHeader
          form={form}
          fullName={fullName}
          employeeId={employeeId}
          backHref={backHref}
          backLabel={employeeId === null ? "Back to employee directory" : "Back to employee profile"}
          onPhotoSelected={(file) => readPhoto(file, (value) => editor.update("photoUrl", value), setError)}
        />

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex flex-1 flex-col">
          <EditorTabBar
            tabs={editorTabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          {loadingEmployee ? (
            <p role="status" className="mt-5 text-sm text-gray-600">Loading employee details...</p>
          ) : (
            <>
              <div id="employee-entry-panel" role="tabpanel" aria-labelledby={`employee-entry-tab-${activeTabIndex}`} className="mt-4 flex flex-1 flex-col">
                {cardEditing.cardNotice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{cardEditing.cardNotice}</p>}
                {activeTab === "Personal Information" && <PersonalTab controller={controller} />}
                {activeTab === "Employment" && <EmploymentTab controller={controller} />}
                {activeTab === "Government" && <GovernmentTab controller={controller} />}
              </div>

              <EditorFooter
                cancelHref={backHref}
                pagibigReturnContext={editor.pagibigReturnContext}
                showCardHint={employeeId !== null && cardEditing.editingCard === null}
                saving={saving}
                loadingEmployee={loadingEmployee}
                employeeId={employeeId}
                onSave={() => void submit()}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function EmployeeProfileEditorPage() {
  return (
    <Suspense fallback={<main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6" />}>
      <EmployeeProfileEditor employeeId={null} />
    </Suspense>
  );
}
