import PageHeader from "@/components/PageHeader";
import ContributionLanding from "@/components/contribution-provider/ContributionLanding";

type ContributionProvider = "sss" | "pagibig" | "philhealth";

function isContributionProvider(value: string | string[] | undefined): value is ContributionProvider {
  return value === "sss" || value === "pagibig" || value === "philhealth";
}

export default async function ContributionPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string | string[]; employerId?: string | string[] }>;
}) {
  const { provider, employerId } = await searchParams;
  const selectedEmployerId = typeof employerId === "string" ? employerId : undefined;
  const selectedProvider = isContributionProvider(provider) ? provider : "sss";
  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="w-full">
        <PageHeader title="Contribution Page" subtitle="Monitor SSS employer contributions and loan payments." />
        <ContributionLanding initialEmployerId={selectedEmployerId} initialProvider={selectedProvider} />
      </div>
    </main>
  );
}
