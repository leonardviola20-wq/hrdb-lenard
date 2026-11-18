"use client";

import { useState } from "react";
import { inputClass, labelClass, formatMoney } from "./constants";
import { formatAmountDue } from "@/lib/sssReportHelpers";

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className={labelClass}>{label}{required && <span className="ml-1 text-rose-600">*</span>}</span>{children}</label>;
}

export function MoneyInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <div className={`flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 ${disabled ? "bg-slate-100" : ""}`}><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">₱</span><input aria-label="Amount in pesos" type="number" min="0" step="0.01" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100" placeholder="0.00" /></div>;
}

export function AmountPaidInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return <div className="flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">₱</span><input aria-label="Amount Paid in pesos" type="text" inputMode="decimal" value={focused ? value : formatAmountDue(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, ""); const dot = clean.indexOf("."); onChange(dot < 0 ? clean : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`); }} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none" placeholder="0.00" /></div>;
}

export function AmountDueInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return <div className="flex h-10 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"><span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">₱</span><input aria-label="Amount Due in pesos" type="text" inputMode="decimal" value={focused ? value : formatAmountDue(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const clean = event.target.value.replace(/,/g, "").replace(/[^\d.]/g, ""); const dot = clean.indexOf("."); onChange(dot < 0 ? clean : `${clean.slice(0, dot)}.${clean.slice(dot + 1).replace(/\./g, "").slice(0, 2)}`); }} className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none" placeholder="0.00" /></div>;
}

export function LoanDetail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd>
  </div>;
}

export function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value || "—"}</p></div>;
}