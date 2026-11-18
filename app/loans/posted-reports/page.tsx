import {
  getHistoricalSssLoanPayments,
  getPostedLoanReports,
} from "@/app/actions/loans";
import { requirePostedLoanReportsSession } from "@/app/loans/loadLoansData";
import HistoricalSssLoanReports from "@/components/loans/HistoricalSssLoanReports";
import LoanReportsSection from "@/components/loans/LoanReportsSection";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function PostedLoanReportsPage() {
  const session = await requirePostedLoanReportsSession();
  const [reports, historicalPayments] = await Promise.all([
    getPostedLoanReports(),
    getHistoricalSssLoanPayments(),
  ]);

  return (
    <main className="min-h-0 w-full flex-1 bg-gray-50 p-3 sm:p-5 lg:p-6">
      <PageHeader title="Posted Reports" subtitle="Reports with saved PRN and payment date." />
      <div className="space-y-6">
        <LoanReportsSection
          reports={reports}
          title="Posted Reports"
          hideOutstanding
          largePrn
          canManageReports={session.role === "ADMIN"}
          canEditReports={false}
          description="Saved payment details for SSS and Pag-IBIG loan reports."
          emptyMessage="No posted reports yet."
        />
        <HistoricalSssLoanReports reports={historicalPayments} variant="payments" />
      </div>
    </main>
  );
}
