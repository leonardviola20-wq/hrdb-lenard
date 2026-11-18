"use client";

import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LoanRow } from "@/app/actions/loans";

export default function LoanActionsMenu({
  loan,
  onEdit,
  onDelete,
}: {
  loan: LoanRow;
  onEdit: (loan: LoanRow) => void;
  onDelete: (loan: LoanRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = 84;
    const menuWidth = 144;
    const gap = 4;
    const canOpenBelow = window.innerHeight - rect.bottom >= menuHeight + gap;
    const top = canOpenBelow ? rect.bottom + gap : rect.top - menuHeight - gap;
    setPosition({
      top: Math.max(gap, Math.min(top, window.innerHeight - menuHeight - gap)),
      left: Math.max(gap, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gap)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !wrapperRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, updatePosition]);

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
        aria-label={`Actions for ${loan.employeeName} loan`}
        aria-expanded={open}
        aria-controls={`loan-actions-${loan.id}`}
        title="Loan actions"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="h-5 w-5" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          id={`loan-actions-${loan.id}`}
          className="fixed z-[60] w-36 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(loan);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PencilSquareIcon aria-hidden="true" className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(loan);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            <TrashIcon aria-hidden="true" className="h-4 w-4" />
            Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
