import LoanReportEmployerSelect from "@/components/loans/LoanReportEmployerSelect";
import LoanReportDateSearch from "@/components/loans/LoanReportDateSearch";
import type { LoanRow } from "@/app/actions/loans";

type Props = {
  idPrefix: string;
  provider: LoanRow["provider"];
  employers: { id: number; name: string }[];
  employerId: string;
  busy: boolean;
  hasPreviousReport: boolean;
  occupiedMonths: string[];
  selectedEmployerName: string;
  duplicateMonth: boolean;
  month: string;
  year: string;
  yearOptions: string[];
  search: string;
  onEmployerChange: (value: string) => void;
  onLoadPrevious: () => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export default function LoanReportPanelControls({
  idPrefix,
  provider,
  employers,
  employerId,
  busy,
  hasPreviousReport,
  occupiedMonths,
  selectedEmployerName,
  duplicateMonth,
  month,
  year,
  yearOptions,
  search,
  onEmployerChange,
  onLoadPrevious,
  onMonthChange,
  onYearChange,
  onSearchChange,
}: Props) {
  return (
    <>
      <LoanReportEmployerSelect
        id={`${idPrefix}-employer`}
        employers={employers}
        value={employerId}
        disabled={busy || employers.length === 0}
        hasPreviousReport={hasPreviousReport}
        onChange={onEmployerChange}
        onLoadPrevious={onLoadPrevious}
      />
      <LoanReportDateSearch
        idPrefix={idPrefix}
        provider={provider}
        month={month}
        year={year}
        yearOptions={yearOptions}
        occupiedMonths={occupiedMonths}
        selectedEmployerName={selectedEmployerName}
        duplicateMonth={duplicateMonth}
        search={search}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        onSearchChange={onSearchChange}
      />
    </>
  );
}
