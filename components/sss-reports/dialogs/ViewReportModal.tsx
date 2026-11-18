"use client";

import { Modal } from "../shared/Modal";
import { ReportMetaLine, ReportSavedView } from "../tables/ReportsTables";
import { monthNames } from "../shared/format";
import type { Report } from "../shared/types";
import { PrinterIcon } from "@heroicons/react/24/outline";

/** Component: read-only view of a saved SSS report with payment details. */
export function ViewReportModal(props: { report: Report; onClose: () => void }) {
  return (
    <Modal
      title={`${props.report.kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report`}
      subtitle={`${monthNames[props.report.applicableMonth - 1]} ${props.report.applicableYear} · PRN ${props.report.prn}`}
      meta={
        <div className="flex items-center justify-end gap-2">
          <ReportMetaLine report={props.report} />
          {props.report.kind === "CONTRIBUTION" && (
            <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 print:hidden">
              <PrinterIcon className="h-4 w-4" aria-hidden="true" />
              Print
            </button>
          )}
        </div>
      }
      onClose={props.onClose}
      wide
      fullWidth
      printOnly={props.report.kind === "CONTRIBUTION"}
      printOverlayId="sss-contribution-report-print-overlay"
      footer={
        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-7 print:hidden">
          <button type="button" onClick={props.onClose} className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      }
    >
      <ReportSavedView report={props.report} />
    </Modal>
  );
}
