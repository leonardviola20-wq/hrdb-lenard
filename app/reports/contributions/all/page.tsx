import Link from "next/link";
import ContributionProviderContent from "@/components/ContributionProviderContent";
import type { ContributionProvider } from "@/components/contribution-provider/types";

type SearchParams = Promise<{
  provider?: string | string[];
  employerId?: string | string[];
}>;

function isProvider(value: string | string[] | undefined): value is ContributionProvider {
  return value === "sss" || value === "pagibig" || value === "philhealth";
}

export default async function AllContributionReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const { provider, employerId } = await searchParams;
  const selectedEmployerId = typeof employerId === "string" && /^\d+$/.test(employerId) && Number(employerId) > 0
    ? employerId
    : undefined;
  const selectedProvider = isProvider(provider) ? provider : null;

  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="w-full">
        {selectedProvider && selectedEmployerId ? (
          <ContributionProviderContent
            key={`${selectedProvider}:${employerId}`}
            provider={selectedProvider}
            initialEmployerId={selectedEmployerId}
            allReportsMode
          />
        ) : (
          <div>
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-600">
              <Link href="/reports/contributions" className="font-medium text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Contribution
              </Link>
            </nav>
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Select a valid provider and employer from the Contribution Page to view reports.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
