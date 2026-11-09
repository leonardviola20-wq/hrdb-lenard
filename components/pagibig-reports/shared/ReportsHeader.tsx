"use client";

import Link from "next/link";
import { ArrowPathIcon, ChevronLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { inputClass } from '@/components/pagibig-reports/shared/constants';
import { useDismissableMenu } from '@/components/pagibig-reports/shared/useDismissableMenu';
import type { DraftsMenuProps } from '@/components/pagibig-reports/shared/DraftsMenu';
import { DraftsMenu } from '@/components/pagibig-reports/shared/DraftsMenu';
import type { ReportEmployer } from '@/components/pagibig-reports/shared/types';

export type PagIbigReportsHeaderProps = {
  selectedEmployerId: string;
  paymentsView: boolean;
  reportEmployer: ReportEmployer | null;
  refreshing: boolean;
  onRefresh: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  years: Array<string | number>;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  paymentStatusFilter: "ALL" | "PAID" | "UNPAID";
  onPaymentStatusFilterChange: (value: "ALL" | "PAID" | "UNPAID") => void;
  memberStatusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onMemberStatusFilterChange: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
  reportView: "PIF" | "MANUAL";
  onReportViewChange: (value: "PIF" | "MANUAL") => void;
  onOpenManualReportForm: () => void;
  onOpenPifReportForm: () => void;
  onOpenAddAccount: () => void;
  drafts?: DraftsMenuProps;
};

const iconButtonClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const pillLinkClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2";
const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50";

/** Header + toolbar shared by both the payments and members views. */
export function PagIbigReportsHeader(props: PagIbigReportsHeaderProps) {
  const {
    selectedEmployerId, paymentsView, reportEmployer, refreshing, onRefresh,
    search, onSearchChange, years, yearFilter, onYearFilterChange,
    paymentStatusFilter, onPaymentStatusFilterChange,
    memberStatusFilter, onMemberStatusFilterChange,
    reportView, onReportViewChange,
    onOpenManualReportForm, onOpenPifReportForm, onOpenAddAccount,
    drafts,
  } = props;

  const newReportMenuRef = useRef<HTMLDivElement | null>(null);
  const [newReportMenuOpen, setNewReportMenuOpen] = useState(false);
  useDismissableMenu(newReportMenuRef, newReportMenuOpen, () => setNewReportMenuOpen(false));

  const employerLabel =
    reportEmployer?.id === Number(selectedEmployerId)
      ? `${reportEmployer.name} · ${reportEmployer.pagibigNumber || "-"}`
      : null;

  return (
    <section className="benefit-report-header shrink-0 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/reports?employerId=${encodeURIComponent(selectedEmployerId)}`} aria-label="Back to Reports" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">Benefits reports</p>
            <h1 className="benefit-report-title">{paymentsView ? "Payments" : "Employee List"}</h1>
            {employerLabel && <p className="truncate text-sm font-semibold text-slate-700" title={employerLabel}>{employerLabel}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {paymentsView ? (
            <Link href={`/reports/pagibig?view=members&employerId=${encodeURIComponent(selectedEmployerId)}`} aria-current="page" className={pillLinkClass}>Employees</Link>
          ) : (
            <Link href={`/reports/pagibig?view=payments&employerId=${encodeURIComponent(selectedEmployerId)}`} className={pillLinkClass}>Payments</Link>
          )}
        </div>
      </div>

      <div className="benefit-report-toolbar mt-3 min-w-0 border-t border-slate-100 pt-3">
        {selectedEmployerId && (paymentsView ? (
          <>
            <div ref={newReportMenuOpen ? newReportMenuRef : null} className="relative">
              <button type="button" onClick={() => setNewReportMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={newReportMenuOpen} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />New</button>
              {newReportMenuOpen && (
                <div role="menu" className="absolute left-0 z-20 mt-2 min-w-[9rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <button type="button" role="menuitem" onClick={() => { setNewReportMenuOpen(false); onOpenManualReportForm(); }} className={menuItemClass}><PlusIcon className="h-4 w-4" />Manual</button>
                  <button type="button" role="menuitem" onClick={() => { setNewReportMenuOpen(false); onOpenPifReportForm(); }} className={menuItemClass}><PlusIcon className="h-4 w-4" />PIF</button>
                </div>
              )}
            </div>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1" role="tablist" aria-label="Pag-IBIG payment view">
              <button type="button" role="tab" aria-selected={reportView === "PIF"} onClick={() => onReportViewChange("PIF")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${reportView === "PIF" ? "bg-violet-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>PIF</button>
              <button type="button" role="tab" aria-selected={reportView === "MANUAL"} onClick={() => onReportViewChange("MANUAL")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${reportView === "MANUAL" ? "bg-violet-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}>Manual</button>
            </div>
          </>
        ) : (
          <button type="button" onClick={onOpenAddAccount} className="benefit-report-primary whitespace-nowrap"><PlusIcon className="h-4 w-4" />Add</button>
        ))}
        <input id="pagibig-search" aria-label="Search Pag-IBIG records" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={paymentsView ? "Search period or employee" : "Search employee, code, or MID"} className={`${inputClass} min-w-[14rem] flex-[2_1_16rem]`} />
        {paymentsView ? (
          <>
            <select id="pagibig-year" aria-label="Filter reports by year" value={yearFilter} onChange={(event) => onYearFilterChange(event.target.value)} className={`${inputClass} flex-[0_0_8rem]`}>
              <option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select id="pagibig-payment-status" aria-label="Filter reports by payment status" value={paymentStatusFilter} onChange={(event) => {
              const value = event.target.value;
              if (value === "ALL" || value === "PAID" || value === "UNPAID") onPaymentStatusFilterChange(value);
            }} className={`${inputClass} flex-[0_0_8rem]`}>
              <option value="ALL">All statuses</option><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option>
            </select>
          </>
        ) : (
          <select id="pagibig-member-status" aria-label="Filter employee accounts by status" value={memberStatusFilter} onChange={(event) => {
            const status = event.target.value;
            if (status === "ALL" || status === "ACTIVE" || status === "INACTIVE") onMemberStatusFilterChange(status);
          }} className={`${inputClass} flex-[0_0_10rem]`}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        )}
        <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Refresh Pag-IBIG records" title="Refresh" className={iconButtonClass}><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
        {selectedEmployerId && paymentsView && drafts && <DraftsMenu {...drafts} />}
      </div>
    </section>
  );
}


