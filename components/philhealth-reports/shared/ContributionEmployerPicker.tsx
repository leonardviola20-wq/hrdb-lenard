"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Employer = { id: number; name: string };

export default function ContributionEmployerPicker({
  id,
  labelId,
  employers,
  selectedEmployerId,
  disabled,
  onChange,
}: {
  id: string;
  labelId: string;
  employers: Employer[];
  selectedEmployerId: string;
  disabled: boolean;
  onChange: (employerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, employers.findIndex((employer) => String(employer.id) === selectedEmployerId));
  const selectedEmployer = employers[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const openOptions = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
  };

  const chooseEmployer = (employer: Employer) => {
    onChange(String(employer.id));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openOptions();
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") nextIndex = Math.min(index + 1, employers.length - 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(index - 1, 0);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = employers.length - 1;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (nextIndex !== undefined) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-controls="philhealth-contribution-employer-options"
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openOptions()}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
      >
        <span className="truncate">{selectedEmployer?.name ?? (disabled ? "Loading employers..." : "No employers available")}</span>
        <ChevronDownIcon aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && employers.length > 0 && (
        <div
          id="philhealth-contribution-employer-options"
          role="listbox"
          aria-label="Employers"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(18rem,calc(100dvh-10rem))] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
        >
          {employers.map((employer, index) => {
            const selected = String(employer.id) === selectedEmployerId;
            return (
              <button
                key={employer.id}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onClick={() => chooseEmployer(employer)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  selected ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {employer.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
