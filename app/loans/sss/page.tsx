import ProviderLoansClient from "@/components/loans/ProviderLoansClient";
import { getHistoricalSssLoanReports } from "@/app/actions/loans";
import { loadLoansPageData, requireAdminSession } from "@/app/loans/loadLoansData";

export const dynamic = "force-dynamic";

export default async function SssLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ employerId?: string | string[] }>;
}) {
  await requireAdminSession();
  const [{ loans, employees, employers, previousReports }, historicalSssReports] = await Promise.all([
    loadLoansPageData(),
    getHistoricalSssLoanReports(),
  ]);
  const requestedEmployerId = (await searchParams).employerId;
  const initialEmployerId = typeof requestedEmployerId === "string" &&
    employers.some((employer) => String(employer.id) === requestedEmployerId)
    ? requestedEmployerId
    : undefined;

  return (
    <ProviderLoansClient
      provider="SSS"
      loans={loans}
      employees={employees}
      employers={employers}
      previousReports={previousReports}
      historicalSssReports={historicalSssReports}
      initialEmployerId={initialEmployerId}
    />
  );
}
