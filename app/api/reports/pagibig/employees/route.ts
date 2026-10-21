import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;

  try {
    const employees = await prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        status: true,
        pagIbigNumber: true,
        employerId: true,
        employer: { select: { name: true } },
      },
    });
    return NextResponse.json({
      employees: employees.map(({ employer, ...employee }) => ({ ...employee, employerName: employer?.name ?? null })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load all Pag-IBIG report employees error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG report employees" }, { status: 500 });
  }
}