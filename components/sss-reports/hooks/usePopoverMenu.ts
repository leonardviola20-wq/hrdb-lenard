"use client";

import { useRef, useState, type RefObject } from "react";
import { useDismissableMenu } from "../shared/useDismissableMenu";

/** Hook: which row popover is open, plus a dismissable container ref. */
export function usePopoverMenu<T extends HTMLElement = HTMLDivElement>(): {
  openId: number | null;
  setOpenId: (value: number | null) => void;
  ref: RefObject<T | null>;
} {
  const [openId, setOpenId] = useState<number | null>(null);
  const ref = useRef<T>(null);
  useDismissableMenu(openId !== null, ref, () => setOpenId(null));
  return { openId, setOpenId, ref };
}
