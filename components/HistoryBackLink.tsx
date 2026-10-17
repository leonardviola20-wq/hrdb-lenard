"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { canGoBackWithinApp } from "@/lib/appNavigationHistory";

type HistoryBackLinkProps = Omit<ComponentProps<typeof Link>, "href" | "ref"> & {
  fallbackHref: string;
  children: ReactNode;
};

/**
 * Route-level Back control. It walks the browser's own history so the screen the user
 * came from keeps its URL state (filters, active tab, browser-restored scroll), and
 * only follows `fallbackHref` when there is no earlier HRDB screen to return to —
 * a direct visit, a bookmark, or a reload.
 */
export function HistoryBackLink({ fallbackHref, onClick, ...props }: HistoryBackLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !canGoBackWithinApp()
    ) {
      return;
    }

    event.preventDefault();
    router.back();
  };

  return <Link {...props} href={fallbackHref} onClick={handleClick} />;
}
