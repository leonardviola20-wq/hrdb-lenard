export function fullName(employee: { firstName: string; middleName: string | null; lastName: string }): string {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
}

export function money(amount: number | string): string {
  return `₱${(Number(amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function period(report: { applicableMonth: number; applicableYear: number }): string {
  return `${MONTHS[report.applicableMonth - 1]} ${report.applicableYear}`;
}