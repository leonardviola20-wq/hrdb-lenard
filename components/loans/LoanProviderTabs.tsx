"use client";

import { useRef, type KeyboardEvent } from "react";
import type { LoanRow } from "@/app/actions/loans";

export const LOAN_PROVIDERS: LoanRow["provider"][] = ["SSS", "PAGIBIG"];

export default function LoanProviderTabs({
  activeProvider,
  onChange,
}: {
  activeProvider: LoanRow["provider"];
  onChange: (provider: LoanRow["provider"]) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % LOAN_PROVIDERS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index + LOAN_PROVIDERS.length - 1) % LOAN_PROVIDERS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = LOAN_PROVIDERS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    onChange(LOAN_PROVIDERS[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div role="tablist" aria-label="Loan provider" className="mb-3 flex shrink-0 border-b border-slate-200">
      {LOAN_PROVIDERS.map((provider, index) => {
        const selected = activeProvider === provider;
        const label = provider === "SSS" ? "SSS" : "Pag-IBIG";
        return (
          <button
            key={provider}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`loans-${provider.toLowerCase()}-tab`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`loans-${provider.toLowerCase()}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(provider)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-11 border-b-2 px-5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              selected
                ? provider === "SSS"
                  ? "border-blue-600 text-blue-700"
                  : "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
