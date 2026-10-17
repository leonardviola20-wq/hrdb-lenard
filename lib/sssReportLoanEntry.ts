export function isLoanAccountLinkedToReportEmployee<T extends { employeeId: number | null }>(
  loan: T | undefined,
  employeeId: number,
): loan is T & { employeeId: number } {
  return loan?.employeeId === employeeId;
}
