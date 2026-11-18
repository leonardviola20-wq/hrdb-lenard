"use client";

import {
  BanknotesIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import type { LoanReportRow } from "@/app/actions/loans";
import {
  formatLoanReportShortBillingMonth,
  isLoanReportPosted,
} from "@/lib/loanReportDisplay";
import useLoanReportActionMenu from "./useLoanReportActionMenu";

export default function LoanReportActionsMenu({
  report,
  onView,
  onEdit,
  onAddPayment,
  onDelete,
  canManageReports,
}: {
  report: LoanReportRow;
  onView: (report: LoanReportRow) => void;
  onEdit?: (report: LoanReportRow) => void;
  onAddPayment: (report: LoanReportRow) => void;
  onDelete: (reportId: string) => Promise<void>;
  canManageReports: boolean;
}) {
  const isPosted = isLoanReportPosted(report);
  const canRecordPayment = canManageReports && !isPosted;
  const canEdit = canManageReports && !isPosted && Boolean(onEdit);
  const menuHeight = 40 * ((canRecordPayment ? 1 : 0) + (canEdit ? 1 : 0) + (canManageReports ? 2 : 1));
  const menuWidth = 176;
  const { open, setOpen, position, triggerRef, wrapperRef, menuRef, updatePosition } =
    useLoanReportActionMenu(menuHeight, menuWidth);
  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  if (!canManageReports && report.historicalSssReport?.sourceSystem !== "imported") {
    return (
      <button
        type="button"
        onClick={() => onView(report)}
        aria-label={`View ${formatLoanReportShortBillingMonth(report.applicableDate)} report`}
        title="View report"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <EyeIcon aria-hidden="true" className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div ref={wrapperRef} className="flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) setOpen(false);
          else {
            updatePosition();
            setOpen(true);
          }
        }}
        aria-label={`Actions for ${formatLoanReportShortBillingMonth(report.applicableDate)} report`}
        aria-expanded={open}
        aria-controls={`loan-report-actions-${report.id}`}
        title="Report actions"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="h-5 w-5" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          id={`loan-report-actions-${report.id}`}
          role="menu"
          className="fixed z-[60] w-44 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          {canRecordPayment && (
            <button type="button" role="menuitem" onClick={() => closeAndRun(() => onAddPayment(report))}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
              <BanknotesIcon aria-hidden="true" className="h-4 w-4" />
              Payment
            </button>
          )}
          {canEdit && onEdit && (
            <button type="button" role="menuitem" onClick={() => closeAndRun(() => onEdit(report))}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <PencilSquareIcon aria-hidden="true" className="h-4 w-4" />
              Edit
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => closeAndRun(() => onView(report))}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
            <EyeIcon aria-hidden="true" className="h-4 w-4" />
            View
          </button>
          {canManageReports && (
            <button
              type="button"
              role="menuitem"
              onClick={() => closeAndRun(() => {
                if (window.confirm(`Delete the report for ${formatLoanReportShortBillingMonth(report.applicableDate)}? This cannot be undone.`)) {
                  void onDelete(report.id);
                }
              })}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
            >
              <TrashIcon aria-hidden="true" className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
