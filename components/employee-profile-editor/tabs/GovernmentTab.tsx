"use client";

import { IdentificationIcon } from "@heroicons/react/24/outline";
import type { EditorController } from "../types";
import { formatDigits } from "../utils";
import { EditorField, EditorSection, inputClass } from "../shared/EditorSection";

/** Government tab: SSS, Pag-IBIG, PhilHealth, and TIN identifiers. */
export function GovernmentTab({ controller }: { controller: EditorController }) {
  const { form, update } = controller;
  return (
    <div className="grid flex-1 gap-5 xl:grid-cols-2">
      <EditorSection
        title="Government ID"
        icon={IdentificationIcon}
        cardKey="government"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={controller.canEditCards}
        onStartEdit={() => controller.startCardEdit("government", ["sssNumber", "pagIbigNumber", "philHealth", "tinNumber"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="SSS"><input inputMode="numeric" disabled={controller.canEditCards && controller.editingCard !== "government"} value={form.sssNumber} onChange={(e) => update("sssNumber", formatDigits(e.target.value, [2, 7, 1]))} placeholder="00-0000000-0" className={inputClass} /></EditorField>
        <EditorField label="Pag-IBIG"><input inputMode="numeric" disabled={controller.canEditCards && controller.editingCard !== "government"} value={form.pagIbigNumber} onChange={(e) => update("pagIbigNumber", formatDigits(e.target.value, [4, 4, 4]))} placeholder="0000-0000-0000" className={inputClass} /></EditorField>
        <EditorField label="PhilHealth"><input inputMode="numeric" disabled={controller.canEditCards && controller.editingCard !== "government"} value={form.philHealth} onChange={(e) => update("philHealth", formatDigits(e.target.value, [2, 9, 1]))} placeholder="00-000000000-0" className={inputClass} /></EditorField>
        <EditorField label="TIN"><input inputMode="numeric" disabled={controller.canEditCards && controller.editingCard !== "government"} value={form.tinNumber} onChange={(e) => update("tinNumber", formatDigits(e.target.value, [3, 3, 3, 5]))} placeholder="000-000-000-00000" className={inputClass} /></EditorField>
      </EditorSection>
    </div>
  );
}
