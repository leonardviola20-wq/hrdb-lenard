import LoansClient from "@/components/loans/LoansClient";
import {
  getEmployeesLookup,
  getLoanEmployers,
  getLoanReports,
  getLoans,
  getHistoricalSssLoanPayments,
  getPostedLoanReports,
} from "@/app/actions/loans";
import { requireAdminSession } from "@/app/loans/loadLoansData";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  await requireAdminSession();
  const [loans, employees, employers, reports, postedReports, historicalSssPayments] = await Promise.all([
    getLoans(),
    getEmployeesLookup(),
    getLoanEmployers(),
    getLoanReports(),
    getPostedLoanReports(),
    getHistoricalSssLoanPayments(),
  ]);

  return (
    <LoansClient
      loans={loans}
      employees={employees}
      employers={employers}
      reports={reports}
      postedReports={postedReports}
      historicalSssPayments={historicalSssPayments}
    />
  );
}
