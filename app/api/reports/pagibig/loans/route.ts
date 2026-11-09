import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";
import { validPagibigYear } from "@/lib/pagibigYear";

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const employerIdParam = request.nextUrl.searchParams.get("employerId");
  const employerId = employerIdParam ? Number(employerIdParam) : null;
  if (employerId !== null && (!Number.isSafeInteger(employerId) || employerId <= 0)) {
    return NextResponse.json({ error: "Invalid employer" }, { status: 400 });
  }
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? validPagibigYear(yearParam) : null;
  try {
    const employer = employerId ? await prisma.employer.findUnique({
      where: { id: employerId },
      select: { id: true, name: true, hdmf: true },
    }) : null;
    const loans = await prisma.pagibigEmployeeLoan.findMany({
      where: { ...(employerId ? { employerId } : {}), ...(year ? { PagibigEmployeeRecord: { year } } : {}) },
      include: {
        employer: { select: { id: true, name: true } },
        PagibigEmployeeRecord: {
          select: {
            year: true,
            employeeId: true,
            employee: { select: { id: true, employeeCode: true, firstName: true, middleName: true, lastName: true, pagIbigNumber: true } },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });
    const items = loans.map((loan) => ({
      id: loan.id,
      recordId: loan.recordId,
      employerId: loan.employerId,
      employerName: loan.employer.name,
      year: loan.PagibigEmployeeRecord.year,
      employeeId: loan.PagibigEmployeeRecord.employeeId,
      employeeName: `${loan.PagibigEmployeeRecord.employee.lastName}, ${loan.PagibigEmployeeRecord.employee.firstName}`,
      employeeCode: loan.PagibigEmployeeRecord.employee.employeeCode,
      pagIbigNumber: loan.PagibigEmployeeRecord.employee.pagIbigNumber,
      loanType: loan.loanType,
      applicationNo: loan.applicationNo,
      loanTermDate: loan.loanTermDate.toISOString().slice(0, 10),
      termYears: loan.termYears,
      termEndDate: loan.termEndDate.toISOString().slice(0, 10),
      amount: loan.amount?.toString() ?? "0",
      status: loan.status,
    }));
    return NextResponse.json(
      { employer: employer ? { id: employer.id, name: employer.name, pagibigNumber: employer.hdmf } : null, loans: items },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load Pag-IBIG loans error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG loans" }, { status: 500 });
  }
}


