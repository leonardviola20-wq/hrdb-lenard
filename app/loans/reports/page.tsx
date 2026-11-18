import { getEmployeesLookup, getLoanReports } from "@/app/actions/loans";
import { requireAdminSession } from "@/app/loans/loadLoansData";
import LoanReportsSection from "@/components/loans/LoanReportsSection";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function LoanReportsPage() {
  await requireAdminSession();
  const [reports, employees] = await Promise.all([getLoanReports(), getEmployeesLookup()]);

  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-3 sm:p-5 lg:p-6">
      <PageHeader title="Generated Reports" subtitle="Review saved SSS and Pag-IBIG loan snapshots." />
      <LoanReportsSection
        reports={reports}
        employees={employees}
        title="Generated Reports"
        hideOutstanding
        emptyMessage="No generated reports."
      />
    </main>
  );
}
