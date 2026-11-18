"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

type Employer = { id: number; name: string };
type ProviderOption = { label: string; href: string; provider?: string };

function ProviderActions({
  provider,
  providerLabel,
  employerId,
  disabled,
  vertical,
  active,
}: {
  provider: string;
  providerLabel: string;
  employerId: string;
  disabled: boolean;
  vertical: boolean;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const viewHref = `/reports/contributions/all?${new URLSearchParams({ provider, employerId })}`;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`flex flex-col gap-1 ${vertical ? "w-full" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={`${providerLabel} report actions`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-11 ${vertical ? "w-full" : "min-w-32"} items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 ${
          active ? "bg-blue-800 text-white" : "bg-blue-700 text-white hover:bg-blue-800"
        }`}
      >
        <span className="truncate">{providerLabel}</span>
        <ChevronRightIcon aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <div
        id={menuId}
        role="group"
        aria-label={`${providerLabel} report actions`}
        hidden={!open}
        className={`space-y-1 ${vertical ? "ml-5 border-l border-blue-200 pl-3" : "border-l border-blue-200 pl-3"}`}
      >
        <button
          type="button"
          disabled
          className="block min-h-10 w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400"
        >
          New
        </button>
        <Link
          href={viewHref}
          onClick={() => setOpen(false)}
          className="flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default function EmployerProviderLauncher({
  providers,
  employers: initialEmployers,
  initialEmployerId,
  initialProvider,
  vertical = false,
  stickyOnDesktop = false,
  showProviderActions = false,
  onEmployerChange,
}: {
  providers: ProviderOption[];
  employers?: Employer[];
  initialEmployerId?: string;
  initialProvider?: string;
  vertical?: boolean;
  stickyOnDesktop?: boolean;
  showProviderActions?: boolean;
  onEmployerChange?: (employerId: string) => void;
}) {
  const [loadedEmployers, setLoadedEmployers] = useState<Employer[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState(initialEmployerId ?? "");
  const [loading, setLoading] = useState(initialEmployers === undefined);
  const [error, setError] = useState("");
  const router = useRouter();
  const employers = initialEmployers ?? loadedEmployers;
  const hasSelectedEmployer = employers.some((employer) => String(employer.id) === selectedEmployerId);

  useEffect(() => {
    if (initialEmployers !== undefined) return;

    const controller = new AbortController();
    fetch("/api/reports/sss/employers?summary=1", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { employers?: Employer[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load employers.");
        if (!Array.isArray(data.employers)) throw new Error("Employer list response is invalid.");
        setLoadedEmployers(data.employers);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employers.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [initialEmployers]);

  const openProvider = (provider: ProviderOption) => {
    if (!hasSelectedEmployer) return;
    const params = new URLSearchParams({ employerId: selectedEmployerId });
    if (provider.provider) params.set("provider", provider.provider);
    router.push(`${provider.href}?${params.toString()}`);
  };

  return (
    <section aria-label="Choose employer and provider" className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${vertical ? "flex flex-col gap-4" : "mb-5 sm:flex sm:items-end sm:gap-4"} ${stickyOnDesktop ? "lg:sticky lg:top-4 lg:self-start" : ""}`}>
      <div className="min-w-0 flex-1">
        <label htmlFor="provider-launcher-employer" className="mb-1 block text-sm font-medium text-slate-700">
          Employer
        </label>
        <select
          id="provider-launcher-employer"
          value={hasSelectedEmployer ? selectedEmployerId : ""}
          disabled={loading || employers.length === 0}
          onChange={(event) => {
            const employerId = event.target.value;
            setSelectedEmployerId(employerId);
            onEmployerChange?.(employerId);
          }}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
        >
          <option value="">{loading ? "Loading employers..." : "Select an employer"}</option>
          {employers.map((employer) => (
            <option key={employer.id} value={String(employer.id)}>{employer.name}</option>
          ))}
        </select>
        {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
        {!loading && !error && employers.length === 0 && (
          <p role="status" className="mt-2 text-sm text-slate-600">No employers available.</p>
        )}
      </div>
      <div className={`flex gap-2 ${vertical ? "flex-col" : "mt-3 flex-wrap sm:mt-0"}`}>
        {providers.map((provider) => {
          const key = `${provider.href}:${provider.provider ?? provider.label}`;
          const isActive = initialProvider === provider.provider;

          if (showProviderActions && provider.provider) {
            return (
              <ProviderActions
                key={key}
                provider={provider.provider}
                providerLabel={provider.label}
                employerId={selectedEmployerId}
                disabled={!hasSelectedEmployer}
                vertical={vertical}
                active={isActive}
              />
            );
          }

          return (
            <button
              key={key}
              type="button"
              disabled={!hasSelectedEmployer}
              onClick={() => openProvider(provider)}
              aria-pressed={isActive}
              className={`min-h-11 min-w-24 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 ${
                isActive ? "bg-blue-800 text-white" : "bg-blue-700 text-white hover:bg-blue-800"
              }`}
            >
              {provider.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
