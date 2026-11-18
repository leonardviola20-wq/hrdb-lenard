"use client";

import { AmountDueInput, Field } from "../shared/SmallComponents";
import { inputClass } from "../shared/constants";
import { monthNames } from "../shared/format";
import type { Dispatch, SetStateAction } from "react";
import type { DraftFormState, Employer, PaymentKind, Report } from "../shared/types";

/** Subcomponent: employer / PRN / period / amount fields of the create-report form. */
export function ReportFields(props: {
  kind: PaymentKind;
  editReport: Report | null;
  employers: Employer[];
  draft: DraftFormState;
  setDraft: Dispatch<SetStateAction<DraftFormState>>;
  existingLoanReportMonths: Set<number>;
  currentYear: number;
  clearError: () => void;
  clearEntries: () => void;
}) {
  const update = (patch: Partial<DraftFormState>) => props.setDraft((current) => ({ ...current, ...patch }));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Employer" required>
        <select required value={props.draft.employerId} onChange={(event) => { update({ employerId: event.target.value }); props.clearError(); if (!props.editReport) props.clearEntries(); }} className={inputClass}>
          <option value="">Select employer</option>
          {props.employers.map((employer) => <option key={employer.id} value={String(employer.id)}>{employer.name}</option>)}
        </select>
      </Field>
      <Field label="PRN (Payment Reference Number)" required>
        <input required value={props.draft.prn} onChange={(event) => update({ prn: event.target.value })} className={inputClass} placeholder="Enter PRN" />
      </Field>
      <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3 lg:col-span-3">
        <Field label="Applicable Month" required>
          <select value={props.draft.month} onChange={(event) => { update({ month: event.target.value }); props.clearError(); }} className={inputClass}>
            {monthNames.map((month, index) => {
              const monthNumber = index + 1;
              const unavailable = !props.editReport && props.existingLoanReportMonths.has(monthNumber);
              return <option key={month} value={String(monthNumber)} disabled={unavailable}>{month}{unavailable ? " (Paid)" : ""}</option>;
            })}
          </select>
          {props.kind === "LOAN" && !props.editReport && <p className="mt-1 text-xs text-slate-500">Months marked “Paid” are unavailable for this employer and year.</p>}
        </Field>
        <Field label="Applicable Year" required>
          <select value={props.draft.year} onChange={(event) => { update({ year: event.target.value }); props.clearError(); }} className={inputClass}>
            {Array.from({ length: Math.max(1, props.currentYear - 2023 + 2) }, (_, index) => String(props.currentYear + 1 - index))
              .filter((year) => Number(year) >= 2023)
              .map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </Field>
        <Field label="Amount Due" required>
          <AmountDueInput value={props.draft.amountDue} onChange={(value) => update({ amountDue: value })} />
        </Field>
      </div>
    </div>
  );
}
