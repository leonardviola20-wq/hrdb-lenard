"use client";

import { BriefcaseIcon, BuildingOffice2Icon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { JOB_LEVELS } from "@/lib/employeePayload";
import { branchOptions, endedStatuses, positionOptions, statusOptions, type EditorController } from "../types";
import { EditorField, EditorSection, inputClass } from "../shared/EditorSection";

const isLocked = (controller: EditorController, cardKey: string) =>
  controller.editingCard !== cardKey;

/** Employment tab: contract duration, position details, and contract assignment cards. */
export function EmploymentTab({ controller }: { controller: EditorController }) {
  const { form, update, setForm, supervisors, employers, canEditCards, employeeId } = controller;
  return (
    <div className="grid flex-1 gap-5 xl:grid-cols-2">
      <EditorSection
        title="Contract Duration"
        icon={CalendarDaysIcon}
        cardKey="duration"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={canEditCards}
        onStartEdit={() => controller.startCardEdit("duration", ["status", "dateStarted", "endDate"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Status"><select disabled={isLocked(controller, "duration")} value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value, endDate: endedStatuses.has(e.target.value) ? current.endDate : "" }))} className={inputClass}><option value="">Select status</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></EditorField>
        <EditorField label="Date Started"><input type="date" disabled={isLocked(controller, "duration")} value={form.dateStarted} onChange={(e) => update("dateStarted", e.target.value)} className={inputClass} /></EditorField>
        {endedStatuses.has(form.status) && <EditorField label="End Date"><input type="date" disabled={isLocked(controller, "duration")} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} /></EditorField>}
      </EditorSection>

      <EditorSection
        title="Contract Position Details"
        icon={BriefcaseIcon}
        cardKey="position"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={canEditCards}
        onStartEdit={() => controller.startCardEdit("position", ["biometricNo", "position", "jobLevel", "supervisorId"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Biometric Number" required={employeeId === null}><input required={employeeId === null} disabled={isLocked(controller, "position")} value={form.biometricNo} onChange={(e) => update("biometricNo", e.target.value)} className={inputClass} /></EditorField>
        <EditorField label="Job Role"><select disabled={isLocked(controller, "position")} value={form.position} onChange={(e) => update("position", e.target.value)} className={inputClass}><option value="">Select position</option>{positionOptions.map((position) => <option key={position}>{position}</option>)}</select></EditorField>
        <EditorField label="Job Level"><select disabled={isLocked(controller, "position")} value={form.jobLevel} onChange={(e) => update("jobLevel", e.target.value)} className={inputClass}><option value="">Select job level</option>{JOB_LEVELS.map((jobLevel) => <option key={jobLevel}>{jobLevel}</option>)}</select></EditorField>
        <EditorField label="Supervisor"><select disabled={isLocked(controller, "position")} value={form.supervisorId} onChange={(e) => update("supervisorId", e.target.value)} className={inputClass}><option value="">No supervisor assigned</option>{supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{[supervisor.firstName, supervisor.middleName, supervisor.lastName].filter(Boolean).join(" ")}</option>)}</select></EditorField>
        <EditorField label="Expected Work Hours per Week"><input readOnly tabIndex={-1} value="48 hours" className={`${inputClass} cursor-not-allowed bg-gray-100`} /></EditorField>
      </EditorSection>

      <EditorSection
        title="Contract Details"
        icon={BuildingOffice2Icon}
        cardKey="contract"
        editingCard={controller.editingCard}
        savingCard={controller.savingCard}
        canEdit={canEditCards}
        onStartEdit={() => controller.startCardEdit("contract", ["employerId", "branch"])}
        onCancelEdit={controller.cancelCardEdit}
        onSaveCard={controller.saveCard}
      >
        <EditorField label="Employer"><select disabled={isLocked(controller, "contract")} value={form.employerId} onChange={(e) => update("employerId", e.target.value)} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}</select></EditorField>
        <EditorField label="Branch"><select disabled={isLocked(controller, "contract")} value={form.branch} onChange={(e) => update("branch", e.target.value)} className={inputClass}><option value="">Select branch</option>{branchOptions.map((branch) => <option key={branch}>{branch}</option>)}</select></EditorField>
      </EditorSection>
    </div>
  );
}
