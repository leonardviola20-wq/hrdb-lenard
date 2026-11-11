"use client";

import { ClipboardDocumentListIcon, IdentificationIcon, UserCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { EditorController } from "../types";
import { formatMobile } from "../utils";
import { EditorField, EditorSection, inputClass, textareaClass } from "../shared/EditorSection";

const isLocked = (controller: EditorController, cardKey: string) =>
  controller.editingCard !== cardKey;

/** Personal Information tab: personal, contact, emergency, and remarks cards. */
export function PersonalTab({ controller }: { controller: EditorController }) {
  const { form, update, age } = controller;
  return (
    <div className="grid flex-1 gap-5 xl:grid-cols-2">
      <EditorSection
        title="Personal Information"
        icon={UserCircleIcon}
        cardKey="personal"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={controller.canEditCards}
        onStartEdit={() => controller.startCardEdit("personal", ["firstName", "middleName", "lastName", "dateOfBirth", "gender", "maritalStatus"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="First Name" required><input required disabled={!controller.canEditCards && controller.editingCard !== "personal"} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Middle Name"><input disabled={!controller.canEditCards || (controller.editingCard !== null && controller.editingCard !== "personal")} value={form.middleName} onChange={(e) => update("middleName", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Last Name" required><input required disabled={!controller.canEditCards || (controller.editingCard !== null && controller.editingCard !== "personal")} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Date of Birth"><input type="date" disabled={!controller.canEditCards || (controller.editingCard !== null && controller.editingCard !== "personal")} value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Age"><input readOnly tabIndex={-1} value={age ?? ""} placeholder="Calculated automatically" className={`${inputClass} cursor-not-allowed bg-gray-100`} /></EditorField>
        <EditorField label="Gender"><select disabled={!controller.canEditCards || (controller.editingCard !== null && controller.editingCard !== "personal")} value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></EditorField>
        <EditorField label="Marital Status"><select disabled={!controller.canEditCards || (controller.editingCard !== null && controller.editingCard !== "personal")} value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className={inputClass}><option value="">Select status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></EditorField>
      </EditorSection>

      <EditorSection
        title="Contact Information"
        icon={IdentificationIcon}
        cardKey="contact"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={controller.canEditCards}
        onStartEdit={() => controller.startCardEdit("contact", ["mobileNumber", "email", "address"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Mobile Number"><input inputMode="numeric" disabled={isLocked(controller, "contact")} value={form.mobileNumber} onChange={(e) => update("mobileNumber", formatMobile(e.target.value))} placeholder="0000 000 0000" className={inputClass} /></EditorField>
        <EditorField label="Email"><input type="email" disabled={isLocked(controller, "contact")} value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Address" className="sm:col-span-2"><textarea rows={3} disabled={isLocked(controller, "contact")} value={form.address} onChange={(e) => update("address", e.target.value)} className={textareaClass} /></EditorField>
      </EditorSection>

      <EditorSection
        title="Emergency Information"
        icon={UsersIcon}
        cardKey="emergency"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={controller.canEditCards}
        onStartEdit={() => controller.startCardEdit("emergency", ["emergencyName", "emergencyNumber", "emergencyRelation", "emergencyAddress"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Contact Person"><input disabled={isLocked(controller, "emergency")} value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Contact Number"><input inputMode="numeric" disabled={isLocked(controller, "emergency")} value={form.emergencyNumber} onChange={(e) => update("emergencyNumber", formatMobile(e.target.value))} placeholder="0000 000 0000" className={inputClass} /></EditorField>
        <EditorField label="Relation"><select disabled={isLocked(controller, "emergency")} value={form.emergencyRelation} onChange={(e) => update("emergencyRelation", e.target.value)} className={inputClass}><option value="">Select relation</option><option>Family</option><option>Friend</option><option>Work / Colleague</option><option>Others</option></select></EditorField>
        <EditorField label="Address" className="sm:col-span-2"><textarea rows={3} disabled={isLocked(controller, "emergency")} value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} className={textareaClass} /></EditorField>
      </EditorSection>

      <EditorSection
        title="Remarks"
        icon={ClipboardDocumentListIcon}
        cardKey="remarks"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={controller.canEditCards}
        onStartEdit={() => controller.startCardEdit("remarks", ["remarks"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Additional notes" className="sm:col-span-2"><textarea rows={5} disabled={isLocked(controller, "remarks")} value={form.remarks} onChange={(e) => update("remarks", e.target.value)} className={textareaClass} /></EditorField>
      </EditorSection>
    </div>
  );
}
