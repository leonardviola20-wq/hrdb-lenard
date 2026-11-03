"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  meta,
  onClose,
  wide,
  fullWidth,
  fullHeight,
  footer,
  printOnly,
  children,
}: {
  title: string;
  subtitle: string;
  meta?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  footer?: ReactNode;
  printOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={printOnly ? "sss-loan-report-print-overlay" : undefined} className={`fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 ${fullHeight ? "p-2 sm:p-3" : "p-3 sm:p-6"} ${printOnly ? "sss-loan-report-print-overlay" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="sss-modal-title" className={`flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${fullHeight ? "h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-1.5rem)]" : "max-h-[94dvh]"} ${fullWidth ? "max-w-[min(96vw,1600px)]" : wide ? "max-w-6xl" : "max-w-xl"} ${printOnly ? "sss-loan-report-print-dialog" : ""}`}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <h2 id="sss-modal-title" className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-start gap-3">
            {meta && <div className={`max-w-[45vw] pt-1.5 text-right text-[11px] font-normal leading-snug text-slate-500 sm:max-w-[20rem] ${printOnly ? "print:hidden" : ""}`}>{meta}</div>}
            <button type="button" onClick={onClose} aria-label="Close" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 ${printOnly ? "print:hidden" : ""}`}><XMarkIcon className="h-5 w-5" /></button>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 ${printOnly ? "sss-loan-report-print-content" : ""}`}>{children}</div>
        {footer}
      </section>
    </div>
  );
}