"use client";

import { DraftsMenu } from "../tables/ReportsTables";
import type { Employer, PaymentKind, SssReportDraft } from "../shared/types";

/** Subcomponent: heading of the reports panel — title, employer line, drafts/actions buttons. */
export function ReportsPanelHeading(props: {
  kind: PaymentKind;
  employerName: string | null;
  employerSss: string | null;
  visibleReportDrafts: SssReportDraft[];
  draftMenuOpen: boolean;
  setDraftMenuOpen: (value: boolean) => void;
  employers: Employer[];
  saving: boolean;
  onResumeDraft: (draft: SssReportDraft) => void;
  onDeleteDraft: (draft: SssReportDraft) => void;
  onOpenContributionTable: () => void;
  onOpenLoans: () => void;
}) {
  return (
    <div className="benefit-report-section-heading gap-3 sm:px-5">
      <div className="flex-1">
        <h2 className="benefit-report-title">{props.kind === "CONTRIBUTION" ? "Contribution Reports" : "Loan Reports"}</h2>
        {props.employerName && <p className="text-xs text-slate-600">{props.employerName} · {props.employerSss || "—"}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DraftsMenu
          visibleReportDrafts={props.visibleReportDrafts}
          draftMenuOpen={props.draftMenuOpen}
          setDraftMenuOpen={props.setDraftMenuOpen}
          kind={props.kind}
          employers={props.employers}
          saving={props.saving}
          resumeReportDraft={props.onResumeDraft}
          deleteReportDraft={props.onDeleteDraft}
        />
        {props.kind === "CONTRIBUTION"
          ? <button type="button" onClick={props.onOpenContributionTable} className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">SSS Table</button>
          : <button type="button" onClick={props.onOpenLoans} title="View or add employee SSS loans" className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">View Loans</button>}
      </div>
    </div>
  );
}
