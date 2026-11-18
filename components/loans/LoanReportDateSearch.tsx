type Props = {
  idPrefix: string;
  provider: "SSS" | "PAGIBIG";
  month: string;
  year: string;
  yearOptions: string[];
  occupiedMonths: string[];
  selectedEmployerName: string;
  duplicateMonth: boolean;
  search: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function LoanReportDateSearch({
  idPrefix,
  provider,
  month,
  year,
  yearOptions,
  occupiedMonths,
  selectedEmployerName,
  duplicateMonth,
  search,
  onMonthChange,
  onYearChange,
  onSearchChange,
}: Props) {
  const occupiedInYear = occupiedMonths.filter((value) => value.startsWith(`${year}-`));
  const monthName = months[Number(month) - 1];
  const providerName = provider === "SSS" ? "SSS" : "Pag-IBIG";

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div>
        <label htmlFor={`${idPrefix}-month`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Applicable Month
        </label>
        <select
          id={`${idPrefix}-month`}
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          {months.map((monthName, index) => (
            <option
              key={monthName}
              value={String(index + 1).padStart(2, "0")}
              disabled={occupiedMonths.includes(`${year}-${String(index + 1).padStart(2, "0")}`)}
            >
              {monthName}
              {occupiedMonths.includes(`${year}-${String(index + 1).padStart(2, "0")}`)
                ? " (Report exists)"
                : ""}
            </option>
          ))}
        </select>
        {(duplicateMonth || occupiedInYear.length > 0) && (
          <p role="status" className="mt-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-900">
            {duplicateMonth
              ? `A ${providerName} report for ${selectedEmployerName} already exists for ${monthName} ${year}. Select another month.`
              : `Months marked “Report exists” have a generated or posted ${providerName} report for ${selectedEmployerName} in ${year}.`}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-year`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Applicable Year
        </label>
        <select
          id={`${idPrefix}-year`}
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          {yearOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-search`} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Search
        </label>
        <input
          id={`${idPrefix}-search`}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Employee, account no., or loan type"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}
