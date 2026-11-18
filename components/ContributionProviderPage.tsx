import PageHeader from "@/components/PageHeader";
import BackButton from "@/components/BackButton";
import ContributionProviderContent from "@/components/ContributionProviderContent";

const providerDetails = {
  sss: { title: "SSS Reports", subtitle: "Manage SSS employer contributions." },
  pagibig: { title: "PagIBIG Reports", subtitle: "Manage PagIBIG employer contributions." },
  philhealth: { title: "Philhealth Contributions", subtitle: "Manage Philhealth employer contributions." },
} as const;

export default function ContributionProviderPage({ provider }: { provider: keyof typeof providerDetails }) {
  const { title, subtitle } = providerDetails[provider];

  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-4 sm:p-6">
      <div className="w-full">
        <PageHeader
          title={title}
          subtitle={subtitle}
          leadingContent={<BackButton fallbackHref="/reports/contributions" label="Back to Contributions" />}
        />
        <ContributionProviderContent provider={provider} />
      </div>
    </main>
  );
}
