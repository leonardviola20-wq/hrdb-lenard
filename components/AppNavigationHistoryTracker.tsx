"use client";

import { useEffect } from "react";
import { recordAppRoute, toAppRoute, type AppRouteChangeKind } from "@/lib/appNavigationHistory";

// Signed-out screens are never recorded, so an in-app Back control can never
// return an authenticated user to the login, registration, or landing page.
const publicRoutes = new Set(["/", "/login", "/register"]);

function currentAppRoute() {
  return toAppRoute({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  });
}

/**
 * Mirrors every browser history change (Next.js client navigations, in-page links,
 * and Back/Forward traversal) into the in-app route trail that Back controls read.
 * Renders nothing.
 */
export function AppNavigationHistoryTracker() {
  useEffect(() => {
    const record = (change: AppRouteChangeKind) => {
      if (publicRoutes.has(window.location.pathname)) return;
      recordAppRoute(currentAppRoute(), change);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalPushState.call(window.history, data, unused, url);
      record("push");
    };
    window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalReplaceState.call(window.history, data, unused, url);
      record("replace");
    };

    const handlePopState = () => record("traversal");
    window.addEventListener("popstate", handlePopState);

    // A full document load has no push to observe, so the current screen becomes
    // the first known trail entry.
    record("push");

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
