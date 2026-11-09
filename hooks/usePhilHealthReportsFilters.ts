import { useMemo } from "react";
import { Report } from "@/types/philHealthTypes";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function usePhilHealthReportsFilters(
  reports: Report[],
  reportSearch: string,
  reportYearFilter: string
) {
  const reportPageSize = 10;

  const filteredReports = useMemo(() => {
    const query = reportSearch.trim().toLocaleLowerCase();
    return reports.filter((report) => {
      if (reportYearFilter !== "ALL" && String(report.applicableYear) !== reportYearFilter) return false;
      if (!query) return true;
      return [`${months[report.applicableMonth - 1]} ${report.applicableYear}`, report.employerName, report.payment?.transactionDate, report.payment?.transactionConfirmationNumber, report.payment?.eparNumber]
        .some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [reports, reportSearch, reportYearFilter]);

  const reportPageCount = Math.max(1, Math.ceil(filteredReports.length / reportPageSize));

  return {
    filteredReports,
    reportPageCount,
  };
}