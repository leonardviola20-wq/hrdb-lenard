export const peso = (value: string | number) =>
  `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const loanStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const loanStatusStyles: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
};
