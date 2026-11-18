"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useRefreshOnRestore() {
  const router = useRouter();

  useEffect(() => {
    let wasHidden = document.visibilityState === "hidden";
    const refreshWhenRestored = () => {
      const isVisible = document.visibilityState === "visible";
      if (isVisible && wasHidden) router.refresh();
      wasHidden = !isVisible;
    };
    const refreshFromBackForwardCache = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    const refreshFromHistory = () => router.refresh();

    document.addEventListener("visibilitychange", refreshWhenRestored);
    window.addEventListener("pageshow", refreshFromBackForwardCache);
    window.addEventListener("popstate", refreshFromHistory);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenRestored);
      window.removeEventListener("pageshow", refreshFromBackForwardCache);
      window.removeEventListener("popstate", refreshFromHistory);
    };
  }, [router]);
}
