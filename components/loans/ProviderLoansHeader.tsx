import PageHeader from "@/components/PageHeader";
import ProviderLoansToolbar from "@/components/loans/ProviderLoansToolbar";

type Props = {
  provider: "SSS" | "PAGIBIG";
  employeeCount: number;
  loanCount: number;
  reportOpen: boolean;
  historicalReportsCount?: number;
  onAddLoan: () => void;
  onOpenReports: () => void;
  onOpenHistoricalReports?: () => void;
  onBackToLoanList: () => void;
};

export default function ProviderLoansHeader({
  provider,
  employeeCount,
  loanCount,
  reportOpen,
  historicalReportsCount,
  onAddLoan,
  onOpenReports,
  onOpenHistoricalReports,
  onBackToLoanList,
}: Props) {
  return (
    <PageHeader
      title={provider === "SSS" ? "SSS Loans" : "HDMF Loans"}
      subtitle={provider === "SSS" ? "Salary, Calamity, and Emergency loan accounts." : "Pag-IBIG (HDMF) MPL, Calamity, Emergency, and SAFE loan accounts."}
      leadingContent={provider === "SSS" ? (
        <ProviderLoansToolbar
          addDisabled={employeeCount === 0}
          reportsDisabled={loanCount === 0}
          showLoanActions={false}
          showGeneratedReports={false}
          onAddLoan={onAddLoan}
          onOpenReports={onOpenReports}
        />
      ) : undefined}
      actions={provider === "SSS" ? (
        <ProviderLoansToolbar
          addDisabled={employeeCount === 0}
          reportsDisabled={loanCount === 0}
          showBack={false}
          showLoanActions={!reportOpen}
          showGeneratedReports={false}
          showBackToLoanList={reportOpen}
          historicalReportsCount={historicalReportsCount}
          onOpenHistoricalReports={onOpenHistoricalReports}
          onBackToLoanList={onBackToLoanList}
          onAddLoan={onAddLoan}
          onOpenReports={onOpenReports}
        />
      ) : undefined}
    />
  );
}
