import { Suspense } from "react";
import SssReportsPage from "@/components/SssReportsPage";

export default function Page() {
  return (
    <Suspense fallback={<main className="benefit-report-page min-h-[calc(100dvh-8rem)] p-4 sm:p-6 lg:p-8" aria-busy="true" />}>
      <SssReportsPage />
    </Suspense>
  );
}
