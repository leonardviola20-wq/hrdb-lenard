"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function useLoanReportActionMenu(menuHeight: number, menuWidth: number) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const canOpenBelow = window.innerHeight - rect.bottom >= menuHeight + gap;
    const top = canOpenBelow ? rect.bottom + gap : rect.top - menuHeight - gap;
    setPosition({
      top: Math.max(gap, Math.min(top, window.innerHeight - menuHeight - gap)),
      left: Math.max(gap, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gap)),
    });
  }, [menuHeight, menuWidth]);

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

  return {
    open,
    setOpen,
    position,
    triggerRef,
    wrapperRef,
    menuRef,
    updatePosition,
  };
}
