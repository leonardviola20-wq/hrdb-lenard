"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, type KeyboardEvent } from "react";
import ContributionProviderContent from "@/components/ContributionProviderContent";

const providers = [
  { id: "sss", label: "SSS" },
  { id: "pagibig", label: "PagIBIG" },
  { id: "philhealth", label: "PhilHealth" },
] as const;

type Provider = (typeof providers)[number]["id"];

export default function ContributionProviderTabs({
  initialProvider,
  initialEmployerId,
}: {
  initialProvider: Provider;
  initialEmployerId?: string;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProvider = providers.find((item) => item.id === searchParams.get("provider"))?.id ?? initialProvider;
  const selectedEmployerId = searchParams.get("employerId") ?? initialEmployerId ?? "";

  const selectProvider = (provider: Provider) => {
    const params = new URLSearchParams({ provider });
    if (selectedEmployerId) params.set("employerId", selectedEmployerId);
    router.replace(`/reports/contributions?${params.toString()}`, { scroll: false });
  };

  const changeEmployer = (employerId: string) => {
    const params = new URLSearchParams({ provider: selectedProvider });
    if (employerId) params.set("employerId", employerId);
    router.replace(`/reports/contributions?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % providers.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + providers.length) % providers.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = providers.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const provider = providers[nextIndex].id;
    selectProvider(provider);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Contribution providers" className="flex border-b border-slate-200">
        {providers.map((provider, index) => {
          const selected = selectedProvider === provider.id;
          return (
            <button
              key={provider.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              id={`contribution-tab-${provider.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectProvider(provider.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 flex-1 border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:flex-none sm:px-6 ${
                selected
                  ? "border-blue-700 text-blue-800"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {provider.label}
            </button>
          );
        })}
      </div>
      <section
        role="tabpanel"
        id={`contribution-panel-${selectedProvider}`}
        aria-labelledby={`contribution-tab-${selectedProvider}`}
        tabIndex={0}
      >
        <ContributionProviderContent
          key={`${selectedProvider}:${selectedEmployerId}`}
          provider={selectedProvider}
          initialEmployerId={initialEmployerId}
          onEmployerChange={changeEmployer}
        />
      </section>
    </div>
  );
}
