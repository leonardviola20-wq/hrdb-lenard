import { fullName as baseFullName, money as baseMoney, period as basePeriod } from "@/lib/philHealthReportHelpers";

export { baseMoney as money, basePeriod as period, baseFullName as fullName };

export function employeeNameWithBoldFirstName(employee: { firstName: string; middleName: string | null; lastName: string }) {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return (
    <>
      {employee.lastName},{" "}
      <span className="font-bold">{employee.firstName}</span>
      {middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}
    </>
  );
}
