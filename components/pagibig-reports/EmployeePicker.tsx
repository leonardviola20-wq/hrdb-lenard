"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { inputClass } from "./constants";
import { formatEmployeeName } from "./format";
import type { Member } from "./types";

export function EmployeePicker({
  options,
  value,
  onChange,
  disabled,
  prominent = false,
  labelId = "pagibig-employee-picker-label",
  closeOnSelect = true,
}: {
  options: Member[];
  value: string;
  onChange: (employeeId: string) => void;
  disabled: boolean;
  prominent?: boolean;
  labelId?: string;
  closeOnSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedEmployee = options.find((employee) => String(employee.id) === value);
  const matchingEmployees = options.filter((employee) =>
    `${formatEmployeeName(employee)} ${employee.employeeCode} ${employee.pagIbigNumber ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setOpen(false);
        setFocused(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  const displayValue = focused || open ? query : selectedEmployee ? formatEmployeeName(selectedEmployee) : "";

  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          disabled={disabled}
          value={displayValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setFocused(true);
            setOpen(nextValue.trim().length > 0);
          }}
          onFocus={() => {
            setFocused(true);
            setQuery("");
            setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
            if (event.key === "Escape") {
              setOpen(false);
              setFocused(false);
              setQuery("");
            }
          }}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-controls={open ? "pagibig-employee-picker-list" : undefined}
          placeholder={focused || open ? "Search name, code, or MID number" : "Select employee"}
          className={`${inputClass} pr-9 ${prominent ? "h-12 text-base font-bold" : ""} disabled:cursor-not-allowed disabled:bg-slate-100`}
        />
        <ChevronDownIcon className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl">
          <div role="listbox" id="pagibig-employee-picker-list" aria-label="Employees" className="max-h-56 overflow-y-auto overscroll-contain">
            {matchingEmployees.map((employee) => {
              const selected = String(employee.id) === value;
              return (
                <button
                  key={employee.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(String(employee.id));
                    setQuery("");
                    if (!closeOnSelect) {
                      setFocused(true);
                      setOpen(false);
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    } else {
                      setFocused(false);
                      setOpen(false);
                    }
                  }}
                  className={`flex w-full flex-col px-3 py-2 text-left hover:bg-violet-50 ${selected ? "bg-violet-50" : "bg-white"}`}
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {formatEmployeeName(employee)}
                    {employee.pagIbigNumber && <span className="font-normal text-slate-500"> - {employee.pagIbigNumber}</span>}
                  </span>
                </button>
              );
            })}
            {matchingEmployees.length === 0 && <p className="px-3 py-4 text-sm font-medium text-slate-600">No employees found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
