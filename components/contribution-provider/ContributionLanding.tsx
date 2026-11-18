"use client";

import { useState } from "react";
import EmployerProviderLauncher from "@/components/EmployerProviderLauncher";
import ContributionPaymentSummary from "./ContributionPaymentSummary";
import type { ContributionProvider } from "./types";

const providers = [
  { label: "SSS", href: "/reports/contributions", provider: "sss" },
  { label: "PagIBIG", href: "/reports/contributions", provider: "pagibig" },
  { label: "PhilHealth", href: "/reports/contributions", provider: "philhealth" },
];

export default function ContributionLanding({
  initialEmployerId,
  initialProvider,
}: {
  initialEmployerId?: string;
  initialProvider: ContributionProvider;
}) {
  const [employerId, setEmployerId] = useState(initialEmployerId);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <EmployerProviderLauncher
        initialEmployerId={employerId}
        initialProvider={initialProvider}
        vertical
        stickyOnDesktop
        showProviderActions
        onEmployerChange={setEmployerId}
        providers={providers}
      />
      <ContributionPaymentSummary employerId={employerId} provider={initialProvider} />
    </div>
  );
}
