"use client";

import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { inputClass } from "../shared/constants";

/** Subcomponent: the reports toolbar — add button, search, refresh, and year filter. */
export function ReportsToolbar(props: {
  search: string;
  setSearch: (value: string) => void;
  years: string[];
  yearFilter: string;
  setYearFilter: (value: string) => void;
  refreshingRecords: boolean;
  onResetFilters: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="benefit-report-toolbar border-b border-slate-200 px-4 py-3 sm:px-5">
      <button type="button" onClick={props.onCreate} className="benefit-report-primary"><PlusIcon className="h-4 w-4" /> Add</button>
      <div className="min-w-[180px] flex-1 basis-[260px]">
        <label htmlFor="sss-search" className="sr-only">Search PRN or employer</label>
        <input id="sss-search" value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Search PRN or employer..." className={inputClass} />
      </div>
      <button type="button" onClick={props.onResetFilters} disabled={props.refreshingRecords} aria-label="Reset filters and refresh SSS reports" title="Reset filters and refresh" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"><ArrowPathIcon className={`h-4 w-4 ${props.refreshingRecords ? "animate-spin" : ""}`} /></button>
      <label htmlFor="sss-year-filter" className="sr-only">Filter by year</label>
      <select id="sss-year-filter" value={props.yearFilter} onChange={(event) => props.setYearFilter(event.target.value)} className={`${inputClass} min-w-[140px] flex-1 sm:flex-none sm:w-[150px]`}>{props.years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
    </div>
  );
}
