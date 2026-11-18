import ProviderLoansClient from "@/components/loans/ProviderLoansClient";
import { loadLoansPageData, requireAdminSession } from "@/app/loans/loadLoansData";

export const dynamic = "force-dynamic";

export default async function HdmfLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ employerId?: string | string[] }>;
}) {
  await requireAdminSession();
  const { loans, employees, employers, previousReports } = await loadLoansPageData();
  const requestedEmployerId = (await searchParams).employerId;
  const initialEmployerId = typeof requestedEmployerId === "string" &&
    employers.some((employer) => String(employer.id) === requestedEmployerId)
    ? requestedEmployerId
    : undefined;

  return <ProviderLoansClient provider="PAGIBIG" loans={loans} employees={employees} employers={employers} previousReports={previousReports} initialEmployerId={initialEmployerId} />;
}
