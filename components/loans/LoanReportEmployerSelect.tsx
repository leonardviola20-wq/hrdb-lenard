type EmployerOption = { id: number; name: string };

type Props = {
  id: string;
  employers: EmployerOption[];
  value: string;
  disabled: boolean;
  hasPreviousReport: boolean;
  onChange: (value: string) => void;
  onLoadPrevious: () => void;
};

export default function LoanReportEmployerSelect({
  id,
  employers,
  value,
  disabled,
  hasPreviousReport,
  onChange,
  onLoadPrevious,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-full max-w-xs">
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">
          Employer
        </label>
        <select
          id={id}
          required
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">
            {employers.length > 0 ? "Select employer first" : "No employers available"}
          </option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.name}
            </option>
          ))}
        </select>
        {employers.length === 0 && (
          <p className="mt-1 text-xs text-rose-700">Add an employer before generating a report.</p>
        )}
      </div>
      <span title={value && !hasPreviousReport ? "no previous report" : undefined}>
        <button
          type="button"
          disabled={disabled || !value || !hasPreviousReport}
          aria-label="Load Previous"
          onClick={onLoadPrevious}
          className="h-11 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Load Previous
        </button>
      </span>
    </div>
  );
}
